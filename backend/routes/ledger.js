const express = require('express');
const { Ledger, LedgerEntry, TransactionHistory } = require('../models/Ledger');
const { auth, authorize } = require('../middleware/auth');
const Razorpay = require('razorpay');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret'
});

// Get all ledgers (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const ledgers = await Ledger.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(ledgers);
  } catch (err) {
    console.error('Error fetching ledgers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single ledger by ID (admin only)
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }
    
    res.json(ledger);
  } catch (err) {
    console.error('Error fetching ledger:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new ledger (admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, contactInfo, upiId, ledgerType } = req.body;
    
    const ledger = new Ledger({
      name,
      contactInfo,
      upiId,
      ledgerType,
      createdBy: req.user.id
    });
    
    await ledger.save();
    await ledger.populate('createdBy', 'name email');
    
    res.status(201).json(ledger);
  } catch (err) {
    console.error('Error creating ledger:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update ledger (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, contactInfo, upiId, status } = req.body;
    
    const ledger = await Ledger.findByIdAndUpdate(
      req.params.id,
      { name, contactInfo, upiId, status },
      { new: true }
    ).populate('createdBy', 'name email');
    
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }
    
    res.json(ledger);
  } catch (err) {
    console.error('Error updating ledger:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete ledger (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const ledger = await Ledger.findByIdAndDelete(req.params.id);
    
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }
    
    // Also delete related entries and transactions
    await LedgerEntry.deleteMany({ ledgerId: req.params.id });
    await TransactionHistory.deleteMany({ ledgerId: req.params.id });
    
    res.json({ message: 'Ledger and related data deleted successfully' });
  } catch (err) {
    console.error('Error deleting ledger:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ledger entries for a specific ledger
router.get('/:id/entries', auth, authorize('admin'), async (req, res) => {
  try {
    const entries = await LedgerEntry.find({ ledgerId: req.params.id })
      .populate('createdBy', 'name email')
      .sort({ date: -1 });
    
    res.json(entries);
  } catch (err) {
    console.error('Error fetching ledger entries:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add ledger entry
router.post('/:id/entries', auth, authorize('admin'), async (req, res) => {
  try {
    const { entryType, amount, description, transactionId, category, paymentMethod, notes } = req.body;
    
    const ledger = await Ledger.findById(req.params.id);
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }
    
    const entry = new LedgerEntry({
      ledgerId: req.params.id,
      entryType,
      amount,
      description,
      transactionId,
      category,
      paymentMethod,
      notes,
      createdBy: req.user.id
    });
    
    await entry.save();
    
    // Update ledger balance
    if (entryType === 'debit') {
      ledger.balance += amount;
    } else {
      ledger.balance -= amount;
    }
    await ledger.save();
    
    await entry.populate('createdBy', 'name email');
    
    res.status(201).json(entry);
  } catch (err) {
    console.error('Error creating ledger entry:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction history for a specific ledger
router.get('/:id/transactions', auth, authorize('admin'), async (req, res) => {
  try {
    const transactions = await TransactionHistory.find({ ledgerId: req.params.id })
      .populate('createdBy', 'name email')
      .sort({ date: -1 });
    
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add transaction (payment/receipt)
router.post('/:id/transactions', auth, authorize('admin'), async (req, res) => {
  try {
    const { transactionType, amount, paymentMethod, transactionId, razorpayOrderId, razorpayPaymentId, description } = req.body;
    
    const ledger = await Ledger.findById(req.params.id);
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }

    // If payment method is online, create Razorpay order
    let orderData = {};
    if (paymentMethod === 'online' && !razorpayOrderId) {
      try {
        const options = {
          amount: amount * 100, // amount in paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        orderData.razorpayOrderId = order.id;
        orderData.transactionId = order.id;
      } catch (razorpayError) {
        console.error('Razorpay order creation failed:', razorpayError);
        return res.status(500).json({ message: 'Payment gateway error' });
      }
    }
    
    const transaction = new TransactionHistory({
      ledgerId: req.params.id,
      transactionType,
      amount,
      paymentMethod,
      transactionId: orderData.transactionId || transactionId,
      razorpayOrderId: orderData.razorpayOrderId || razorpayOrderId,
      razorpayPaymentId,
      description,
      createdBy: req.user.id
    });
    
    await transaction.save();
    
    // Update ledger balance based on transaction type
    if (transactionType === 'payment_received') {
      ledger.balance -= amount;
    } else if (transactionType === 'payment_made') {
      ledger.balance += amount;
    }
    await ledger.save();
    
    await transaction.populate('createdBy', 'name email');
    
    res.status(201).json(transaction);
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ledger dashboard data
router.get('/:id/dashboard', auth, authorize('admin'), async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.id);
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }
    
    const entries = await LedgerEntry.find({ ledgerId: req.params.id });
    const transactions = await TransactionHistory.find({ ledgerId: req.params.id });
    
    // Calculate totals
    const totalDebits = entries
      .filter(e => e.entryType === 'debit')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalCredits = entries
      .filter(e => e.entryType === 'credit')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalPaymentsReceived = transactions
      .filter(t => t.transactionType === 'payment_received')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalPaymentsMade = transactions
      .filter(t => t.transactionType === 'payment_made')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const dashboardData = {
      ledger,
      balance: ledger.balance,
      totalDebits,
      totalCredits,
      totalPaymentsReceived,
      totalPaymentsMade,
      entryCount: entries.length,
      transactionCount: transactions.length,
      recentEntries: entries.slice(-5),
      recentTransactions: transactions.slice(-5)
    };
    
    res.json(dashboardData);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit ledger entry
router.put('/entries/:entryId', auth, authorize('admin'), async (req, res) => {
  try {
    const { entryType, amount, description, transactionId, category, paymentMethod, notes } = req.body;
    
    const entry = await LedgerEntry.findById(req.params.entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const ledger = await Ledger.findById(entry.ledgerId);
    
    // Revert previous balance change
    if (entry.entryType === 'debit') {
      ledger.balance -= entry.amount;
    } else {
      ledger.balance += entry.amount;
    }
    
    // Update entry
    entry.entryType = entryType;
    entry.amount = amount;
    entry.description = description;
    entry.transactionId = transactionId;
    entry.category = category;
    entry.paymentMethod = paymentMethod;
    entry.notes = notes;
    
    await entry.save();
    
    // Apply new balance change
    if (entryType === 'debit') {
      ledger.balance += amount;
    } else {
      ledger.balance -= amount;
    }
    await ledger.save();
    
    await entry.populate('createdBy', 'name email');
    res.json(entry);
  } catch (err) {
    console.error('Error updating entry:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete ledger entry
router.delete('/entries/:entryId', auth, authorize('admin'), async (req, res) => {
  try {
    const entry = await LedgerEntry.findById(req.params.entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const ledger = await Ledger.findById(entry.ledgerId);
    
    // Revert balance change
    if (entry.entryType === 'debit') {
      ledger.balance -= entry.amount;
    } else {
      ledger.balance += entry.amount;
    }
    await ledger.save();
    
    await LedgerEntry.findByIdAndDelete(req.params.entryId);
    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('Error deleting entry:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete transaction
router.delete('/transactions/:transactionId', auth, authorize('admin'), async (req, res) => {
  try {
    const transaction = await TransactionHistory.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const ledger = await Ledger.findById(transaction.ledgerId);
    
    // Revert balance change
    if (transaction.transactionType === 'payment_received') {
      ledger.balance += transaction.amount;
    } else if (transaction.transactionType === 'payment_made') {
      ledger.balance -= transaction.amount;
    }
    await ledger.save();
    
    await TransactionHistory.findByIdAndDelete(req.params.transactionId);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get entries that match transaction IDs from payment section
router.get('/:id/entries-from-payments', auth, authorize('admin'), async (req, res) => {
  try {
    const transactions = await TransactionHistory.find({ ledgerId: req.params.id });
    const transactionIds = transactions.map(t => t.transactionId);
    
    const entries = await LedgerEntry.find({ 
      ledgerId: req.params.id,
      transactionId: { $in: transactionIds }
    }).populate('createdBy', 'name email');
    
    res.json(entries);
  } catch (err) {
    console.error('Error fetching entries from payments:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get combined entries (ledger entries + payment transactions) for entries tab
router.get('/:id/combined-entries', auth, authorize('admin'), async (req, res) => {
  try {
    const [entries, transactions] = await Promise.all([
      LedgerEntry.find({ ledgerId: req.params.id })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 }),
      TransactionHistory.find({ ledgerId: req.params.id })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
    ]);

    // Transform transactions to look like entries for unified display
    const transformedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      ledgerId: transaction.ledgerId,
      entryType: transaction.transactionType === 'payment_received' ? 'credit' : 'debit',
      amount: transaction.amount,
      description: transaction.description || `${transaction.transactionType.replace('_', ' ')} via ${transaction.paymentMethod}`,
      transactionId: transaction.transactionId,
      category: transaction.transactionType === 'payment_received' ? 'income' : 'expense',
      paymentMethod: transaction.paymentMethod,
      date: transaction.date,
      notes: `Payment Transaction - ${transaction.transactionType.replace('_', ' ')}`,
      createdBy: transaction.createdBy,
      createdAt: transaction.createdAt,
      isPaymentTransaction: true, // Flag to identify payment transactions
      originalTransactionType: transaction.transactionType,
      razorpayOrderId: transaction.razorpayOrderId,
      razorpayPaymentId: transaction.razorpayPaymentId
    }));

    // Combine and sort by date
    const combinedEntries = [...entries, ...transformedTransactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(combinedEntries);
  } catch (err) {
    console.error('Error fetching combined entries:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Razorpay webhook for payment verification
router.post('/razorpay/webhook', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Update transaction with payment ID
    const transaction = await TransactionHistory.findOne({ razorpayOrderId: razorpay_order_id });
    if (transaction) {
      transaction.razorpayPaymentId = razorpay_payment_id;
      await transaction.save();
    }
    
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    res.status(500).json({ message: 'Webhook error' });
  }
});

// Get all payment transactions from all ledgers (for payments page)
router.get('/transactions/all', auth, async (req, res) => {
  try {
    const [ledgerEntries, transactionHistory] = await Promise.all([
      LedgerEntry.find({ entryType: 'credit' }) // Only credit entries (payments received)
        .populate('ledgerId', 'name contactInfo')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 }),
      TransactionHistory.find({ transactionType: 'payment_received' }) // Only payments received
        .populate('ledgerId', 'name contactInfo')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
    ]);

    // Helper function to generate invoice number
    const generateInvoiceNumber = (entry, type) => {
      const date = new Date(entry.createdAt || entry.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const uniqueId = entry._id.toString().slice(-6).toUpperCase();
      return `INV-${type}-${year}${month}${day}-${uniqueId}`;
    };

    // Transform ledger entries to payment format (only credit entries)
    const ledgerPayments = ledgerEntries.map(entry => ({
      _id: entry._id,
      type: 'ledger_entry',
      amount: entry.amount,
      paymentMethod: entry.paymentMethod || 'cash',
      transactionId: entry.transactionId,
      status: 'completed',
      date: entry.date || entry.createdAt,
      description: entry.description,
      customerName: entry.ledgerId?.name || 'N/A',
      customerPhone: entry.ledgerId?.contactInfo?.phone || 'N/A',
      paymentType: 'ledger',
      source: 'admin',
      reference: entry.transactionId,
      category: entry.category,
      entryType: entry.entryType,
      createdBy: entry.createdBy,
      invoiceNumber: generateInvoiceNumber(entry, 'LED') // Generate invoice for ledger entry
    }));

    // Transform transaction history to payment format (only payment_received)
    const transactionPayments = transactionHistory.map(transaction => ({
      _id: transaction._id,
      type: 'transaction_history',
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod || 'cash',
      transactionId: transaction.transactionId,
      status: 'completed',
      date: transaction.date || transaction.createdAt,
      description: transaction.description || `Payment received via ${transaction.paymentMethod}`,
      customerName: transaction.ledgerId?.name || 'N/A',
      customerPhone: transaction.ledgerId?.contactInfo?.phone || 'N/A',
      paymentType: 'ledger',
      source: transaction.createdBy?.name === 'salesperson' ? 'salesperson' : 'admin',
      reference: transaction.transactionId,
      category: 'payment',
      transactionType: transaction.transactionType,
      createdBy: transaction.createdBy,
      invoiceNumber: generateInvoiceNumber(transaction, 'TXN') // Generate invoice for transaction
    }));

    // Combine and return all transactions
    const allTransactions = [...ledgerPayments, ...transactionPayments];
    res.json(allTransactions);
  } catch (err) {
    console.error('Error fetching all ledger transactions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
