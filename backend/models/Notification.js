const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['order', 'warning', 'payment', 'system', 'stock', 'customer', 'sale', 'info', 'error', 'success'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  read: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedId: {
    type: String,
    trim: true
  },
  relatedType: {
    type: String,
    enum: ['order', 'product', 'payment', 'user', 'sale', 'customer'],
    trim: true
  },
  actionUrl: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ type: 1, priority: 1 });

// Static methods
notificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for a user with pagination and filters
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 50,
    unreadOnly = false,
    type = null,
    priority = null
  } = options;
  
  const query = { userId };
  
  if (unreadOnly) {
    query.read = false;
  }
  
  if (type) {
    query.type = type;
  }
  
  if (priority) {
    query.priority = priority;
  }
  
  const skip = (page - 1) * limit;
  
  const notifications = await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
  const total = await this.countDocuments(query);
  
  return {
    notifications,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

// Mark notifications as read
notificationSchema.statics.markAsRead = async function(notificationIds, userId) {
  const result = await this.updateMany(
    { 
      _id: { $in: notificationIds },
      userId: userId 
    },
    { 
      read: true,
      updatedAt: new Date()
    }
  );
  
  return result;
};

// Mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  const result = await this.updateMany(
    { 
      userId: userId,
      read: false 
    },
    { 
      read: true,
      updatedAt: new Date()
    }
  );
  
  return result;
};

// Delete old read notifications (cleanup utility)
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.deleteMany({
    read: true,
    createdAt: { $lt: cutoffDate }
  });
  
  console.log(`Cleaned up ${result.deletedCount} old notifications`);
  return result;
};

// Bulk create notifications (for system-wide notifications)
notificationSchema.statics.createBulkNotifications = async function(userIds, notificationData) {
  const notifications = userIds.map(userId => ({
    ...notificationData,
    userId: userId
  }));
  
  const result = await this.insertMany(notifications);
  return result;
};

// Get notification statistics for admin dashboard
notificationSchema.statics.getNotificationStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: {
            $cond: [{ $eq: ['$read', false] }, 1, 0]
          }
        },
        urgent: {
          $sum: {
            $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0]
          }
        },
        high: {
          $sum: {
            $cond: [{ $eq: ['$priority', 'high'] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats[0] || { total: 0, unread: 0, urgent: 0, high: 0 };
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.updatedAt = new Date();
  return this.save();
};

notificationSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInMinutes = Math.floor((now - this.createdAt) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
});

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
