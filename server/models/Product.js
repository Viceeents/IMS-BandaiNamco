import mongoose from 'mongoose';

export const PRODUCT_CATEGORIES = ['Vinyl', 'Plushie', 'Apparel', 'Figure', 'Accessories'];
export const FRANCHISES = ['Elden Ring', 'Dark Souls', 'Tekken', 'Pac-Man', 'Gundam', 'Other'];

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 40 },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
  franchise: { type: String, enum: FRANCHISES, required: true },
  variant: { type: String, trim: true, default: '', maxlength: 120 },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
  minStock: { type: Number, min: 0, default: 5, validate: Number.isInteger },
  imageUrl: { type: String, trim: true, default: '' }
}, { timestamps: true });

productSchema.index({ name: 'text', sku: 'text', franchise: 'text', variant: 'text' });

export default mongoose.model('Product', productSchema);
