const mongoose = require('mongoose');

// Main Ledger (Customer/Supplier) Schema
const LedgerSchema = new mongoose.Schema({
  ledgerId: { 
    type: String, 
    unique: true
  },
  name: { 
    type: String, 
    required: true 
  },
  contactInfo: {
    phone: { type: String },
    email: { type: String },
    address: { type: String }
  },
  upiId: { type: String }, // Optional UPI ID
  balance: { 
    type: Number, 
    default: 0 
  },
  ledgerType: { 
    type: String, 
    enum: ['customer', 'supplier', 'expense', 'income'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

// Ledger Entry Schema (for transactions)
const LedgerEntrySchema = new mongoose.Schema({
  ledgerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ledger', 
    required: true 
  },
  entryType: { 
    type: String, 
    enum: ['debit', 'credit'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  transactionId: { 
    type: String,
    unique: true
  },
  category: { 
    type: String, 
    enum: ['sales', 'purchase', 'expense', 'income', 'loan', 'investment'], 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'bank_transfer', 'upi', 'credit_card', 'cheque', 'other'] 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  notes: { type: String }
}, { timestamps: true });

// Generate unique transaction ID for ledger entries
LedgerEntrySchema.pre('save', async function(next) {
  if (!this.transactionId || this.transactionId === '') {
    try {
      const count = await this.constructor.countDocuments();
      this.transactionId = `TXN-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Transaction History Schema (for payments)
const TransactionHistorySchema = new mongoose.Schema({
  ledgerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ledger', 
    required: true 
  },
  transactionType: { 
    type: String, 
    enum: ['payment_received', 'payment_made', 'adjustment'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'upi', 'online'], 
    required: true 
  },
  transactionId: { 
    type: String,
    unique: true
  },
  razorpayOrderId: { type: String }, // For online payments
  razorpayPaymentId: { type: String }, // For online payments
  description: { type: String },
  date: { 
    type: Date, 
    default: Date.now 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

// Generate unique transaction ID for transaction history
TransactionHistorySchema.pre('save', async function(next) {
  if (!this.transactionId || this.transactionId === '') {
    try {
      const count = await this.constructor.countDocuments();
      
      if (this.paymentMethod === 'cash') {
        // Auto-generate for cash transactions
        this.transactionId = `CASH-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
      } else if (this.paymentMethod === 'upi') {
        // Auto-generate for UPI transactions if not provided
        this.transactionId = `UPI-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
      } else if (this.paymentMethod === 'online') {
        // Auto-generate for online transactions if not provided (Razorpay will override this)
        this.transactionId = `ONLINE-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Generate unique ledger ID
LedgerSchema.pre('save', async function(next) {
  if (!this.ledgerId) {
    try {
      const count = await this.constructor.countDocuments();
      this.ledgerId = `LDG-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = {
  Ledger: mongoose.model('Ledger', LedgerSchema),
  LedgerEntry: mongoose.model('LedgerEntry', LedgerEntrySchema),
  TransactionHistory: mongoose.model('TransactionHistory', TransactionHistorySchema)
};
