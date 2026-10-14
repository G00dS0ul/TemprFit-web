import mongoose from 'mongoose';

const GymSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: {
      type: String,
      enum: ['commercial_gym', 'crossfit_box', 'powerlifting_gym', 'community_fitness_club', 'calisthenics_park'],
      default: 'commercial_gym',
    },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    country: { type: String, default: 'Nigeria' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        // [longitude, latitude] per GeoJSON specification
        type: [Number],
        required: true,
      },
    },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    openingHours: { type: String, default: 'Mon-Sat: 6:00 AM - 9:00 PM, Sun: 8:00 AM - 6:00 PM' },
    pricing: {
      dailyPass: { type: Number, default: 2000 }, // e.g. in NGN
      monthlyMembership: { type: Number, default: 25000 },
      currency: { type: String, default: 'NGN' },
    },
    amenities: [{ type: String }], // ['Free Weights', 'Squat Racks', 'Cardio Deck', 'Showers', 'AC', 'Personal Trainers', 'Steam Room']
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 12 },
    isVerified: { type: Boolean, default: true },
    photos: [{ type: String }],
    communityGroupUrl: { type: String, default: '' }, // WhatsApp/Telegram/Pod invite
  },
  { timestamps: true }
);

// 2dsphere index for geoNear queries
GymSchema.index({ location: '2dsphere' });
GymSchema.index({ name: 'text', city: 'text', address: 'text' });

export default mongoose.models.Gym || mongoose.model('Gym', GymSchema);
