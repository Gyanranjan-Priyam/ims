const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// Get notifications for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null,
      priority = null
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type: type || null,
      priority: priority || null
    };

    const result = await Notification.getUserNotifications(req.user.id, options);
    
    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Get notification statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Notification.getNotificationStats(req.user.id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics',
      error: error.message
    });
  }
});

// Create a new notification (admin only or system)
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'info',
      priority = 'medium',
      relatedId,
      relatedType,
      actionUrl,
      expiresAt,
      metadata = {},
      targetUserId
    } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // If targetUserId is provided, use it; otherwise, send to current user
    const userId = targetUserId || req.user.id;

    const notificationData = {
      title,
      message,
      type,
      priority,
      userId,
      relatedId,
      relatedType,
      actionUrl,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      metadata
    };

    const notification = await Notification.createNotification(notificationData);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

// Create bulk notifications (admin only)
router.post('/bulk', auth, async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'info',
      priority = 'medium',
      userIds,
      relatedId,
      relatedType,
      actionUrl,
      expiresAt,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!title || !message || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, and userIds array are required'
      });
    }

    const notificationData = {
      title,
      message,
      type,
      priority,
      relatedId,
      relatedType,
      actionUrl,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      metadata
    };

    const notifications = await Notification.createBulkNotifications(userIds, notificationData);

    res.status(201).json({
      success: true,
      message: `${notifications.length} notifications created successfully`,
      data: {
        count: notifications.length,
        notifications: notifications
      }
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bulk notifications',
      error: error.message
    });
  }
});

// Mark specific notifications as read
router.patch('/read', auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'notificationIds array is required'
      });
    }

    const result = await Notification.markAsRead(notificationIds, req.user.id);

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', auth, async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// Delete specific notifications
router.delete('/', auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'notificationIds array is required'
      });
    }

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      userId: req.user.id
    });

    res.json({
      success: true,
      message: `${result.deletedCount} notifications deleted`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notifications',
      error: error.message
    });
  }
});

// Delete all read notifications
router.delete('/clear', auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user.id,
      read: true
    });

    res.json({
      success: true,
      message: `${result.deletedCount} read notifications cleared`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: error.message
    });
  }
});

// Get a specific notification
router.get('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification',
      error: error.message
    });
  }
});

// Update a specific notification
router.patch('/:id', auth, async (req, res) => {
  try {
    const { read } = req.body;
    
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id
      },
      {
        read,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
});

// Delete a specific notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// Permanently delete a specific notification from database
router.delete('/:id/permanent', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification permanently deleted from database',
      data: {
        deletedNotification: {
          id: notification._id,
          title: notification.title,
          deletedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error permanently deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete notification',
      error: error.message
    });
  }
});

// Admin route: Cleanup old notifications
router.delete('/admin/cleanup', auth, async (req, res) => {
  try {
    // Check if user is admin (you might want to add admin role check here)
    
    const { daysOld = 30 } = req.query;
    const result = await Notification.cleanupOldNotifications(parseInt(daysOld));

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old notifications`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old notifications',
      error: error.message
    });
  }
});

module.exports = router;
