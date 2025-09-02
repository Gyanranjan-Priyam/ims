const Notification = require('../models/Notification');

class NotificationService {
  // Create a notification for a specific user
  static async createNotification(data) {
    try {
      const notification = await Notification.createNotification(data);
      console.log(`Notification created for user ${data.userId}: ${data.title}`);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create notifications for multiple users
  static async createBulkNotification(userIds, data) {
    try {
      const notifications = await Notification.createBulkNotifications(userIds, data);
      console.log(`Bulk notification created for ${userIds.length} users: ${data.title}`);
      return notifications;
    } catch (error) {
      console.error('Error creating bulk notification:', error);
      throw error;
    }
  }

  // Order-related notifications
  static async notifyNewOrder(userId, orderData) {
    return await this.createNotification({
      title: 'New Order Received',
      message: `Order #${orderData.orderNumber} has been placed with ${orderData.itemCount} items`,
      type: 'order',
      priority: 'medium',
      userId: userId,
      relatedId: orderData.orderId,
      relatedType: 'order',
      actionUrl: `/orders/${orderData.orderId}`,
      metadata: {
        orderNumber: orderData.orderNumber,
        totalAmount: orderData.totalAmount,
        customerName: orderData.customerName
      }
    });
  }

  static async notifyOrderStatusUpdate(userId, orderData) {
    const priorityMap = {
      'completed': 'low',
      'cancelled': 'medium',
      'processing': 'low',
      'shipped': 'medium'
    };

    return await this.createNotification({
      title: 'Order Status Updated',
      message: `Order #${orderData.orderNumber} status changed to ${orderData.status}`,
      type: 'order',
      priority: priorityMap[orderData.status] || 'low',
      userId: userId,
      relatedId: orderData.orderId,
      relatedType: 'order',
      actionUrl: `/orders/${orderData.orderId}`,
      metadata: {
        orderNumber: orderData.orderNumber,
        oldStatus: orderData.oldStatus,
        newStatus: orderData.status
      }
    });
  }

  // Payment-related notifications
  static async notifyPaymentReceived(userId, paymentData) {
    return await this.createNotification({
      title: 'Payment Received',
      message: `Payment of $${paymentData.amount} received for Order #${paymentData.orderNumber}`,
      type: 'payment',
      priority: 'medium',
      userId: userId,
      relatedId: paymentData.paymentId,
      relatedType: 'payment',
      actionUrl: `/payments/${paymentData.paymentId}`,
      metadata: {
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
        orderNumber: paymentData.orderNumber
      }
    });
  }

  static async notifyPaymentFailed(userId, paymentData) {
    return await this.createNotification({
      title: 'Payment Failed',
      message: `Payment failed for Order #${paymentData.orderNumber}. Reason: ${paymentData.reason}`,
      type: 'payment',
      priority: 'high',
      userId: userId,
      relatedId: paymentData.paymentId,
      relatedType: 'payment',
      actionUrl: `/payments/${paymentData.paymentId}`,
      metadata: {
        amount: paymentData.amount,
        reason: paymentData.reason,
        orderNumber: paymentData.orderNumber
      }
    });
  }

  // Stock-related notifications
  static async notifyLowStock(userId, productData) {
    return await this.createNotification({
      title: 'Low Stock Alert',
      message: `${productData.name} is running low. Current stock: ${productData.currentStock}`,
      type: 'stock',
      priority: productData.currentStock === 0 ? 'urgent' : 'high',
      userId: userId,
      relatedId: productData.productId,
      relatedType: 'product',
      actionUrl: `/products/${productData.productId}`,
      metadata: {
        productName: productData.name,
        currentStock: productData.currentStock,
        minimumStock: productData.minimumStock,
        sku: productData.sku
      }
    });
  }

  static async notifyStockUpdate(userId, productData) {
    return await this.createNotification({
      title: 'Stock Updated',
      message: `${productData.name} stock updated. New quantity: ${productData.newStock}`,
      type: 'stock',
      priority: 'low',
      userId: userId,
      relatedId: productData.productId,
      relatedType: 'product',
      actionUrl: `/products/${productData.productId}`,
      metadata: {
        productName: productData.name,
        oldStock: productData.oldStock,
        newStock: productData.newStock,
        sku: productData.sku
      }
    });
  }

  // Sale-related notifications
  static async notifySaleComplete(userId, saleData) {
    return await this.createNotification({
      title: 'Sale Completed',
      message: `Sale of $${saleData.amount} completed successfully`,
      type: 'sale',
      priority: 'medium',
      userId: userId,
      relatedId: saleData.saleId,
      relatedType: 'sale',
      actionUrl: `/sales/${saleData.saleId}`,
      metadata: {
        amount: saleData.amount,
        customerName: saleData.customerName,
        itemCount: saleData.itemCount,
        paymentMethod: saleData.paymentMethod
      }
    });
  }

  static async notifyDailySalesReport(userId, reportData) {
    return await this.createNotification({
      title: 'Daily Sales Report',
      message: `Today's sales: $${reportData.totalSales} from ${reportData.salesCount} transactions`,
      type: 'sale',
      priority: 'low',
      userId: userId,
      metadata: {
        date: reportData.date,
        totalSales: reportData.totalSales,
        salesCount: reportData.salesCount,
        topProduct: reportData.topProduct
      }
    });
  }

  // Customer-related notifications
  static async notifyNewCustomer(userId, customerData) {
    return await this.createNotification({
      title: 'New Customer Registered',
      message: `${customerData.name} has registered as a new customer`,
      type: 'customer',
      priority: 'low',
      userId: userId,
      relatedId: customerData.customerId,
      relatedType: 'customer',
      actionUrl: `/customers/${customerData.customerId}`,
      metadata: {
        customerName: customerData.name,
        email: customerData.email,
        phone: customerData.phone
      }
    });
  }

  // System notifications
  static async notifySystemMaintenance(userIds, maintenanceData) {
    return await this.createBulkNotification(userIds, {
      title: 'System Maintenance Scheduled',
      message: `System maintenance scheduled for ${maintenanceData.date} at ${maintenanceData.time}`,
      type: 'system',
      priority: 'high',
      expiresAt: new Date(maintenanceData.date),
      metadata: {
        date: maintenanceData.date,
        time: maintenanceData.time,
        duration: maintenanceData.duration,
        description: maintenanceData.description
      }
    });
  }

  static async notifySystemUpdate(userIds, updateData) {
    return await this.createBulkNotification(userIds, {
      title: 'System Update Available',
      message: `New system update ${updateData.version} is available with ${updateData.features}`,
      type: 'system',
      priority: 'medium',
      metadata: {
        version: updateData.version,
        features: updateData.features,
        releaseDate: updateData.releaseDate
      }
    });
  }

  // Warning notifications
  static async notifySecurityAlert(userId, alertData) {
    return await this.createNotification({
      title: 'Security Alert',
      message: alertData.message,
      type: 'warning',
      priority: 'urgent',
      userId: userId,
      metadata: {
        alertType: alertData.type,
        timestamp: alertData.timestamp,
        ipAddress: alertData.ipAddress,
        userAgent: alertData.userAgent
      }
    });
  }

  static async notifyDataBackup(userIds, backupData) {
    return await this.createBulkNotification(userIds, {
      title: backupData.success ? 'Data Backup Successful' : 'Data Backup Failed',
      message: backupData.success 
        ? `System backup completed successfully at ${backupData.timestamp}`
        : `System backup failed. Error: ${backupData.error}`,
      type: backupData.success ? 'success' : 'error',
      priority: backupData.success ? 'low' : 'high',
      metadata: {
        backupId: backupData.backupId,
        timestamp: backupData.timestamp,
        size: backupData.size,
        success: backupData.success
      }
    });
  }

  // Utility methods
  static async getUnreadCount(userId) {
    try {
      const stats = await Notification.getNotificationStats(userId);
      return stats.unread || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  static async markAllAsRead(userId) {
    try {
      const result = await Notification.markAllAsRead(userId);
      console.log(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);
      return result;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  static async cleanupExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      console.log(`Cleaned up ${result.deletedCount} expired notifications`);
      return result;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  // Auto-cleanup job (can be called by cron job)
  static async performMaintenanceCleanup() {
    try {
      console.log('Starting notification maintenance cleanup...');
      
      // Clean up expired notifications
      await this.cleanupExpiredNotifications();
      
      // Clean up old read notifications (older than 30 days)
      await Notification.cleanupOldNotifications(30);
      
      console.log('Notification maintenance cleanup completed');
    } catch (error) {
      console.error('Error during maintenance cleanup:', error);
    }
  }
}

module.exports = NotificationService;
