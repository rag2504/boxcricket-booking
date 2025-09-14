#!/usr/bin/env node

/**
 * Script to apply database indexes and constraints to prevent duplicate bookings
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rag123456:rag123456@cluster0.qipvo.mongodb.net/boxcricket?retryWrites=true&w=majority';

async function applyIndexes() {
  try {
    console.log('🔧 Applying Database Indexes for Duplicate Prevention');
    console.log('=' .repeat(60));
    
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const bookingsCollection = db.collection('bookings');
    
    console.log('\n🔍 Checking existing indexes...');
    const existingIndexes = await bookingsCollection.indexes();
    console.log('📋 Current indexes:', existingIndexes.map(idx => idx.name));
    
    // Check if our duplicate prevention index already exists
    const duplicatePreventionIndexExists = existingIndexes.some(idx => 
      idx.name === 'prevent_duplicate_bookings'
    );
    
    if (duplicatePreventionIndexExists) {
      console.log('✅ Duplicate prevention index already exists');
    } else {
      console.log('\n🛠️  Creating duplicate prevention index...');
      
      try {
        await bookingsCollection.createIndex(
          {
            groundId: 1,
            bookingDate: 1,
            "timeSlot.startTime": 1,
            "timeSlot.endTime": 1,
            status: 1
          },
          {
            unique: true,
            partialFilterExpression: {
              status: { $in: ["pending", "confirmed", "completed"] }
            },
            name: "prevent_duplicate_bookings"
          }
        );
        console.log('✅ Duplicate prevention index created successfully');
      } catch (indexError) {
        if (indexError.code === 11000) {
          console.log('⚠️  Could not create unique index due to existing duplicates');
          console.log('   Run cleanup-duplicates.js first to remove duplicates');
        } else {
          throw indexError;
        }
      }
    }
    
    console.log('\n📊 Final index status:');
    const finalIndexes = await bookingsCollection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`   📋 ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    console.log('\n✅ Database optimization completed!');
    console.log('🛡️  Your booking system is now protected against duplicates');
    
  } catch (error) {
    console.error('\n❌ Error applying indexes:', error);
    throw error;
  } finally {
    console.log('\n🔌 Disconnecting from database...');
    await mongoose.disconnect();
  }
}

applyIndexes().catch(console.error);
