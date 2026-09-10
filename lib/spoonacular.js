// Thin wrapper around Spoonacular's Food API (api.spoonacular.com).
// Returns nutrition data AND an image matched to the actual dish/ingredient
// in one call — no SDK needed. Free tier: ~150 requests/day, cache results
// (see lib/nutrition.js) rather than re-querying on every page load.
// Get a key at https://spoonacular.com/food-api/console#Dashboard

const BASE_URL = 'https://api.spoonacular.com'

export class SpoonacularConfigError extends Error {}
export class SpoonacularRequestError extends Error {}

function getApiKey() {
  const apiKey = process.env.SPOONACULAR_API_KEY
  if (!apiKey) {
    console.error('[Spoonacular] SPOONACULAR_API_KEY is not set in the server environment.')
    throw new SpoonacularConfigError(
      'SPOONACULAR_API_KEY is not set. Get a free key at https://spoonacular.com/food-api/console#Dashboard and add it to .env.local.'
    )
  }
  return apiKey
}

async function handleResponse(res, label) {
  if (res.status === 402) {
    throw new SpoonacularRequestError("You've hit Spoonacular's daily free-tier quota. Try again tomorrow, or fall back to USDA.")
  }
  if (res.status === 401) {
    throw new SpoonacularRequestError('Spoonacular rejected the API key — double check SPOONACULAR_API_KEY in .env.local.')
  }
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    console.error(`[Spoonacular] ${label} error ${res.status}:`, bodyText.slice(0, 500))
    throw new SpoonacularRequestError(`Spoonacular API error (${res.status}) during ${label}.`)
  }
  return res.json()
}

/**
 * Searches ingredients by name, with nutrition + a matched image per item.
 * Good fit for whole/raw foods ("chicken breast", "oats").
 */
export async function searchSpoonacularIngredients(query, number = 6) {
  const apiKey = getApiKey()
  const url = `${BASE_URL}/food/ingredients/search?apiKey=${apiKey}&query=${encodeURIComponent(query)}&number=${number}&metaInformation=true`

  let res
  try {
    res = await fetch(url)
  } catch (err) {
    throw new SpoonacularRequestError(`Could not reach Spoonacular: ${err.message}`)
  }
  const data = await handleResponse(res, 'ingredient search')
  const results = data?.results || []

  // Ingredient search doesn't return macros directly — fetch each item's
  // nutrition in parallel (Spoonacular allows this; it's still 1 quota
  // point per call, so callers should cache aggressively).
  const withNutrition = await Promise.all(
    results.map(async (item) => {
      try {
        const infoUrl = `${BASE_URL}/food/ingredients/${item.id}/information?apiKey=${apiKey}&amount=100&unit=grams`
        const infoRes = await fetch(infoUrl)
        const info = await handleResponse(infoRes, 'ingredient info')
        const nutrients = info?.nutrition?.nutrients || []
        const findAmt = (name) => nutrients.find((n) => n.name === name)?.amount || 0
        return {
          sourceId: String(item.id),
          name: item.name,
          calories: findAmt('Calories'),
          protein: findAmt('Protein'),
          carbs: findAmt('Carbohydrates'),
          fat: findAmt('Fat'),
          servingSize: 100,
          servingUnit: 'g',
          imageUrl: item.image ? `https://img.spoonacular.com/ingredients_100x100/${item.image}` : '',
        }
      } catch {
        return null
      }
    })
  )

  return withNutrition.filter(Boolean)
}

/**
 * Searches complete recipes/dishes with nutrition + a dish photo per item.
 * Good fit for prepared meals ("grilled chicken bowl", "veggie stir fry").
 */
export async function searchSpoonacularRecipes(query, number = 6) {
  const apiKey = getApiKey()
  const url = `${BASE_URL}/recipes/complexSearch?apiKey=${apiKey}&query=${encodeURIComponent(query)}&number=${number}&addRecipeNutrition=true`

  let res
  try {
    res = await fetch(url)
  } catch (err) {
    throw new SpoonacularRequestError(`Could not reach Spoonacular: ${err.message}`)
  }
  const data = await handleResponse(res, 'recipe search')
  const results = data?.results || []

  return results.map((r) => {
    const nutrients = r.nutrition?.nutrients || []
    const findAmt = (name) => nutrients.find((n) => n.name === name)?.amount || 0
    return {
      sourceId: String(r.id),
      name: r.title,
      calories: findAmt('Calories'),
      protein: findAmt('Protein'),
      carbs: findAmt('Carbohydrates'),
      fat: findAmt('Fat'),
      servingSize: r.servings || 1,
      servingUnit: 'serving',
      imageUrl: r.image || '',
    }
  })
}
