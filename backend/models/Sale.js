const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
  salesperson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: { type: String },
  customerPhone: { type: String }, // Customer phone number
  invoice: { type: String },
  discount: { type: Number, default: 0 }, // Discount percentage
  finalAmount: { type: Number }, // Final amount after discount
  paymentMode: { type: String, enum: ['cash', 'online'], default: 'cash' },
  transactionId: { type: String }, // For both cash and online payments
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
  // Refund fields
  refundId: { type: String }, // Razorpay refund ID
  refundAmount: { type: Number }, // Refunded amount
  refundReason: { type: String }, // Reason for refund
  refundDate: { type: Date }, // Date of refund
  date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);
