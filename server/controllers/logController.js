import StockLog from '../models/StockLog.js';

export async function listLogs(req, res) {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.sku) filter.sku = String(req.query.sku).trim().toUpperCase();
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 500);
  const logs = await StockLog.find(filter)
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json(logs);
}
