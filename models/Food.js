import mongoose from 'mongoose'

// A cached, normalized food/ingredient record. Populated lazily the first
// time a search term is looked up (see lib/nutrition.js), then reused for
// every later search/log so we don't burn Spoonacular's 150-req/day free
// tier or USDA's rate limit on repeat lookups.
const FoodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Where the nutrition numbers came from — lets us show/debug provenance
    // and avoid re-querying a source that already failed for this item.
    source: { type: String, enum: ['usda', 'spoonacular', 'manual'], required: true },
    sourceId: { type: String, default: null }, // e.g. USDA fdcId or Spoonacular id, as a string

    calories: { type: Number, required: true }, // per serving
    protein: { type: Number, default: 0 }, // grams per serving
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },

    servingSize: { type: Number, default: 100 },
    servingUnit: { type: String, default: 'g' },

    imageUrl: { type: String, default: '' },
    imageSource: { type: String, enum: ['spoonacular', 'unsplash', 'none'], default: 'none' },
    imageAttribution: {
      // Required for Unsplash API compliance when imageSource === 'unsplash'.
      photographerName: { type: String, default: '' },
      photographerUrl: { type: String, default: '' },
    },

    searchTerms: [{ type: String, index: true }], // lowercased query strings that resolved to this doc
  },
  { timestamps: true }
)

FoodSchema.index({ name: 'text' })
FoodSchema.index({ source: 1, sourceId: 1 })

export default mongoose.models.Food || mongoose.model('Food', FoodSchema)
