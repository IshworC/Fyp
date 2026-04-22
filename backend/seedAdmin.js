import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import config from './config/config.js';
import User from './models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('✓ Connected to MongoDB');

    // Admin user data (YOUR EMAIL)
    const adminUser = {
      name: 'Admin User',
      email: 'ishworchalise1@gmail.com', // Your email
      password: 'admin@123',
      role: 'admin',
      emailVerified: true // Set to true so no email verification needed
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: adminUser.email,
      role: 'admin' 
    });
    
    if (existingAdmin) {
      console.log(`⚠ Admin user with email ${adminUser.email} already exists.`);
      console.log('Do you want to update the password? (yes/no)');
      
      // For simplicity, we'll update password if admin exists
      const hashedPassword = await bcryptjs.hash(adminUser.password, 10);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('✓ Admin password updated');
    } else {
      // Hash password
      const hashedPassword = await bcryptjs.hash(adminUser.password, 10);

      // Create admin user
      const user = await User.create({
        ...adminUser,
        password: hashedPassword
      });

      console.log(`✓ Created admin user: ${adminUser.email}`);
    }

    console.log('\n✅ Admin user created/updated successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Admin Account:');
    console.log(`  📧 Email: ${adminUser.email}`);
    console.log(`  🔑 Password: ${adminUser.password}`);
    console.log(`  🎯 Role: ${adminUser.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // List all admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log('📊 Current Admin Users:');
    adminUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name})`);
    });

    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Run the seed function
seedAdmin();