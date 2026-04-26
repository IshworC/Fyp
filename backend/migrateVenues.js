/**
 * migrateVenues.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Run once to fix venue visibility for users:
 *   node --experimental-vm-modules migrateVenues.js
 * OR (if package.json has "type":"module"):
 *   node migrateVenues.js
 * ─────────────────────────────────────────────────────────────────────────────
 * What it does:
 *  1. For every APPROVED registration that has no Venue document → creates one.
 *  2. For every existing Venue that has no `registration` back-ref → links it.
 *  3. For every Venue missing `pricePerPlate` → sets a sensible default.
 *  4. Ensures all Venues linked to APPROVED registrations have isApproved=true.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import config from './config/config.js';
import Venue from './models/Venue.js';
import VenueRegistration from './models/VenueRegistration.js';
import User from './models/User.js'; // Must be imported so Mongoose registers the schema

dotenv.config();

// ─── helpers ─────────────────────────────────────────────────────────────────
const sep = () => console.log('\n' + '─'.repeat(60) + '\n');

async function step1_createMissingVenues() {
  console.log('STEP 1: Create venues for APPROVED registrations with no Venue\n');

  // Registrations that are APPROVED but either have no `venue` field at all,
  // or `venue` is null/undefined.
  const approved = await VenueRegistration.find({
    registrationStatus: 'APPROVED',
    $or: [
      { venue: { $exists: false } },
      { venue: null }
    ]
  }).populate('owner', 'name email');

  console.log(`→ Found ${approved.length} approved registrations without a venue.\n`);

  let created = 0;
  for (const reg of approved) {
    try {
      // Safety check: maybe a Venue already exists for this owner but the
      // back-reference was never stored on the registration.
      const byOwner = await Venue.findOne({ owner: reg.owner._id, isApproved: true });
      if (byOwner) {
        // Just link them
        await VenueRegistration.findByIdAndUpdate(reg._id, { $set: { venue: byOwner._id } });
        await Venue.findByIdAndUpdate(byOwner._id, { $set: { registration: reg._id } });
        console.log(`  ↩ Linked existing venue "${byOwner.name}" ↔ registration "${reg.venueName}"`);
        created++;
        continue;
      }

      const images = reg.venueImages?.map(img => img.url) ?? [];

      const venue = await Venue.create({
        name: reg.venueName || 'New Venue',
        type: 'banquet',
        city: reg.location?.district || 'Kathmandu',
        address: [
          reg.location?.street,
          reg.location?.wardNo ? `Ward ${reg.location.wardNo}` : null,
          reg.location?.municipality
        ].filter(Boolean).join(', '),
        capacity: reg.capacity || 500,
        numberOfHalls: reg.numberOfHalls || 1,
        pricePerDay: 25000,
        pricePerPlate: 500,
        description: `Beautiful ${reg.venueName || 'venue'} located in ${reg.location?.municipality || 'Nepal'}. Perfect for weddings, corporate events, and celebrations.`,
        amenities: ['AC', 'Parking', 'Catering', 'WiFi', 'Sound System'],
        owner: reg.owner._id,
        registration: reg._id,
        images,
        phone: reg.phone,
        isApproved: true
      });

      await VenueRegistration.findByIdAndUpdate(reg._id, { $set: { venue: venue._id } });
      console.log(`  ✅ Created venue "${venue.name}" (${venue._id})`);
      created++;
    } catch (err) {
      console.error(`  ❌ Failed for "${reg.venueName}":`, err.message);
    }
  }

  console.log(`\n→ Step 1 complete. Created/linked ${created} venues.`);
}

async function step2_patchRegistrationBackref() {
  console.log('STEP 2: Patch Venue.registration back-reference for existing venues\n');

  // Find all Venues that don't have a registration field set
  const venues = await Venue.find({
    $or: [
      { registration: { $exists: false } },
      { registration: null }
    ]
  });

  console.log(`→ Found ${venues.length} venues missing a registration back-reference.\n`);

  let patched = 0;
  for (const venue of venues) {
    try {
      // Try to find a matching registration by owner + venueName
      const reg = await VenueRegistration.findOne({
        owner: venue.owner,
        registrationStatus: 'APPROVED'
      });

      if (reg) {
        await Venue.findByIdAndUpdate(venue._id, { $set: { registration: reg._id } });
        await VenueRegistration.findByIdAndUpdate(reg._id, { $set: { venue: venue._id } });
        console.log(`  ✅ Linked venue "${venue.name}" ↔ registration "${reg.venueName}"`);
        patched++;
      } else {
        console.log(`  ℹ  No approved registration found for venue "${venue.name}" (owner: ${venue.owner})`);
      }
    } catch (err) {
      console.error(`  ❌ Failed for "${venue.name}":`, err.message);
    }
  }

  console.log(`\n→ Step 2 complete. Patched ${patched} venues.`);
}

async function step3_ensurePricePerPlate() {
  console.log('STEP 3: Set default pricePerPlate on venues that are missing it\n');

  const result = await Venue.updateMany(
    { $or: [{ pricePerPlate: { $exists: false } }, { pricePerPlate: null }] },
    { $set: { pricePerPlate: 500 } }
  );

  console.log(`→ Step 3 complete. Updated ${result.modifiedCount} venues with default pricePerPlate=500.`);
}

async function step4_ensureApproved() {
  console.log('STEP 4: Mark all Venues linked to APPROVED registrations as isApproved=true\n');

  // Get all approved registration venue IDs
  const approvedRegs = await VenueRegistration.find({
    registrationStatus: 'APPROVED',
    venue: { $exists: true, $ne: null }
  }).select('venue');

  const venueIds = approvedRegs.map(r => r.venue).filter(Boolean);

  if (venueIds.length === 0) {
    console.log('→ No venue IDs found from approved registrations.');
    return;
  }

  const result = await Venue.updateMany(
    { _id: { $in: venueIds }, isApproved: { $ne: true } },
    { $set: { isApproved: true } }
  );

  console.log(`→ Step 4 complete. Approved ${result.modifiedCount} previously unapproved venues.`);
}

async function verify() {
  console.log('VERIFICATION\n');

  const totalVenues = await Venue.countDocuments();
  const approvedVenues = await Venue.countDocuments({ isApproved: true });
  const venuesWithPricePerPlate = await Venue.countDocuments({ pricePerPlate: { $ne: null, $exists: true } });
  const venuesWithRegistrationRef = await Venue.countDocuments({ registration: { $ne: null, $exists: true } });

  console.log(`  Total venues:                  ${totalVenues}`);
  console.log(`  Approved venues:               ${approvedVenues}`);
  console.log(`  Venues with pricePerPlate:     ${venuesWithPricePerPlate}`);
  console.log(`  Venues with registration ref:  ${venuesWithRegistrationRef}`);

  console.log('\n  Approved venues detail:');
  const list = await Venue.find({ isApproved: true }).select('name city type pricePerPlate capacity isApproved');
  list.forEach(v => {
    console.log(`    - "${v.name}" | ${v.city} | ${v.type} | capacity:${v.capacity} | pricePerPlate:${v.pricePerPlate}`);
  });
}

// ─── main ────────────────────────────────────────────────────────────────────
async function run() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB\n');

    await step1_createMissingVenues();
    sep();
    await step2_patchRegistrationBackref();
    sep();
    await step3_ensurePricePerPlate();
    sep();
    await step4_ensureApproved();
    sep();
    await verify();

    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

run();
