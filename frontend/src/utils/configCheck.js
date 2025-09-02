// Configuration validation script
// Run this in browser console to verify environment variables

console.log('🔧 Environment Configuration Check');
console.log('================================');

// Frontend Environment Variables
console.log('📱 Frontend Configuration:');
console.log('API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000');
console.log('Razorpay Key:', import.meta.env.VITE_RAZORPAY_KEY_ID || 'Not set');
console.log('Environment:', import.meta.env.VITE_NODE_ENV || 'development');

// API Instance Configuration
import api from './lib/api';
console.log('🌐 API Instance Base URL:', api.defaults.baseURL);

// Test API connection
console.log('🔄 Testing API connection...');
api.get('/health')
  .then(() => console.log('✅ API connection successful'))
  .catch(error => {
    console.log('❌ API connection failed:', error.message);
    console.log('🔍 Check your VITE_API_URL and backend server');
  });

// Environment specific messages
if (import.meta.env.VITE_API_URL?.includes('localhost')) {
  console.log('🏠 Running in LOCAL development mode');
} else {
  console.log('🌍 Running in PRODUCTION mode');
  console.log('🚀 Backend URL:', import.meta.env.VITE_API_URL);
}
