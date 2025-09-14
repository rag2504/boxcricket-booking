import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "booking_pending",
        "booking_confirmed", 
        "booking_cancelled",
        "booking_reminder",
        "payment_success",
        "payment_failed",
        "admin_broadcast",
        "system",
        "promotion"
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    data: {
      // Additional data related to notification (booking ID, etc.)
      bookingId: String,
      groundId: String,
      amount: Number,
      actionUrl: String,
      metadata: mongoose.Schema.Types.Mixed,
    },
    expiresAt: {
      type: Date,
      // Auto-delete notifications after 30 days
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
    },
    // For admin broadcast notifications
    isGlobal: {
      type: Boolean,
      default: false,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who sent the notification
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ isGlobal: 1 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
  }
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method to create bulk notifications for broadcast
notificationSchema.statics.createBroadcastNotification = async function(data, userIds) {
  const notifications = userIds.map(userId => ({
    ...data,
    userId,
    isGlobal: true,
  }));
  
  return await this.insertMany(notifications);
};

// Method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, isRead: false });
};

export default mongoose.model("Notification", notificationSchema);
