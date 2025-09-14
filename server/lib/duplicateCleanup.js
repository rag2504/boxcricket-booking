import Booking from '../models/Booking.js';

/**
 * Clean up duplicate bookings by keeping the earliest created booking for each unique combination
 * of userId, groundId, bookingDate, startTime, and endTime
 */
export async function cleanupDuplicateBookings() {
  try {
    console.log('🧹 Starting duplicate booking cleanup...');
    
    // Find all bookings grouped by the unique constraint fields
    const duplicateGroups = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'confirmed'] }, // Only check active bookings
        }
      },
      {
        $group: {
          _id: {
            userId: '$userId',
            groundId: '$groundId',
            bookingDate: '$bookingDate',
            startTime: '$timeSlot.startTime',
            endTime: '$timeSlot.endTime'
          },
          bookings: { $push: { _id: '$_id', createdAt: '$createdAt', bookingId: '$bookingId', status: '$status' } },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 } // Only groups with more than 1 booking (duplicates)
        }
      }
    ]);

    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicate bookings found');
      return { cleaned: 0, total: 0 };
    }

    console.log(`🔍 Found ${duplicateGroups.length} groups with duplicate bookings`);

    let totalDuplicates = 0;
    let totalCleaned = 0;

    for (const group of duplicateGroups) {
      const { bookings } = group;
      totalDuplicates += bookings.length - 1; // -1 because we keep one

      // Sort by creation date to keep the earliest one
      bookings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      const keepBooking = bookings[0]; // Keep the earliest
      const duplicatesToDelete = bookings.slice(1); // Delete the rest

      console.log(`📋 Group: userId=${group._id.userId}, groundId=${group._id.groundId}`);
      console.log(`   - Date: ${group._id.bookingDate}, Time: ${group._id.startTime}-${group._id.endTime}`);
      console.log(`   - Keeping: ${keepBooking.bookingId} (${keepBooking.status})`);
      console.log(`   - Deleting: ${duplicatesToDelete.map(b => `${b.bookingId} (${b.status})`).join(', ')}`);

      // Delete the duplicate bookings
      const deleteIds = duplicatesToDelete.map(b => b._id);
      const deleteResult = await Booking.deleteMany({ _id: { $in: deleteIds } });
      
      totalCleaned += deleteResult.deletedCount;
      console.log(`   - Deleted: ${deleteResult.deletedCount} bookings`);
    }

    console.log(`✅ Cleanup completed: Removed ${totalCleaned} duplicate bookings out of ${totalDuplicates} duplicates found`);
    return { cleaned: totalCleaned, total: totalDuplicates };

  } catch (error) {
    console.error('❌ Error during duplicate cleanup:', error);
    throw error;
  }
}

/**
 * Run the cleanup and return a summary
 */
export async function runDuplicateCleanup() {
  try {
    const result = await cleanupDuplicateBookings();
    if (result.cleaned > 0) {
      console.log(`🧹 Duplicate cleanup summary: Removed ${result.cleaned} duplicate bookings`);
    }
    return result;
  } catch (error) {
    console.error('❌ Failed to run duplicate cleanup:', error);
    return { cleaned: 0, total: 0, error: error.message };
  }
}
