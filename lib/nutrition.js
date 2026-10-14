import Food from '@/models/Food'
import { searchSpoonacularIngredients } from '@/lib/spoonacular'
import { searchUSDAFoods } from '@/lib/usda'
import { searchUnsplashFoodPhoto } from '@/lib/unsplash'

import { AFRICAN_FOODS } from '@/lib/seed-data/african-foods'

// Cache-first food search:
//   1. Check our own Food collection for this search term — free, instant.
//   2. Check curated regional/African foods dataset (jollof, egusi, pounded yam, etc.)
//   3. Miss -> Spoonacular (nutrition + a real matched image in one call).
//   4. Spoonacular down/quota'd -> USDA (nutrition, no image) + Unsplash
export async function searchFoods(query) {
  const term = query.trim().toLowerCase()
  if (!term) return []

  // 1. Check existing MongoDB cached foods
  const cached = await Food.find({ 
    $or: [
      { searchTerms: term },
      { name: { $regex: term, $options: 'i' } }
    ]
  }).limit(8).lean()
  if (cached.length > 0) return cached

  // 2. Check curated African & regional foods
  const localMatches = AFRICAN_FOODS.filter((f) =>
    f.name.toLowerCase().includes(term) || f.searchTerms.some((t) => t.includes(term) || term.includes(t))
  )

  if (localMatches.length > 0) {
    // Lazily cache matched local items into Mongo
    const saved = []
    for (const match of localMatches) {
      try {
        const doc = await Food.findOneAndUpdate(
          { name: match.name },
          { ...match, $addToSet: { searchTerms: term } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean()
        saved.push(doc)
      } catch {
        saved.push(match)
      }
    }
    return saved
  }

  const errors = []
  let results = []

  try {
    const spoonacularResults = await searchSpoonacularIngredients(term, 6)
    results = spoonacularResults.map((r) => ({
      ...r,
      source: 'spoonacular',
      imageSource: r.imageUrl ? 'spoonacular' : 'none',
    }))
  } catch (err) {
    errors.push(`Spoonacular: ${err.message}`)
  }

  if (results.length === 0) {
    try {
      const usdaResults = await searchUSDAFoods(term, 6)
      // USDA never returns images, so try one Unsplash lookup for the
      // whole batch (one photo shared across the search-term results is
      // an acceptable tradeoff to stay well under Unsplash's rate limit).
      let fallbackImage = null
      try {
        fallbackImage = await searchUnsplashFoodPhoto(term)
      } catch (imgErr) {
        errors.push(`Unsplash: ${imgErr.message}`)
      }

      results = usdaResults.map((r) => ({
        ...r,
        source: 'usda',
        imageUrl: fallbackImage?.imageUrl || '',
        imageSource: fallbackImage ? 'unsplash' : 'none',
        imageAttribution: fallbackImage
          ? { photographerName: fallbackImage.photographerName, photographerUrl: fallbackImage.photographerUrl }
          : undefined,
      }))
    } catch (err) {
      errors.push(`USDA: ${err.message}`)
    }
  }

  // 4. If foreign databases (Spoonacular/USDA) miss, trigger Live AI Nutritionist
  if (results.length === 0) {
    try {
      const { estimateFoodWithAI } = await import('@/lib/ai-food-estimator')
      const aiResults = await estimateFoodWithAI(term)
      if (aiResults && aiResults.length > 0) {
        results = aiResults
      }
    } catch (aiErr) {
      errors.push(`AI Estimator: ${aiErr.message}`)
    }
  }

  if (results.length === 0) {
    const err = new Error(
      errors.length ? `All nutrition sources failed — ${errors.join('; ')}` : 'No results found for that food.'
    )
    err.isSearchMiss = errors.length === 0 // distinguish "not found" from "all APIs down" in the route
    throw err
  }

  const saved = await Food.insertMany(
    results.map((r) => ({ ...r, searchTerms: [term] })),
    { ordered: false }
  ).catch(async (bulkErr) => {
    // Duplicate-ish inserts aren't fatal — fall back to returning what we
    // built in memory so the user still gets a response this request.
    console.error('[nutrition] Food.insertMany partial failure:', bulkErr.message)
    return results
  })

  return saved
}

// Rough per-serving macro math shared by the log route and the UI preview.
export function scaleMacros(food, servings) {
  const s = Number(servings) || 1
  return {
    calories: Math.round((food.calories || 0) * s),
    protein: Math.round((food.protein || 0) * s * 10) / 10,
    carbs: Math.round((food.carbs || 0) * s * 10) / 10,
    fat: Math.round((food.fat || 0) * s * 10) / 10,
  }
}
