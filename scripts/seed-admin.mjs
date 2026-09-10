import mongoose from 'mongoose';

const CouponCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  planLevel: { type: String, enum: ['pro', 'max'], required: true },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
});
const CouponCode = mongoose.models.CouponCode || mongoose.model('CouponCode', CouponCodeSchema);

const SystemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});
const SystemConfig = mongoose.models.SystemConfig || mongoose.model('SystemConfig', SystemConfigSchema);

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Seed Admin Password
  await SystemConfig.findOneAndUpdate(
    { key: 'ADMIN_PASSWORD' },
    { $setOnInsert: { value: 'EDSHEERAN11' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('Admin password configured.');

  // Seed Coupons
  const coupons = [
    { code: 'EDSHEERAN200', planLevel: 'pro' },
    { code: 'EDSHEERAN201', planLevel: 'max' },
  ];

  for (const c of coupons) {
    await CouponCode.findOneAndUpdate(
      { code: c.code },
      { $setOnInsert: c },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log('Coupons seeded.');

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
