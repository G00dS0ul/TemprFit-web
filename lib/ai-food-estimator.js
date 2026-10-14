import { askGemini } from '@/lib/gemini';
import { searchUnsplashFoodPhoto } from '@/lib/unsplash';

/**
 * Live AI Nutritionist fallback for regional, cultural, or unlisted foods.
 * Estimates accurate calories, protein, carbs, and fat per standard serving
 * and fetches a real image from Unsplash.
 *
 * @param {string} query - The food name searched (e.g., "Afang soup", "Banga and starch", "Kilishi")
 * @returns {Promise<Array<object>>} Formatted Food schema objects ready to cache and display
 */
export async function estimateFoodWithAI(query) {
  const term = query.trim();
  if (!term) return [];

  const systemPrompt = `You are an expert sports nutritionist and food scientist specializing in global, African, Asian, and regional ethnic cuisines.
When given a food or dish name, provide realistic, scientifically sound nutritional estimates for standard single portions.
Respond with ONLY valid raw JSON array containing 1 to 3 relevant variations or portion sizes.
Do NOT output markdown fences or commentary.

JSON shape:
[
  {
    "name": "Food Name with portion (e.g. Afang Soup with Beef & Fish, 1 bowl)",
    "calories": 380,
    "protein": 28,
    "carbs": 10,
    "fat": 24,
    "servingSize": 250,
    "servingUnit": "g"
  }
]`;

  try {
    const rawReply = await askGemini({
      systemPrompt,
      userMessage: `Analyze this food dish: "${term}". Provide realistic macronutrients per standard serving.`,
    });

    const cleaned = rawReply.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed) || parsed.length === 0) return [];

    // Fetch an authentic food image from Unsplash
    let fallbackImage = null;
    try {
      fallbackImage = await searchUnsplashFoodPhoto(term);
    } catch {
      fallbackImage = null;
    }

    return parsed.map((item) => ({
      name: item.name,
      calories: Math.max(0, Math.round(Number(item.calories) || 0)),
      protein: Math.max(0, Math.round(Number(item.protein) || 0)),
      carbs: Math.max(0, Math.round(Number(item.carbs) || 0)),
      fat: Math.max(0, Math.round(Number(item.fat) || 0)),
      servingSize: Number(item.servingSize) || 100,
      servingUnit: item.servingUnit || 'g',
      source: 'manual',
      sourceId: 'ai-estimated',
      imageUrl: fallbackImage?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      imageSource: fallbackImage ? 'unsplash' : 'none',
      imageAttribution: fallbackImage
        ? { photographerName: fallbackImage.photographerName, photographerUrl: fallbackImage.photographerUrl }
        : undefined,
      searchTerms: [term.toLowerCase()],
    }));
  } catch (err) {
    console.error('[estimateFoodWithAI] Failed:', err.message);
    return [];
  }
}
