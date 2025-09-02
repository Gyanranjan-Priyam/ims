const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all sales (admin or salesperson)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'salesperson') {
      query.salesperson = req.user._id;
    }
    const sales = await Sale.find(query).populate('product salesperson');
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new sale (admin or salesperson)
router.post('/', auth, authorize(['admin', 'salesperson']), async (req, res) => {
  try {
    const { 
      product, 
      quantity, 
      total, 
      customer, 
      customerPhone,
      invoice, 
      discount = 0, 
      finalAmount, 
      paymentMode = 'cash', 
      transactionId 
    } = req.body;

    const sale = new Sale({
      product,
      quantity,
      total,
      salesperson: req.user._id,
      customer,
      customerPhone,
      invoice,
      discount,
      finalAmount: finalAmount || total,
      paymentMode,
      transactionId,
      paymentStatus: 'completed'
    });

    await sale.save();
    
    // Update product stock
    await Product.findByIdAndUpdate(product, { $inc: { stock: -quantity } });
    
    // Populate the sale with product details before sending response
    const populatedSale = await Sale.findById(sale._id).populate('product salesperson');
    
    res.status(201).json(populatedSale);
  } catch (err) {
    console.error('Create sale error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update sale (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete sale (admin or salesperson for their own sales)
router.delete('/:id', auth, authorize(['admin', 'salesperson']), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Check if user is admin or the salesperson who made the sale
    if (req.user.role !== 'admin' && sale.salesperson.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own sales.' });
    }

    // Restore product stock
    await Product.findByIdAndUpdate(sale.product, { $inc: { stock: sale.quantity } });
    
    // Delete related payments with the same invoice
    if (sale.invoice) {
      await Payment.deleteMany({ invoice: sale.invoice });
      console.log(`Deleted payments with invoice: ${sale.invoice}`);
    }
    
    // Delete the sale
    await Sale.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Sale and related payments deleted successfully',
      deletedInvoice: sale.invoice,
      restoredStock: sale.quantity 
    });
  } catch (err) {
    console.error('Delete sale error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sales by transaction ID (for invoice generation)
router.get('/by-transaction/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    let query = { transactionId };
    
    // If salesperson, only get their own sales
    if (req.user.role === 'salesperson') {
      query.salesperson = req.user._id;
    }
    
    const sales = await Sale.find(query).populate('product salesperson');
    res.json(sales);
  } catch (err) {
    console.error('Get sales by transaction error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let salesQuery = {};
    if (req.user.role === 'salesperson') {
      salesQuery.salesperson = req.user._id;
    }

    // Today's sales count and revenue from payments (not sales)
    const todaySalesQuery = {
      ...salesQuery,
      createdAt: { $gte: today, $lt: tomorrow }
    };

    const todaySales = await Sale.countDocuments(todaySalesQuery);
    
    // Calculate today's revenue from payments instead of sales
    let paymentsQuery = {
      date: { $gte: today, $lt: tomorrow },
      status: 'completed'
    };
    
    // If salesperson, filter payments by their sales
    if (req.user.role === 'salesperson') {
      const salespersonSales = await Sale.find({ salesperson: req.user._id }, '_id');
      const saleIds = salespersonSales.map(sale => sale._id);
      paymentsQuery.sale = { $in: saleIds };
    }
    
    const todayRevenue = await Payment.aggregate([
      { $match: paymentsQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Total products (for admin) or products sold by salesperson
    let totalProducts = 0;
    if (req.user.role === 'admin') {
      totalProducts = await Product.countDocuments();
    } else {
      // For salesperson, count unique products they've sold
      const uniqueProducts = await Sale.distinct('product', salesQuery);
      totalProducts = uniqueProducts.length;
    }

    // Low stock products (only for admin)
    let lowStockProducts = 0;
    if (req.user.role === 'admin') {
      lowStockProducts = await Product.countDocuments({ stock: { $lte: 10 } });
    }

    res.json({
      todaySales,
      todayRevenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0,
      totalProducts,
      lowStockProducts
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
