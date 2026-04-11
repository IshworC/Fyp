import mongoose from 'mongoose';
import dotenv from 'dotenv';
import config from './config/config.js';
import Venue from './models/Venue.js';
import VenueRegistration from './models/VenueRegistration.js';
import User from './models/User.js';

dotenv.config();

async function testVenues() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Check all venues in database
    console.log('=== ALL VENUES IN DATABASE ===');
    const allVenues = await Venue.find({}).populate('owner', 'name email');
    console.log(`Total venues: ${allVenues.length}`);
    console.log(JSON.stringify(allVenues, null, 2));

    console.log('\n=== APPROVED VENUES ===');
    const approvedVenues = await Venue.find({ isApproved: true }).populate('owner', 'name email');
    console.log(`Approved venues: ${approvedVenues.length}`);
    console.log(JSON.stringify(approvedVenues, null, 2));

    console.log('\n=== ALL VENUE REGISTRATIONS ===');
    const registrations = await VenueRegistration.find({});
    console.log(`Total registrations: ${registrations.length}`);
    registrations.forEach((reg, index) => {
      console.log(`\nRegistration ${index + 1}:`);
      console.log(`  Status: ${reg.registrationStatus}`);
      console.log(`  Venue Name: ${reg.venueName}`);
      console.log(`  Owner ID: ${reg.owner}`);
      console.log(`  Venue ID: ${reg.venue || 'None'}`);
      console.log(`  Full Data:`, JSON.stringify(reg, null, 2));
    });

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testVenues();
