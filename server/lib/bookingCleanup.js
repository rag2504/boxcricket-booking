import Booking from '../models/Booking.js';

/**
 * Cleanup expired pending bookings
 * This function should be called periodically (e.g., via a cron job)
 * to clean up bookings that were created but never paid for
 */
export async function cleanupExpiredBookings() {
  try {
    // Find bookings that are pending and older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const expiredBookings = await Booking.find({
      status: 'pending',
      $or: [
        { 'payment.status': { $ne: 'completed' } },
        { 'payment.status': { $exists: false } },
        { 'payment': { $exists: false } }
      ],
      createdAt: { $lt: fiveMinutesAgo }
    });

    console.log(`Found ${expiredBookings.length} expired pending bookings to clean up`);

    for (const booking of expiredBookings) {
      // Update booking status to expired
      booking.status = 'cancelled';
      booking.cancellation = {
        cancelledBy: 'system',
        cancelledAt: new Date(),
        reason: 'Payment timeout - booking expired after 5 minutes'
      };
      
      // Update payment status if it exists
      if (booking.payment) {
        booking.payment.status = 'failed';
      } else {
        booking.payment = {
          status: 'failed'
        };
      }

      await booking.save();
      console.log(`Expired booking ${booking.bookingId} - slot now available`);
    }

    return {
      success: true,
      expiredCount: expiredBookings.length,
      message: `Cleaned up ${expiredBookings.length} expired bookings`
    };
  } catch (error) {
    console.error('Error cleaning up expired bookings:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get booking expiry status
 */
export function getBookingExpiryStatus(booking) {
  if (!booking || booking.status !== 'pending') {
    return { isExpired: false, timeLeft: 0 };
  }

  const createdTime = new Date(booking.createdAt);
  const expiryTime = new Date(createdTime.getTime() + 5 * 60 * 1000); // 5 minutes
  const now = new Date();
  
  const isExpired = now > expiryTime;
  const timeLeft = Math.max(0, expiryTime.getTime() - now.getTime());

  return {
    isExpired,
    timeLeft,
    expiryTime,
    minutesLeft: Math.ceil(timeLeft / (1000 * 60))
  };
}

/**
 * Start automatic cleanup interval
 */
export function startBookingCleanupService(intervalMinutes = 5) {
  console.log(`Starting booking cleanup service - running every ${intervalMinutes} minutes`);
  
  // Run cleanup immediately
  cleanupExpiredBookings();
  
  // Set up periodic cleanup
  const interval = setInterval(() => {
    cleanupExpiredBookings();
  }, intervalMinutes * 60 * 1000);

  return interval;
}
