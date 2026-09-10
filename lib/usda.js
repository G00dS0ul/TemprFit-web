// Thin wrapper around USDA FoodData Central (api.nal.usda.gov).
// Free, uncapped for reasonable use, public-domain data — no SDK needed.
// Get a key (instant) at https://fdc.nal.usda.gov/api-key-signup.html

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1'

export class USDAConfigError extends Error {}
export class USDARequestError extends Error {}

function getApiKey() {
  const apiKey = process.env.USDA_FDC_API_KEY
  if (!apiKey) {
    console.error('[USDA] USDA_FDC_API_KEY is not set in the server environment.')
    throw new USDAConfigError(
      'USDA_FDC_API_KEY is not set. Get a free key at https://fdc.nal.usda.gov/api-key-signup.html and add it to .env.local.'
    )
  }
  return apiKey
}

// Pulls the four macros off a FoodData Central nutrient array. USDA reports
// nutrients by number, not a stable key, so we match on nutrientNumber.
const NUTRIENT_NUMBERS = { calories: '208', protein: '203', carbs: '205', fat: '204' }

function extractMacros(foodNutrients = []) {
  const macros = { calories: 0, protein: 0, carbs: 0, fat: 0 }
  for (const n of foodNutrients) {
    const num = String(n.nutrientNumber ?? n.nutrient?.number ?? '')
    const value = n.value ?? n.amount ?? 0
    if (num === NUTRIENT_NUMBERS.calories) macros.calories = value
    else if (num === NUTRIENT_NUMBERS.protein) macros.protein = value
    else if (num === NUTRIENT_NUMBERS.carbs) macros.carbs = value
    else if (num === NUTRIENT_NUMBERS.fat) macros.fat = value
  }
  return macros
}

/**
 * Searches USDA's Foundation + SR Legacy foods for a query term.
 * @param {string} query
 * @param {number} pageSize
 * @returns {Promise<Array<{sourceId:string,name:string,calories:number,protein:number,carbs:number,fat:number,servingSize:number,servingUnit:string}>>}
 */
export async function searchUSDAFoods(query, pageSize = 8) {
  const apiKey = getApiKey()
  const url = `${BASE_URL}/foods/search?api_key=${apiKey}`

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        pageSize,
        dataType: ['Foundation', 'SR Legacy'],
      }),
    })
  } catch (err) {
    console.error('[USDA] Network/fetch failure:', err.message)
    throw new USDARequestError(`Could not reach USDA FoodData Central: ${err.message}`)
  }

  if (res.status === 429) {
    throw new USDARequestError("You've hit USDA's rate limit (1000 requests/hour). Wait a bit and try again.")
  }
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    console.error(`[USDA] API error ${res.status}:`, bodyText.slice(0, 500))
    throw new USDARequestError(`USDA API error (${res.status}).`)
  }

  const data = await res.json()
  const foods = data?.foods || []

  return foods.map((f) => {
    const macros = extractMacros(f.foodNutrients)
    return {
      sourceId: String(f.fdcId),
      name: f.description,
      ...macros,
      // USDA nutrient values are per 100g for these data types.
      servingSize: 100,
      servingUnit: 'g',
    }
  })
}
