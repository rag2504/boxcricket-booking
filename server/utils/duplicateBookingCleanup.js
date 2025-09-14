import mongoose from 'mongoose';
import Booking from '../models/Booking.js';

/**
 * Utility to find and clean up duplicate bookings
 * A booking is considered duplicate if it has the same:
 * - groundId
 * - bookingDate 
 * - timeSlot (startTime and endTime)
 * - userId (same user booking the same slot multiple times)
 */
export async function findDuplicateBookings() {
  try {
    console.log('🔍 Searching for duplicate bookings...');
    
    // Aggregate to find duplicates based on key fields
    const duplicates = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'confirmed', 'completed'] } // Only check active bookings
        }
      },
      {
        $group: {
          _id: {
            groundId: '$groundId',
            bookingDate: '$bookingDate',
            startTime: '$timeSlot.startTime',
            endTime: '$timeSlot.endTime',
            userId: '$userId'
          },
          count: { $sum: 1 },
          bookings: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          count: { $gt: 1 } // Only groups with more than 1 booking
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log(`📊 Found ${duplicates.length} groups of duplicate bookings`);
    
    return duplicates;
  } catch (error) {
    console.error('❌ Error finding duplicate bookings:', error);
    throw error;
  }
}

/**
 * Clean up duplicate bookings by keeping the earliest created booking
 * and cancelling the rest with ₹0 amount
 */
export async function cleanupDuplicateBookings(dryRun = true) {
  try {
    const duplicates = await findDuplicateBookings();
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate bookings found');
      return { cleaned: 0, kept: 0 };
    }
    
    let totalCleaned = 0;
    let totalKept = 0;
    
    console.log(`🧹 ${dryRun ? 'DRY RUN:' : 'CLEANING'} Processing ${duplicates.length} groups of duplicates...`);
    
    for (const duplicate of duplicates) {
      const bookings = duplicate.bookings;
      const count = duplicate.count;
      
      console.log(`\n📋 Processing ${count} duplicate bookings for:`);
      console.log(`   Ground: ${duplicate._id.groundId}`);
      console.log(`   Date: ${new Date(duplicate._id.bookingDate).toLocaleDateString()}`);
      console.log(`   Time: ${duplicate._id.startTime}-${duplicate._id.endTime}`);
      
      // Sort by creation date (keep the earliest)
      bookings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      const [keepBooking, ...duplicatesToRemove] = bookings;
      
      console.log(`   ✅ Keeping booking: ${keepBooking.bookingId} (created: ${new Date(keepBooking.createdAt).toLocaleString()})`);
      totalKept++;
      
      for (const duplicateBooking of duplicatesToRemove) {
        console.log(`   🗑️  ${dryRun ? 'Would remove' : 'Removing'} booking: ${duplicateBooking.bookingId} (created: ${new Date(duplicateBooking.createdAt).toLocaleString()})`);
        
        if (!dryRun) {
          // Update the duplicate booking to cancelled with ₹0 amount
          await Booking.findByIdAndUpdate(duplicateBooking._id, {
            status: 'cancelled',
            'pricing.totalAmount': 0,
            'cancellation.cancelledBy': 'system',
            'cancellation.cancelledAt': new Date(),
            'cancellation.reason': 'Duplicate booking detected and removed by system cleanup',
            'cancellation.refundAmount': 0,
            'cancellation.refundStatus': 'processed'
          });
          
          console.log(`   ✅ Cancelled duplicate booking ${duplicateBooking.bookingId}`);
        }
        
        totalCleaned++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Bookings kept: ${totalKept}`);
    console.log(`   Duplicates ${dryRun ? 'that would be' : ''} cleaned: ${totalCleaned}`);
    
    if (dryRun) {
      console.log(`\n⚠️  This was a DRY RUN. No changes were made.`);
      console.log(`   To actually clean up duplicates, run: cleanupDuplicateBookings(false)`);
    } else {
      console.log(`\n✅ Cleanup completed successfully!`);
    }
    
    return { cleaned: totalCleaned, kept: totalKept };
    
  } catch (error) {
    console.error('❌ Error cleaning up duplicate bookings:', error);
    throw error;
  }
}

/**
 * Find potential duplicate bookings by amount pattern
 * (e.g., one booking with ₹0 and another with actual amount for same slot)
 */
export async function findDuplicatesByAmount() {
  try {
    console.log('🔍 Searching for duplicate bookings by amount pattern...');
    
    const duplicates = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            groundId: '$groundId',
            bookingDate: '$bookingDate',
            startTime: '$timeSlot.startTime',
            endTime: '$timeSlot.endTime'
          },
          bookings: { $push: '$$ROOT' },
          count: { $sum: 1 },
          amounts: { $addToSet: '$pricing.totalAmount' }
        }
      },
      {
        $match: {
          count: { $gt: 1 },
          amounts: { $in: [0] } // Has at least one booking with ₹0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log(`📊 Found ${duplicates.length} potential amount-based duplicates`);
    
    for (const duplicate of duplicates) {
      console.log(`\n🎯 Found potential duplicate:`);
      console.log(`   Ground: ${duplicate._id.groundId}`);
      console.log(`   Date: ${new Date(duplicate._id.bookingDate).toLocaleDateString()}`);
      console.log(`   Time: ${duplicate._id.startTime}-${duplicate._id.endTime}`);
      console.log(`   Amounts: ${duplicate.amounts.join(', ')}`);
      console.log(`   Booking IDs: ${duplicate.bookings.map(b => b.bookingId).join(', ')}`);
    }
    
    return duplicates;
  } catch (error) {
    console.error('❌ Error finding amount-based duplicates:', error);
    throw error;
  }
}

// Export cleanup functions for use in scripts or admin panel
export default {
  findDuplicateBookings,
  cleanupDuplicateBookings,
  findDuplicatesByAmount
};
