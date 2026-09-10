// Thin wrapper around Unsplash's Search Photos endpoint (api.unsplash.com).
// Used as a fallback when Spoonacular has no matched image for a food (e.g.
// a raw USDA ingredient) — free tier, but Unsplash's API terms require
// attribution, which we store alongside the image (see models/Food.js) and
// must be shown in the UI wherever the photo appears.
// Get a key at https://unsplash.com/developers -> New Application

const BASE_URL = 'https://api.unsplash.com'

export class UnsplashConfigError extends Error {}
export class UnsplashRequestError extends Error {}

function getAccessKey() {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) {
    console.error('[Unsplash] UNSPLASH_ACCESS_KEY is not set in the server environment.')
    throw new UnsplashConfigError(
      'UNSPLASH_ACCESS_KEY is not set. Get a free key at https://unsplash.com/developers and add it to .env.local.'
    )
  }
  return key
}

/**
 * Finds one relevant generic food photo for a search term.
 * @param {string} query e.g. "grilled chicken", "oatmeal bowl"
 * @returns {Promise<{imageUrl:string, photographerName:string, photographerUrl:string}|null>}
 */
export async function searchUnsplashFoodPhoto(query) {
  const accessKey = getAccessKey()
  const url = `${BASE_URL}/search/photos?query=${encodeURIComponent(`${query} food`)}&per_page=1&orientation=squarish`

  let res
  try {
    res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    })
  } catch (err) {
    throw new UnsplashRequestError(`Could not reach Unsplash: ${err.message}`)
  }

  if (res.status === 403) {
    throw new UnsplashRequestError("Unsplash rate limit hit (50 requests/hour on the free 'Demo' tier).")
  }
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    console.error(`[Unsplash] API error ${res.status}:`, bodyText.slice(0, 500))
    throw new UnsplashRequestError(`Unsplash API error (${res.status}).`)
  }

  const data = await res.json()
  const photo = data?.results?.[0]
  if (!photo) return null

  return {
    imageUrl: photo.urls?.small || photo.urls?.regular || '',
    photographerName: photo.user?.name || 'Unsplash',
    photographerUrl: photo.user?.links?.html || 'https://unsplash.com',
  }
}
