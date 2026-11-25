import mongoose from 'mongoose';

export async function connectToDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is missing. Copy .env.example to .env and configure it.');
  await mongoose.connect(uri);
  console.log(`MongoDB Connected: ${mongoose.connection.host}`);
}
