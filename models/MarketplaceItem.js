import mongoose from 'mongoose';

const MarketplaceItemSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  condition: {
    type: String,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Used'],
    required: true,
  },
  category: {
    type: String,
    enum: ['Weights & Dumbbells', 'Cardio', 'Machines', 'Accessories', 'Apparel', 'Supplements', 'Other'],
    default: 'Other',
  },
  images: [{
    type: String, // Cloudinary URLs
  }],
  status: {
    type: String,
    enum: ['Available', 'Pending', 'Sold'],
    default: 'Available',
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  views: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

export default mongoose.models.MarketplaceItem || mongoose.model('MarketplaceItem', MarketplaceItemSchema);
