import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import StockLog from '../models/StockLog.js';

const sampleProducts = [
  { sku: 'BN-ER-VIN-001', name: 'Elden Ring Original Soundtrack Vinyl', category: 'Vinyl', franchise: 'Elden Ring', variant: 'Gold Disc Edition', price: 3490, stock: 8, minStock: 3 },
  { sku: 'BN-ER-PLU-001', name: 'Alexander Warrior Jar Plush', category: 'Plushie', franchise: 'Elden Ring', variant: 'Large', price: 1890, stock: 3, minStock: 5 },
  { sku: 'BN-ER-APP-001', name: 'Malenia Scarlet Valkyrie Hoodie', category: 'Apparel', franchise: 'Elden Ring', variant: 'M', price: 3290, stock: 12, minStock: 4 },
  { sku: 'BN-ER-FIG-001', name: 'Tarnished 1/6 Scale Figure', category: 'Figure', franchise: 'Elden Ring', variant: 'Collector Edition', price: 11990, stock: 2, minStock: 3 },
  { sku: 'BN-DS-FIG-001', name: 'Solaire of Astora Figure', category: 'Figure', franchise: 'Dark Souls', variant: 'Praise the Sun', price: 5490, stock: 7, minStock: 2 },
  { sku: 'BN-TK-APP-001', name: 'Jin Kazama Graphic Tee', category: 'Apparel', franchise: 'Tekken', variant: 'L', price: 1490, stock: 15, minStock: 5 },
  { sku: 'BN-PM-PLU-001', name: 'Pac-Man Ghost Plush Set', category: 'Plushie', franchise: 'Pac-Man', variant: '4-piece set', price: 1990, stock: 0, minStock: 4 },
  { sku: 'BN-GD-ACC-001', name: 'Gundam Aerial Display Stand', category: 'Accessories', franchise: 'Gundam', variant: 'Clear blue', price: 790, stock: 20, minStock: 5 },
  { sku: 'BN-ER-ACC-001', name: 'Erdtree Emblem Metal Pin', category: 'Accessories', franchise: 'Elden Ring', variant: 'Antique gold', price: 590, stock: 24, minStock: 8 },
  { sku: 'BN-DS-APP-001', name: 'Bonfire Crest T-Shirt', category: 'Apparel', franchise: 'Dark Souls', variant: 'S', price: 1290, stock: 5, minStock: 5 }
];

try {
  await connectToDatabase();
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 8 characters in server/.env.');
  }

  const normalizedEmail = ADMIN_EMAIL.trim().toLowerCase();
  let admin = await User.findOne({ email: normalizedEmail });
  let createdAdmin = false;
  if (!admin) {
    admin = await User.create({ name: ADMIN_NAME, email: normalizedEmail, password: ADMIN_PASSWORD, role: 'Admin' });
    createdAdmin = true;
    console.log(`Created administrator: ${admin.email}`);
  } else if (admin.role !== 'Admin') {
    admin.role = 'Admin';
    await admin.save();
    console.log(`Promoted existing account to administrator: ${admin.email}`);
  } else {
    console.log(`Administrator already exists: ${admin.email}; password unchanged.`);
  }

  for (const productData of sampleProducts) {
    let product = await Product.findOne({ sku: productData.sku });
    if (!product) product = await Product.create(productData);
    const hasCreationLog = await StockLog.exists({ product: product._id, type: 'CREATED' });
    if (!hasCreationLog) {
      await StockLog.create({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        type: 'CREATED',
        quantityChanged: product.stock,
        previousStock: 0,
        newStock: product.stock,
        reason: 'Initial Store Stock',
        performedBy: admin._id,
        performedByName: admin.name
      });
    }
  }
  if (createdAdmin) {
    console.log(`Seed complete! Login: ${normalizedEmail} / ${ADMIN_PASSWORD}`);
  } else {
    console.log(`Seed complete! Administrator ${normalizedEmail} already exists; its password was left unchanged.`);
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
