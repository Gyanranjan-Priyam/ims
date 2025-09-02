const express = require('express');
const Razorpay = require('razorpay');
const axios = require('axios');
const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get all payments (admin or salesperson for their own payments)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'salesperson') {
      // For salesperson, only show payments related to their sales
      query.salesperson = req.user._id;
    }
    const payments = await Payment.find(query).populate('sale');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add payment (allow both admin and salesperson)
router.post('/', auth, async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      salesperson: req.user._id
    };
    const payment = new Payment(paymentData);
    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update payment (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete payment (allow salesperson to delete their own payments)
router.delete('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // If salesperson, only allow deleting their own payments
    if (req.user.role === 'salesperson') {
      query.salesperson = req.user._id;
    }
    
    const payment = await Payment.findOne(query);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found or unauthorized' });
    }
    
    // Find and delete related sales if invoice matches
    if (payment.invoice) {
      await Sale.deleteMany({ invoice: payment.invoice });
      console.log(`Deleted sales with invoice: ${payment.invoice}`);
    }
    
    // Delete the payment
    await Payment.findByIdAndDelete(payment._id);
    
    res.json({ 
      message: 'Payment and related sales deleted successfully',
      deletedInvoice: payment.invoice 
    });
  } catch (err) {
    console.error('Error deleting payment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Process Razorpay Refund
router.post('/refund', auth, async (req, res) => {
  try {
    const { paymentId, amount, reason, saleId } = req.body;

    // Validate the payment exists
    if (!paymentId || !amount || !reason) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment ID, amount, and reason are required' 
      });
    }

    // First, fetch the payment details from Razorpay to check status
    let paymentDetails;
    try {
      paymentDetails = await razorpay.payments.fetch(paymentId);
    } catch (fetchError) {
      console.error('Error fetching payment details:', fetchError);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payment ID or payment not found' 
      });
    }

    // Check if payment is in a refundable state
    if (paymentDetails.status !== 'captured') {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot refund payment. Payment status is '${paymentDetails.status}'. Only captured payments can be refunded.`,
        paymentStatus: paymentDetails.status
      });
    }

    // Check if payment is already refunded
    if (paymentDetails.amount_refunded > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment has already been refunded partially or fully',
        refundedAmount: paymentDetails.amount_refunded / 100
      });
    }

    // Process refund through Razorpay
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount, // Amount in paise
      notes: {
        reason: reason,
        refund_type: 'full_refund',
        processed_by: req.user.name,
        processed_at: new Date().toISOString()
      }
    });

    // Update the sale status if provided
    if (saleId) {
      await Sale.findByIdAndUpdate(saleId, {
        paymentStatus: 'refunded',
        refundId: refund.id,
        refundAmount: amount / 100, // Convert back to rupees
        refundReason: reason,
        refundDate: new Date()
      });
    }

    // Create a refund record in Payment model (optional)
    const refundRecord = new Payment({
      amount: -(amount / 100), // Negative amount for refund
      paymentMode: 'online',
      transactionId: refund.id,
      status: 'completed',
      description: `Refund for payment ${paymentId}: ${reason}`,
      date: new Date(),
      refundFor: paymentId
    });
    
    await refundRecord.save();

    res.json({
      success: true,
      refund: refund,
      message: 'Refund processed successfully'
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    
    // Handle Razorpay specific errors
    if (error.error && error.error.code) {
      return res.status(400).json({
        success: false,
        error: error.error.description || 'Refund failed'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to process refund: ' + error.message
    });
  }
});

// Check Payment Status
router.get('/status/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Fetch payment details from Razorpay
    const paymentDetails = await razorpay.payments.fetch(paymentId);

    res.json({
      success: true,
      status: paymentDetails.status,
      amount: paymentDetails.amount / 100,
      amountRefunded: paymentDetails.amount_refunded / 100,
      currency: paymentDetails.currency,
      method: paymentDetails.method,
      createdAt: new Date(paymentDetails.created_at * 1000),
      canRefund: paymentDetails.status === 'captured' && paymentDetails.amount_refunded === 0
    });

  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to fetch payment status'
    });
  }
});

// Generate Razorpay Invoice
router.post('/generate-invoice', auth, async (req, res) => {
  try {
    const { invoiceData, paymentId } = req.body;

    if (!invoiceData) {
      return res.status(400).json({
        success: false,
        error: 'Invoice data is required'
      });
    }

    // Validate and clean the invoice data
    const cleanedInvoiceData = {
      ...invoiceData,
      customer: {
        ...invoiceData.customer,
        // Ensure contact number is valid (only digits and +)
        contact: invoiceData.customer.contact.replace(/[^\d+]/g, ''),
        // Ensure email is valid format
        email: invoiceData.customer.email.toLowerCase().trim()
      }
    };

    // Additional validation for contact number
    if (!/^\+?\d{10,15}$/.test(cleanedInvoiceData.customer.contact)) {
      cleanedInvoiceData.customer.contact = '9999999999'; // Default fallback
    }

    console.log('Cleaned invoice data:', JSON.stringify(cleanedInvoiceData, null, 2));

    // Generate invoice through Razorpay
    const invoice = await razorpay.invoices.create(cleanedInvoiceData);

    // Optionally update the payment record with invoice ID
    if (paymentId) {
      await Payment.findByIdAndUpdate(paymentId, {
        invoiceId: invoice.id,
        invoiceUrl: invoice.short_url
      });
    }

    res.json({
      success: true,
      invoice: invoice,
      message: 'Invoice generated successfully'
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    
    // Handle Razorpay specific errors
    if (error.error && error.error.code) {
      return res.status(400).json({
        success: false,
        error: error.error.description || 'Invoice generation failed'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoice: ' + error.message
    });
  }
});

// Capture Razorpay Payment
router.post('/capture', auth, async (req, res) => {
  try {
    const { paymentId, amount } = req.body;
    if (!paymentId || !amount) {
      return res.status(400).json({ success: false, error: 'Payment ID and amount are required' });
    }
    // Capture payment using Razorpay API
    const capture = await razorpay.payments.capture(paymentId, amount);
    console.log('Razorpay capture response:', capture);
    // Update local Payment and Sale status to 'captured'
    await Payment.findOneAndUpdate(
      { transactionId: paymentId },
      { status: 'captured' }
    );
    await Sale.findOneAndUpdate(
      { transactionId: paymentId },
      { paymentStatus: 'captured' }
    );
    // Fetch latest status from Razorpay
    const paymentDetails = await razorpay.payments.fetch(paymentId);
    console.log('Razorpay payment status after capture:', paymentDetails.status);
    res.json({ success: true, capture, status: paymentDetails.status });
  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).json({ success: false, error: error.error?.description || error.message });
  }
});

// Create Razorpay Order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, customer, phone } = req.body;

    console.log('Received order creation request:', { amount, currency, receipt, customer, phone });

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: 'Amount is required'
      });
    }

    // Amount should be in paise (multiply by 100)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        customer_name: customer || '',
        customer_phone: phone || '',
        created_by: 'POS_System',
        salesperson_id: req.user._id.toString()
      }
    };

    console.log('Creating Razorpay order with options:', options);
    console.log('Razorpay key ID:', process.env.RAZORPAY_KEY_ID);

    const order = await razorpay.orders.create(options);
    
    console.log('Razorpay order created successfully:', order);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    console.error('Error details:', error.error || error.message);
    res.status(500).json({
      success: false,
      error: error.error?.description || error.message || 'Failed to create order'
    });
  }
});

// Verify Payment
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID and Order ID are required'
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    console.log('Payment verification:', {
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      status: payment.status,
      amount: payment.amount
    });

    if (payment.status === 'captured' || payment.status === 'authorized') {
      res.json({
        success: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        status: payment.status,
        amount: payment.amount,
        method: payment.method
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Payment not successful. Status: ${payment.status}`
      });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: error.error?.description || error.message || 'Payment verification failed'
    });
  }
});

module.exports = router;
