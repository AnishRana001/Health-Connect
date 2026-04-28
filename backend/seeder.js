/**
 * Admin Seed Script
 * Usage: node seeder.js
 *
 * Creates the initial admin user if one doesn't already exist.
 * Change the password after first login!
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const ADMIN_NAME     = 'Admin';
const ADMIN_EMAIL    = 'admin@healthconnect.com';
const ADMIN_PASSWORD = 'Admin@123456';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL });

    if (existing) {
      console.log(`ℹ️  Admin already exists: ${ADMIN_EMAIL}`);
      console.log('   Run this script only once, or delete the existing admin first.');
      process.exit(0);
    }

    await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role:     'admin',
    });

    console.log('\n🎉 Admin user created successfully!');
    console.log('─────────────────────────────────');
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log('─────────────────────────────────');
    console.log('⚠️  Please change the password after your first login!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder error:', error.message);
    process.exit(1);
  }
};

seed();
