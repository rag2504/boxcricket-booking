import express from 'express';
import NotificationService from '../services/notificationService.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null
    } = req.query;
    
    const result = await NotificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type
    });
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
});

// Get unread notification count
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const unreadCount = await NotificationService.getUserNotifications(userId, {
      limit: 1 // We only need the count
    });
    
    res.json({
      success: true,
      unreadCount: unreadCount.unreadCount
    });
    
  } catch (error) {
    console.error('Error getting notification count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification count'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const notificationId = req.params.id;
    
    const notification = await NotificationService.markAsRead(notificationId, userId);
    
    res.json({
      success: true,
      notification
    });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const modifiedCount = await NotificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      message: `Marked ${modifiedCount} notifications as read`
    });
    
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const notificationId = req.params.id;
    
    const deleted = await NotificationService.deleteNotification(notificationId, userId);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// Admin Routes
const adminRouter = express.Router();
// Admin: List notifications (most recent first)
adminRouter.get('/', async (req, res) => {
  try {
    const Notification = (await import('../models/Notification.js')).default;
    const { page = 1, limit = 50 } = req.query;
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Notification.countDocuments();
    res.json({ success: true, notifications, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    console.error('Error listing notifications for admin:', error);
    res.status(500).json({ success: false, message: 'Failed to list notifications' });
  }
});

// Send broadcast notification (Admin only)
adminRouter.post('/broadcast', adminAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is admin
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const { title, message, priority, actionUrl, type } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }
    
    const result = await NotificationService.createBroadcastNotification(user._id, {
      title,
      message,
      priority: priority || 'medium',
      actionUrl,
      type: type || 'admin_broadcast'
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast notification'
    });
  }
});

// Send targeted notification to specific users (Admin only)
adminRouter.post('/send', adminAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is admin
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const { userIds, title, message, priority, actionUrl, type } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required and must be a non-empty array'
      });
    }
    
    const results = [];
    
    for (const userId of userIds) {
      try {
        const notification = await NotificationService.createBookingNotification(userId, {
          title,
          message,
          priority: priority || 'medium',
          actionUrl,
          adminId: user._id
        }, type || 'admin_broadcast');
        results.push({ userId, success: true, notificationId: notification._id });
      } catch (error) {
        console.error(`Error creating notification for user ${userId}:`, error);
        results.push({ userId, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `Sent ${successCount} of ${userIds.length} notifications`,
      results,
      sentCount: successCount
    });
    
  } catch (error) {
    console.error('Error sending targeted notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send targeted notifications'
    });
  }
});

// Get admin notification stats
adminRouter.get('/stats', adminAuth, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is admin
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    // Get notification statistics
    const Notification = (await import('../models/Notification.js')).default;
    
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      }
    ]);
    
    const totalNotifications = await Notification.countDocuments();
    const totalUnread = await Notification.countDocuments({ isRead: false });
    
    res.json({
      success: true,
      stats: {
        total: totalNotifications,
        totalUnread,
        byType: stats
      }
    });
    
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification stats'
    });
  }
});

// Temporary admin notification route without auth for testing
adminRouter.post('/broadcast-test', async (req, res) => {
  try {
    console.log('📢 Testing admin broadcast without auth...');
    console.log('Request body:', req.body);
    
    const { title, message, priority, actionUrl, type } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }
    
    // Pass null so service won't attempt to set sentBy with an invalid ObjectId
    const result = await NotificationService.createBroadcastNotification(null, {
      title,
      message,
      priority: priority || 'medium',
      actionUrl: actionUrl || '/notifications',
      type: type || 'admin_broadcast'
    });
    
    console.log('✅ Broadcast result:', result);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error sending test broadcast notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast notification: ' + error.message
    });
  }
});

export { adminRouter };
export default router;
