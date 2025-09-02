const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'salesperson'], required: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  lastLogout: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
