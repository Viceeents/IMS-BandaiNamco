import mongoose from 'mongoose';

const stockLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true, uppercase: true },
  type: { type: String, enum: ['IN', 'OUT', 'ADJUST', 'CREATED', 'DELETED'], required: true },
  quantityChanged: { type: Number, required: true, validate: Number.isInteger },
  previousStock: { type: Number, required: true, min: 0 },
  newStock: { type: Number, required: true, min: 0 },
  reason: { type: String, trim: true, default: '', maxlength: 500 },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  performedByName: { type: String, trim: true, default: 'System' }
}, { timestamps: { createdAt: true, updatedAt: false } });

stockLogSchema.index({ createdAt: -1 });
export default mongoose.model('StockLog', stockLogSchema);
