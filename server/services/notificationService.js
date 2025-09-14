import Notification from '../models/Notification.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * Notification Service
 * Handles creation and management of user notifications
 */
class NotificationService {
  
  /**
   * Create a booking-related notification
   */
  static async createBookingNotification(userId, bookingData, type) {
    try {
      let title, message, priority, actionUrl;
      
      switch (type) {
        case 'booking_pending':
          title = '⏰ Booking Payment Pending';
          message = `Your booking at ${bookingData.groundName} is pending payment. Complete it within 5 minutes or it will be cancelled.`;
          priority = 'high';
          actionUrl = `/booking/${bookingData.bookingId}`;
          break;
          
        case 'booking_confirmed':
          title = '✅ Booking Confirmed!';
          message = `Great! Your booking at ${bookingData.groundName} for ${bookingData.date} at ${bookingData.timeSlot} is confirmed.`;
          priority = 'medium';
          actionUrl = `/booking/${bookingData.bookingId}`;
          break;
          
        case 'booking_cancelled':
          title = '❌ Booking Cancelled';
          message = `Your booking at ${bookingData.groundName} has been cancelled. ${bookingData.reason || ''}`;
          priority = 'medium';
          actionUrl = `/profile/bookings`;
          break;
          
        case 'booking_reminder':
          title = '🏏 Upcoming Booking Reminder';
          message = `Don't forget! Your booking at ${bookingData.groundName} is tomorrow at ${bookingData.timeSlot}.`;
          priority = 'medium';
          actionUrl = `/booking/${bookingData.bookingId}`;
          break;
          
        case 'payment_success':
          title = '💳 Payment Successful';
          message = `Payment of ₹${bookingData.amount} for your booking at ${bookingData.groundName} was successful.`;
          priority = 'low';
          actionUrl = `/booking/${bookingData.bookingId}`;
          break;
          
        case 'payment_failed':
          title = '❌ Payment Failed';
          message = `Payment failed for your booking at ${bookingData.groundName}. Please try again.`;
          priority = 'high';
          actionUrl = `/booking/${bookingData.bookingId}`;
          break;
          
        case 'admin_broadcast':
          title = bookingData.title || '📢 Admin Announcement';
          message = bookingData.message || 'You have a new message from the admin.';
          priority = bookingData.priority || 'medium';
          actionUrl = bookingData.actionUrl || '/notifications';
          break;
          
        default:
          throw new Error(`Unknown booking notification type: ${type}`);
      }
      
      const notificationData = {
        userId,
        title,
        message,
        type,
        priority,
        data: {
          bookingId: bookingData.bookingId,
          groundId: bookingData.groundId,
          amount: bookingData.amount,
          actionUrl,
          metadata: bookingData
        }
      };
      
      const notification = await Notification.createNotification(notificationData);
      
      // TODO: Emit real-time notification via socket.io
      // io.to(userId).emit('notification', notification);
      
      console.log(`📢 Created ${type} notification for user ${userId}:`, title);
      return notification;
      
    } catch (error) {
      console.error('Error creating booking notification:', error);
      throw error;
    }
  }
  
  /**
   * Create admin notification for specific user
   */
  static async createAdminNotification(userId, adminId, data) {
    try {
      const notificationData = {
        userId,
        title: data.title,
        message: data.message,
        type: data.type || 'admin_broadcast',
        priority: data.priority || 'medium',
        sentBy: adminId,
        data: {
          actionUrl: data.actionUrl,
          metadata: data.metadata,
          bookingId: data.bookingId,
          groundId: data.groundId,
          amount: data.amount
        }
      };
      
      const notification = await Notification.createNotification(notificationData);
      
      console.log(`📢 Created admin notification for user ${userId}:`, data.title);
      return notification;
      
    } catch (error) {
      console.error('Error creating admin notification:', error);
      throw error;
    }
  }
  
  /**
   * Create admin broadcast notification
   */
  static async createBroadcastNotification(adminId, data) {
    try {
      // Get all active users
      const users = await User.find({ 
        isActive: { $ne: false },
        isDeleted: { $ne: true }
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      
      if (userIds.length === 0) {
        throw new Error('No active users found');
      }
      
      const notificationData = {
        title: data.title,
        message: data.message,
        type: 'admin_broadcast',
        priority: data.priority || 'medium',
        data: {
          actionUrl: data.actionUrl,
          metadata: data.metadata
        }
      };
      
      // Only set sentBy if the provided adminId is a valid ObjectId
      if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
        notificationData.sentBy = adminId;
      }
      
      const notifications = await Notification.createBroadcastNotification(
        notificationData, 
        userIds
      );
      
      console.log(`📢 Created broadcast notification for ${userIds.length} users:`, data.title);
      
      // TODO: Emit real-time notification to all users
      // io.emit('broadcast_notification', notificationData);
      
      return {
        success: true,
        sentCount: notifications.length,
        message: `Broadcast sent to ${notifications.length} users`
      };
      
    } catch (error) {
      console.error('Error creating broadcast notification:', error);
      throw error;
    }
  }
  
  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type = null
      } = options;
      
      const query = { userId };
      
      if (unreadOnly) {
        query.isRead = false;
      }
      
      if (type) {
        query.type = type;
      }
      
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
      
      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.getUnreadCount(userId);
      
      return {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      };
      
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }
  
  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId
      });
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      await notification.markAsRead();
      return notification;
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
  
  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { 
          isRead: true, 
          readAt: new Date() 
        }
      );
      
      return result.modifiedCount;
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
  
  /**
   * Delete notification
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        userId
      });
      
      return result.deletedCount > 0;
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
  
  /**
   * Cleanup old notifications (30+ days)
   */
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        isRead: true
      });
      
      console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
      
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

export default NotificationService;
