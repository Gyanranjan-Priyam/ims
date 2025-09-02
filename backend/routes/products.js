const express = require('express');
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new product (admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ 
      message: 'Product deleted permanently',
      deletedProduct: {
        id: product._id,
        name: product.name,
        sku: product.sku
      }
    });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
});

module.exports = router;
