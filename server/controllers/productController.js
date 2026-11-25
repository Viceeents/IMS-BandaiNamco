import Product from '../models/Product.js';
import StockLog from '../models/StockLog.js';

function actor(user) {
  return { performedBy: user?._id || null, performedByName: user?.name || 'System' };
}

export async function getStats(req, res) {
  const [summary, byCategory, inbound, outbound] = await Promise.all([
    Product.aggregate([{ $group: {
      _id: null,
      totalSkus: { $sum: 1 },
      totalInventoryValue: { $sum: { $multiply: ['$price', '$stock'] } },
      lowStockCount: { $sum: { $cond: [{ $lte: ['$stock', '$minStock'] }, 1, 0] } }
    } }]),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 }, units: { $sum: '$stock' } } }, { $sort: { _id: 1 } }]),
    StockLog.aggregate([{ $match: { type: 'IN', createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }, { $group: { _id: null, units: { $sum: '$quantityChanged' } } }]),
    StockLog.aggregate([{ $match: { type: 'OUT', createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }, { $group: { _id: null, units: { $sum: '$quantityChanged' } } }])
  ]);
  const totals = summary[0] || { totalSkus: 0, totalInventoryValue: 0, lowStockCount: 0 };
  res.json({ ...totals, byCategory, today: { unitsRestocked: inbound[0]?.units || 0, unitsSold: outbound[0]?.units || 0 } });
}

export async function listProducts(req, res) {
  const { search, category, franchise, status } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (franchise) filter.franchise = franchise;
  if (status === 'low') filter.$expr = { $lte: ['$stock', '$minStock'] };
  if (status === 'out') filter.stock = 0;
  if (search) {
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = ['name', 'sku', 'franchise', 'variant'].map((field) => ({ [field]: { $regex: escaped, $options: 'i' } }));
  }
  const products = await Product.find(filter).sort({ name: 1 }).lean();
  res.json(products);
}

export async function getProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Item not found.' });
  return res.json(product);
}

export async function createProduct(req, res) {
  const product = await Product.create(req.body);
  await StockLog.create({
    product: product._id, productName: product.name, sku: product.sku, type: 'CREATED',
    quantityChanged: product.stock, previousStock: 0, newStock: product.stock,
    reason: 'Item created', ...actor(req.user)
  });
  return res.status(201).json(product);
}

export async function updateProduct(req, res) {
  const allowed = ['sku', 'name', 'category', 'franchise', 'variant', 'price', 'minStock', 'imageUrl'];
  const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const product = await Product.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: 'Item not found.' });
  return res.json(product);
}

export async function adjustStock(req, res) {
  const { type, quantity, reason = '' } = req.body;
  if (!['IN', 'OUT', 'ADJUST'].includes(type)) return res.status(400).json({ message: 'Type must be IN, OUT, or ADJUST.' });
  if (!Number.isInteger(quantity) || quantity <= 0) return res.status(400).json({ message: 'Quantity must be a positive whole number.' });

  const current = await Product.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Item not found.' });
  const previousStock = current.stock;
  const newStock = type === 'OUT' ? previousStock - quantity : type === 'IN' ? previousStock + quantity : quantity;
  if (newStock < 0) return res.status(400).json({ message: 'Stock cannot fall below zero.' });
  const product = await Product.findOneAndUpdate(
    { _id: current._id, stock: previousStock },
    { $set: { stock: newStock } },
    { new: true, runValidators: true }
  );
  if (!product) return res.status(409).json({ message: 'Stock changed during this request. Refresh and try again.' });

  try {
    await StockLog.create({
      product: product._id, productName: product.name, sku: product.sku, type,
      quantityChanged: type === 'ADJUST' ? newStock - previousStock : quantity,
      previousStock, newStock, reason, ...actor(req.user)
    });
  } catch (error) {
    await Product.updateOne({ _id: product._id, stock: newStock }, { $set: { stock: previousStock } });
    throw error;
  }
  return res.json(product);
}

export async function deleteProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Item not found.' });
  await StockLog.create({
    product: product._id, productName: product.name, sku: product.sku, type: 'DELETED',
    quantityChanged: -product.stock, previousStock: product.stock, newStock: 0,
    reason: 'Item deleted', ...actor(req.user)
  });
  await product.deleteOne();
  return res.json({ message: 'Item deleted.' });
}
