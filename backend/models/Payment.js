const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
  amount: { type: Number, required: true },
  paymentMode: { type: String, enum: ['cash', 'online'], default: 'cash' },
  method: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
  transactionId: { type: String },
  customer: { type: String },
  customerPhone: { type: String },
  invoice: { type: String },
  // Refund tracking
  refund: { type: Boolean, default: false },
  refundFor: { type: String }, // Original payment ID that this refund is for
  // Invoice tracking
  invoiceId: { type: String }, // Razorpay invoice ID
  invoiceUrl: { type: String }, // Razorpay invoice URL
  salesperson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String },
  type: { type: String, enum: ['payment', 'refund'], default: 'payment' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
