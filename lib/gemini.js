// Thin wrapper around Google's Gemini API (generativelanguage.googleapis.com).
// Uses plain fetch — no SDK dependency, so this needs nothing added to
// package.json. Get a free key (no credit card) at https://aistudio.google.com.

const DEFAULT_MODEL = 'gemini-3.5-flash-lite'

export class GeminiConfigError extends Error {}
export class GeminiRequestError extends Error {}

/**
 * @param {object} params
 * @param {string} params.systemPrompt - grounding instructions + real user context
 * @param {{role: 'user'|'assistant', content: string}[]} params.history - prior turns, oldest first
 * @param {string} params.userMessage - the new message to answer
 * @param {string} params.responseMimeType - optional mime type for the response (e.g. application/json)
 * @returns {Promise<string>} the model's reply text
 */
export async function askGemini({ systemPrompt, history = [], userMessage, responseMimeType }) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[Gemini] GEMINI_API_KEY is not set in the server environment.')
    throw new GeminiConfigError(
      'GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com and add it to .env.local.'
    )
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  console.log(`[Gemini] Requesting ${model} (key present, ${apiKey.length} chars)`)

  const contents = [
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  let generationConfig = { temperature: 0.6, maxOutputTokens: 8192 }
  if (responseMimeType) {
    generationConfig.responseMimeType = responseMimeType
  }

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig,
      }),
    })
  } catch (err) {
    console.error('[Gemini] Network/fetch failure:', err.message)
    throw new GeminiRequestError(`Could not reach Gemini: ${err.message}`)
  }

  if (res.status === 429) {
    console.error('[Gemini] Rate limited (429) — free-tier requests/min or requests/day limit hit.')
    throw new GeminiRequestError(
      "You've hit Gemini's free-tier rate limit (requests per minute/day). Wait a bit and try again."
    )
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    console.error(`[Gemini] API error ${res.status}:`, bodyText.slice(0, 1000))
    throw new GeminiRequestError(`Gemini API error (${res.status}): ${bodyText.slice(0, 300)}`)
  }

  const data = await res.json()

  const blockReason = data?.promptFeedback?.blockReason
  if (blockReason) {
    console.error('[Gemini] Response blocked:', blockReason)
    throw new GeminiRequestError(`Gemini declined to respond (${blockReason}). Try rephrasing.`)
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
  if (!text.trim()) {
    console.error('[Gemini] Empty response. Raw payload:', JSON.stringify(data).slice(0, 1000))
    throw new GeminiRequestError('Gemini returned an empty response. Try again.')
  }

  return text.trim()
}
