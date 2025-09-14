#!/usr/bin/env node

/**
 * Script to find and clean up duplicate bookings
 * Usage:
 *   npm run cleanup-duplicates              # Dry run (preview only)
 *   npm run cleanup-duplicates -- --execute # Actually clean up duplicates
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { findDuplicateBookings, cleanupDuplicateBookings, findDuplicatesByAmount } from '../utils/duplicateBookingCleanup.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rag123456:rag123456@cluster0.qipvo.mongodb.net/boxcricket?retryWrites=true&w=majority';

async function main() {
  try {
    console.log('🚀 BoxCric Duplicate Booking Cleanup Tool');
    console.log('=' .repeat(50));
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const execute = args.includes('--execute') || args.includes('-e');
    const dryRun = !execute;
    
    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - No changes will be made');
      console.log('   Use --execute flag to actually clean up duplicates');
    } else {
      console.log('🔥 EXECUTE MODE - Duplicates will be cleaned up');
    }
    
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find duplicates first
    console.log('\n🔍 Step 1: Finding duplicate bookings...');
    const duplicates = await findDuplicateBookings();
    
    console.log('\n🎯 Step 2: Finding amount-based duplicates...');
    const amountDuplicates = await findDuplicatesByAmount();
    
    if (duplicates.length === 0) {
      console.log('\n✅ No duplicate bookings found!');
      console.log('   Your booking system is clean.');
    } else {
      console.log('\n🧹 Step 3: Cleaning up duplicates...');
      const result = await cleanupDuplicateBookings(dryRun);
      
      console.log('\n📊 Final Results:');
      console.log(`   Total duplicate groups found: ${duplicates.length}`);
      console.log(`   Amount-based duplicates found: ${amountDuplicates.length}`);
      console.log(`   Bookings kept: ${result.kept}`);
      console.log(`   Bookings ${dryRun ? 'that would be' : ''} cleaned: ${result.cleaned}`);
      
      if (dryRun && result.cleaned > 0) {
        console.log('\n🔄 To actually clean up these duplicates, run:');
        console.log('   node scripts/cleanup-duplicates.js --execute');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    console.log('\n🔌 Disconnecting from database...');
    await mongoose.disconnect();
    console.log('✅ Cleanup completed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Process interrupted. Cleaning up...');
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
  process.exit(0);
});

// Run the script
main().catch(console.error);
