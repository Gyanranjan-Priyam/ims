const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    barcode: { type: String, required: true, unique: true }, // matches frontend
    category: { type: String },
    supplier: { type: String },
    stock: { type: Number, default: 0 },
    price: { type: Number, required: true }, // matches frontend
    lowStockAlert: { type: Number, default: 5 },
    description: { type: String },
    lastRestocked: { type: Date }, // use Date for better queries
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
    },
    image: { type: String }, // optional: keep if you want product images
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);
