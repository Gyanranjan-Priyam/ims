import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  Eye,
  Printer,
  Banknote,
  TrendingUp,
  DollarSign,
  Package,
  RefreshCw,
  ArrowRight,
  X,
  Settings,
  LogOut,
  User,
  ScanLine
} from 'lucide-react';
import api from '../lib/api';
import POSReceipt from '../components/POSReceipt';
import BarcodeScanner from '../components/ui/BarcodeScanner';
import NotificationPanel from '../components/ui/NotificationPanel';
import { printReceipt } from '../utils/receiptGenerator';

// Simple toast replacement
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`)
};

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  barcode?: string;
  sku?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CustomerDetails {
  name: string;
  phone: string;
}

interface Sale {
  _id: string;
  product: Product;
  quantity: number;
  total: number;
  customer: string;
  customerPhone: string;
  invoice: string;
  discount: number;
  finalAmount: number;
  paymentMode: 'cash' | 'online';
  transactionId: string;
  salesperson: string;
  createdAt: string;
}

interface Payment {
  _id: string;
  amount: number;
  paymentMode: 'cash' | 'online';
  transactionId: string;
  customer: string;
  customerPhone: string;
  invoice: string;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
}

type PaymentMode = 'cash' | 'online';

const SalesmanDashboard: React.FC = () => {
  // State Management
  const [activeSection, setActiveSection] = useState<'dashboard' | 'pos' | 'payments' | 'sales'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0
  });
  
  // Razorpay loading state
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Barcode Scanner States
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  
  // Customer Details
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    phone: ''
  });
  
  // Payment States
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentError, setPaymentError] = useState('');
  
  // Receipt States
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    transactionId: string;
    paymentMethod: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    customerName: string;
    invoiceNo: string;
  } | null>(null);

  // Fetch Data Functions
  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Failed to fetch sales');
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/sales/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Real-time data fetching
  useEffect(() => {
    const fetchAllData = () => {
      fetchProducts();
      fetchSales();
      fetchPayments();
      fetchDashboardStats();
    };

    fetchAllData();
    
    // Check if Razorpay is loaded with improved detection
    const checkRazorpay = () => {
      if (typeof (window as any).Razorpay !== 'undefined' || (window as any).razorpayLoaded) {
        console.log('Razorpay detected as loaded');
        setIsRazorpayLoaded(true);
      } else if ((window as any).razorpayLoadError) {
        console.error('Razorpay failed to load permanently');
        setIsRazorpayLoaded(false);
      } else {
        // Retry after 1 second
        setTimeout(checkRazorpay, 1000);
      }
    };
    
    // Start checking immediately
    checkRazorpay();
    
    // Also listen for window load event as backup
    const handleWindowLoad = () => {
      setTimeout(checkRazorpay, 500);
    };
    
    if (document.readyState === 'complete') {
      handleWindowLoad();
    } else {
      window.addEventListener('load', handleWindowLoad);
    }
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('load', handleWindowLoad);
    };
  }, []);

  // Cart Functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product._id === product._id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    // toast.success(`${product.name} added to cart`);
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.product._id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerDetails({ name: '', phone: '' });
    setDiscountPercent(0);
    setPaymentMode('cash');
    setPaymentStatus('idle');
    setPaymentError('');
    setShowCheckout(false);
  };

  // Barcode Functions
  const handleBarcodeDetected = (barcode: string) => {
    console.log('Barcode detected in POS:', barcode);
    
    // First, try to find product by barcode in current products
    const foundProduct = products.find(product => 
      product.barcode === barcode || 
      product.sku === barcode ||
      product._id === barcode
    );
    
    if (foundProduct) {
      // Add found product to cart
      addToCart(foundProduct);
      toast.success(`${foundProduct.name} added to cart via barcode scan!`);
      setIsBarcodeScannerOpen(false);
    } else {
      // If not found locally, search in search query to trigger filtering
      setSearchQuery(barcode);
      toast.error(`Product with barcode ${barcode} not found. Try searching manually.`);
      setIsBarcodeScannerOpen(false);
    }
  };

  const openBarcodeScanner = () => {
    setIsBarcodeScannerOpen(true);
  };

  // Calculation Functions
  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getDiscountAmount = () => {
    return (getSubtotal() * discountPercent) / 100;
  };

  const getFinalAmount = () => {
    return getSubtotal() - getDiscountAmount();
  };

  // Payment Processing
  const generateTransactionId = () => {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const processRazorpayPayment = async (): Promise<string> => {
    try {
      console.log('Creating Razorpay order...');
      
      // Step 1: Create order on backend
      const orderResponse = await api.post('/payments/create-order', {
        amount: getFinalAmount(),
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        customer: customerDetails.name,
        phone: customerDetails.phone
      });

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.error || 'Failed to create order');
      }

      const { order_id, amount, currency } = orderResponse.data;
      console.log('Order created successfully:', { order_id, amount, currency });

      // Step 2: Create payment page content for new window
      const paymentPageContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>SmartPOS Payment</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .payment-container {
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 400px;
              width: 100%;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 20px;
            }
            .amount {
              font-size: 32px;
              font-weight: bold;
              color: #1f2937;
              margin: 20px 0;
            }
            .customer-info {
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .loading {
              color: #6b7280;
              margin: 20px 0;
            }
            .error {
              color: #ef4444;
              background: #fef2f2;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .success {
              color: #10b981;
              background: #f0fdf4;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="payment-container">
            <div class="logo">SmartPOS Payment</div>
            <div class="amount">₹${(amount / 100).toFixed(2)}</div>
            <div class="customer-info">
              <strong>Customer:</strong> ${customerDetails.name}<br>
              <strong>Phone:</strong> ${customerDetails.phone}
            </div>
            <div id="status" class="loading">Initializing payment...</div>
          </div>

          <script>
            window.onload = function() {
              try {
                if (typeof Razorpay === 'undefined') {
                  document.getElementById('status').innerHTML = 
                    '<div class="error">Payment gateway failed to load. Please close this window and try again.</div>';
                  return;
                }

                const options = {
                  key: '${import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RA04Y5v6BCVxAl'}',
                  amount: ${amount},
                  currency: '${currency}',
                  name: 'SmartPOS Store',
                  description: 'Payment for ${customerDetails.name}',
                  order_id: '${order_id}',
                  handler: function(response) {
                    console.log('Payment successful:', response);
                    document.getElementById('status').innerHTML = 
                      '<div class="success">Payment successful! Verifying...</div>';
                    
                    // Send payment data back to parent window
                    if (window.opener) {
                      window.opener.postMessage({
                        type: 'PAYMENT_SUCCESS',
                        data: {
                          razorpay_payment_id: response.razorpay_payment_id,
                          razorpay_order_id: response.razorpay_order_id,
                          razorpay_signature: response.razorpay_signature
                        }
                      }, '*');
                    }
                    
                    setTimeout(() => {
                      window.close();
                    }, 2000);
                  },
                  prefill: {
                    name: '${customerDetails.name}',
                    contact: '${customerDetails.phone}',
                    email: '${customerDetails.phone}@smartpos.com'
                  },
                  theme: {
                    color: '#3b82f6'
                  },
                  modal: {
                    ondismiss: function() {
                      console.log('Payment dismissed');
                      if (window.opener) {
                        window.opener.postMessage({
                          type: 'PAYMENT_CANCELLED'
                        }, '*');
                      }
                      window.close();
                    }
                  },
                  notes: {
                    customer_name: '${customerDetails.name}',
                    customer_phone: '${customerDetails.phone}',
                    pos_system: 'SmartPOS'
                  }
                };

                document.getElementById('status').innerHTML = 
                  '<div class="loading">Opening payment interface...</div>';

                const rzp = new Razorpay(options);
                
                rzp.on('payment.failed', function(response) {
                  console.error('Payment failed:', response);
                  document.getElementById('status').innerHTML = 
                    '<div class="error">Payment failed: ' + (response.error.description || 'Please try again') + '</div>';
                  
                  if (window.opener) {
                    window.opener.postMessage({
                      type: 'PAYMENT_FAILED',
                      error: response.error.description || 'Payment failed'
                    }, '*');
                  }
                  
                  setTimeout(() => {
                    window.close();
                  }, 3000);
                });

                rzp.open();
                
              } catch (error) {
                console.error('Error initializing payment:', error);
                document.getElementById('status').innerHTML = 
                  '<div class="error">Failed to initialize payment. Please close this window and try again.</div>';
              }
            };
          </script>
        </body>
        </html>
      `;

      // Step 3: Open payment in new browser window
      return new Promise((resolve, reject) => {
        const paymentWindow = window.open('', 'razorpay_payment', 
          'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=no,toolbar=no,menubar=no'
        );

        if (!paymentWindow) {
          reject(new Error('Failed to open payment window. Please allow popups and try again.'));
          return;
        }

        // Write the payment page content to the new window
        paymentWindow.document.write(paymentPageContent);
        paymentWindow.document.close();

        // Listen for messages from the payment window
        const messageHandler = async (event: MessageEvent) => {
          // Verify origin for security (in production, check specific origin)
          if (event.source !== paymentWindow) return;

          try {
            switch (event.data.type) {
              case 'PAYMENT_SUCCESS':
                console.log('Payment successful in new window:', event.data.data);
                
                // Verify payment on backend
                const verifyResponse = await api.post('/payments/verify-payment', {
                  razorpay_payment_id: event.data.data.razorpay_payment_id,
                  razorpay_order_id: event.data.data.razorpay_order_id,
                  razorpay_signature: event.data.data.razorpay_signature
                });

                if (verifyResponse.data.success) {
                  window.removeEventListener('message', messageHandler);
                  resolve(event.data.data.razorpay_payment_id);
                } else {
                  window.removeEventListener('message', messageHandler);
                  reject(new Error('Payment verification failed'));
                }
                break;

              case 'PAYMENT_CANCELLED':
                console.log('Payment cancelled by user');
                window.removeEventListener('message', messageHandler);
                reject(new Error('Payment was cancelled by user'));
                break;

              case 'PAYMENT_FAILED':
                console.error('Payment failed:', event.data.error);
                window.removeEventListener('message', messageHandler);
                reject(new Error(event.data.error || 'Payment failed'));
                break;
            }
          } catch (error: any) {
            console.error('Error handling payment response:', error);
            window.removeEventListener('message', messageHandler);
            reject(new Error('Payment verification failed'));
          }
        };

        window.addEventListener('message', messageHandler);

        // Handle case where user closes window manually
        const checkClosed = setInterval(() => {
          if (paymentWindow.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            reject(new Error('Payment window was closed'));
          }
        }, 1000);

        // Focus the payment window
        paymentWindow.focus();
      });

    } catch (orderError: any) {
      console.error('Error creating order:', orderError);
      const errorMessage = orderError.response?.data?.error || orderError.message || 'Failed to create payment order';
      throw new Error(errorMessage);
    }
  };

  const processSale = async () => {
    // Validation checks
    if (cart.length === 0) {
      setPaymentError('Cart is empty. Please add items before checkout.');
      return;
    }

    if (!customerDetails.name.trim()) {
      setPaymentError('Please enter customer name');
      return;
    }

    if (!customerDetails.phone.trim()) {
      setPaymentError('Please enter customer phone number');
      return;
    }

    if (customerDetails.phone.length !== 10 || !/^\d{10}$/.test(customerDetails.phone)) {
      setPaymentError('Please enter a valid 10-digit phone number');
      return;
    }

    if (paymentMode === 'online' && !isRazorpayLoaded) {
      setPaymentError('Payment gateway not available. Please try cash payment or refresh the page.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentStatus('processing');
    setPaymentError('');
    
    try {
      const invoiceNo = `INV-${Date.now()}`;
      let transactionId = '';

      if (paymentMode === 'online') {
        try {
          console.log('Starting online payment process...');
          console.log('Customer details:', customerDetails);
          console.log('Final amount:', getFinalAmount());
          
          // Update status to show payment window is opening
          setPaymentStatus('processing');
          setPaymentError('');
          
          // Show user that payment window is opening
          // toast.success('Opening new payment window... Please complete your payment in the new browser window.');
          
          transactionId = await processRazorpayPayment();
          console.log('Payment completed successfully with ID:', transactionId);
          
          // Show success message
          setPaymentStatus('success');
          // toast.success('Payment confirmed in new window! Processing your order...');
          
        } catch (error: any) {
          console.error('Payment error:', error);
          setIsProcessingPayment(false);
          setPaymentStatus('error');
          
          let errorMessage = 'Payment could not be completed. Please try again.';
          
          if (error.message.includes('cancelled by user')) {
            errorMessage = 'Payment was cancelled. You can try again or choose cash payment.';
          } else if (error.message.includes('failed') || error.message.includes('verification failed')) {
            errorMessage = 'Payment failed. Please check your payment method and try again.';
          } else if (error.message.includes('popup')) {
            errorMessage = 'Payment window blocked. Please allow popups for this site and try again.';
          } else if (error.message.includes('SDK not loaded')) {
            errorMessage = 'Payment gateway not available. Please refresh the page and try again.';
          } else if (error.message.includes('create order') || error.message.includes('Failed to create order')) {
            errorMessage = 'Unable to create payment order. Please check your connection and try again.';
          } else {
            errorMessage = `Payment error: ${error.message}`;
          }
          
          setPaymentError(errorMessage);
          toast.error(errorMessage);
          return;
        }
      } else {
        transactionId = generateTransactionId();
      }

      // Validate transaction ID
      if (!transactionId) {
        throw new Error('Transaction ID not generated');
      }

      console.log('Processing sale with transaction ID:', transactionId);

      // Process each cart item
      const salePromises = cart.map(async (item) => {
        return api.post('/sales', {
          product: item.product._id,
          quantity: item.quantity,
          total: item.product.price * item.quantity,
          customer: customerDetails.name.trim(),
          customerPhone: customerDetails.phone.trim(),
          invoice: invoiceNo,
          discount: discountPercent,
          finalAmount: getFinalAmount(),
          paymentMode,
          transactionId,
        });
      });

      await Promise.all(salePromises);

      // Create payment record
      await api.post('/payments', {
        amount: getFinalAmount(),
        paymentMode,
        transactionId,
        customer: customerDetails.name.trim(),
        customerPhone: customerDetails.phone.trim(),
        invoice: invoiceNo,
        status: 'completed'
      });

      // Prepare receipt data for display
      const receiptItems = cart.map(item => ({
        id: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity
      }));

      setReceiptData({
        transactionId,
        paymentMethod: paymentMode === 'online' ? 'Online Payment' : 'Cash',
        items: receiptItems,
        customerName: customerDetails.name,
        invoiceNo
      });
      
      setPaymentStatus('success');
      setIsProcessingPayment(false);
      
      // Show receipt immediately after success
      setShowReceipt(true);
      
      // Show success message and clean up
      toast.success(`Sale completed successfully! Invoice: ${invoiceNo} - Receipt ready to print!`);
      
      setTimeout(() => {
        clearCart();
        fetchSales();
        fetchPayments();
        fetchDashboardStats();
        fetchProducts();
      }, 3000); // Give user time to see the receipt

    } catch (error: any) {
      console.error('Error processing sale:', error);
      setIsProcessingPayment(false);
      setPaymentStatus('error');
      const errorMessage = error.response?.data?.message || error.message || 'Error processing sale. Please try again.';
      setPaymentError(errorMessage);
    }
  };



  // Delete Functions
  const deletePayment = async (paymentId: string) => {
    try {
      const response = await api.delete(`/payments/${paymentId}`);
      if (response.data.deletedInvoice) {
        toast.success(`Payment and related sales deleted successfully (Invoice: ${response.data.deletedInvoice})`);
      } else {
        toast.success('Payment deleted successfully');
      }
      
      // Refresh all related data
      fetchPayments();
      fetchSales();
      fetchDashboardStats();
      fetchProducts(); // Refresh products in case stock was updated
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete payment';
      toast.error(errorMessage);
    }
  };

  const deleteSale = async (saleId: string) => {
    try {
      const response = await api.delete(`/sales/${saleId}`);
      if (response.data.deletedInvoice) {
        toast.success(`Sale and related payments deleted successfully (Invoice: ${response.data.deletedInvoice})`);
      } else {
        toast.success('Sale deleted successfully');
      }
      
      // Refresh all related data
      fetchSales();
      fetchPayments();
      fetchDashboardStats();
      fetchProducts(); // Refresh products as stock was restored
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete sale';
      toast.error(errorMessage);
    }
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-slate-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                SmartPOS
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Salesman Dashboard
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationPanel />
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              
              {/* Razorpay Status Indicator */}
              <div className="flex items-center space-x-2">
                {isRazorpayLoaded ? (
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    Payment Gateway Ready
                  </Badge>
                ) : (window as any).razorpayLoadError ? (
                  <Badge variant="destructive">
                    Payment Gateway Error
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Loading Payment Gateway...
                  </Badge>
                )}
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-100">
                  <User className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {JSON.parse(localStorage.getItem('user') || '{}').name || 'Salesman'}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <nav className="space-y-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'pos', label: 'POS System', icon: ShoppingCart },
                { id: 'payments', label: 'Payments', icon: CreditCard },
                { id: 'sales', label: 'Sales History', icon: Receipt },
              ].map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  className={cn(
                    "w-full justify-start",
                    activeSection === item.id && "bg-blue-600 text-white shadow-md"
                  )}
                  onClick={() => setActiveSection(item.id as any)}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <Button 
                  onClick={() => {
                    fetchDashboardStats();
                    fetchSales();
                    fetchPayments();
                    fetchProducts();
                  }}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                    <TrendingUp className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.todaySales}</div>
                    <p className="text-xs text-blue-100">Sales completed today</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                    <DollarSign className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.todayRevenue.toLocaleString()}</div>
                    <p className="text-xs text-green-100">Revenue generated today</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProducts}</div>
                    <p className="text-xs text-purple-100">Products in inventory</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                    <Package className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.lowStockProducts}</div>
                    <p className="text-xs text-orange-100">Products need restock</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sales.slice(0, 5).map((sale) => (
                        <div key={sale._id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{sale.invoice}</p>
                            <p className="text-sm text-slate-500">{sale.customer}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{sale.finalAmount}</p>
                            <p className="text-sm text-slate-500">{new Date(sale.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {payments.slice(0, 5).map((payment) => (
                        <div key={payment._id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{payment.transactionId}</p>
                            <p className="text-sm text-slate-500">{payment.customer}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{payment.amount}</p>
                            <Badge variant={payment.paymentMode === 'online' ? 'default' : 'secondary'}>
                              {payment.paymentMode}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* POS Section */}
          {activeSection === 'pos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">POS System</h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button
                      onClick={openBarcodeScanner}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      title="Scan barcode to find product"
                    >
                      <ScanLine className="h-4 w-4" />
                      Scan
                    </Button>
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => {
                      fetchProducts();
                      fetchSales();
                      fetchPayments();
                      fetchDashboardStats();
                      toast.success('POS data refreshed successfully!');
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-green-50 hover:bg-green-100 border-green-200"
                    title="Refresh POS data without reloading page"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Quick Scan Section */}
              <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ScanLine className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">Quick Barcode Scan</h3>
                        <p className="text-sm text-slate-600">Scan product barcode to instantly add to cart</p>
                      </div>
                    </div>
                    <Button
                      onClick={openBarcodeScanner}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <ScanLine className="h-4 w-4" />
                      Start Scanning
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Products Grid */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {filteredProducts.map((product) => (
                          <Card 
                            key={product._id} 
                            className="cursor-pointer hover:shadow-md transition-shadow relative group"
                          >
                            <CardContent className="p-4">
                              <h3 className="font-medium text-slate-900">{product.name}</h3>
                              <p className="text-sm text-slate-500">{product.category}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-lg font-bold text-blue-600">₹{product.price}</span>
                                <Badge variant={product.stock > 10 ? 'default' : 'destructive'}>
                                  Stock: {product.stock}
                                </Badge>
                              </div>
                              {/* Add to Cart Button */}
                              <Button
                                className="absolute top-2 right-2 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                                disabled={product.stock <= 0}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cart */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Cart
                        {cart.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearCart}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {cart.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">Cart is empty</p>
                      ) : (
                        <>
                          <ScrollArea className="h-64 mb-4">
                            <div className="space-y-3">
                              {cart.map((item) => (
                                <div key={item.product._id} className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{item.product.name}</p>
                                    <p className="text-xs text-slate-500">₹{item.product.price} each</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateCartQuantity(item.product._id, item.quantity - 1)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center">{item.quantity}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateCartQuantity(item.product._id, item.quantity + 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFromCart(item.product._id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>

                          <Separator className="my-4" />

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>₹{getSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Discount ({discountPercent}%):</span>
                              <span>-₹{getDiscountAmount().toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                              <span>Total:</span>
                              <span className="text-blue-600">₹{getFinalAmount().toFixed(2)}</span>
                            </div>
                          </div>

                          <Button
                            className="w-full mt-4"
                            onClick={() => {
                              // Clear any previous errors
                              setPaymentError('');
                              
                              // Check if cart has items
                              if (cart.length === 0) {
                                setPaymentError('Please add items to cart before checkout.');
                                return;
                              }
                              
                              // Check Razorpay status
                              if ((window as any).razorpayLoadError) {
                                setPaymentError('Payment gateway failed to load. Please refresh the page or use cash payment.');
                                return;
                              }
                              
                              if (!isRazorpayLoaded && typeof (window as any).Razorpay === 'undefined') {
                                setPaymentError('Payment gateway is still loading. Please wait a moment and try again.');
                                return;
                              }
                              
                              setShowCheckout(true);
                            }}
                            disabled={cart.length === 0}
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            {!isRazorpayLoaded && typeof (window as any).Razorpay === 'undefined' ? 
                              'Loading Payment Gateway...' : 
                              'Proceed to Checkout'
                            }
                          </Button>
                          
                          {/* Payment Error Display */}
                          {paymentError && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                              <p className="text-sm text-red-600">{paymentError}</p>
                              {paymentError.includes('gateway failed') && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="mt-2"
                                  onClick={() => {
                                    fetchProducts();
                                    fetchSales();
                                    fetchPayments();
                                    fetchDashboardStats();
                                    setPaymentError('');
                                    toast.success('Payment gateway refreshed!');
                                  }}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Refresh Data
                                </Button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Barcode Scanner Dialog */}
              <BarcodeScanner
                isOpen={isBarcodeScannerOpen}
                onClose={() => setIsBarcodeScannerOpen(false)}
                onBarcodeDetected={handleBarcodeDetected}
                currentBarcode=""
              />
            </div>
          )}

          {/* Payments Section */}
          {activeSection === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">Payment History</h1>
                <Button 
                  onClick={fetchPayments}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Payments</CardTitle>
                  <CardDescription>Complete payment transaction history</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Mode</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell className="font-mono text-sm">{payment.transactionId}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.customer}</p>
                              <p className="text-sm text-slate-500">{payment.customerPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">₹{payment.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={payment.paymentMode === 'online' ? 'default' : 'secondary'}>
                              {payment.paymentMode}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Print payment receipt using receipt template
                                  printReceipt({
                                    transactionId: payment.transactionId,
                                    cashier: "Salesperson",
                                    customer: payment.customer,
                                    customerPhone: payment.customerPhone,
                                    items: [], // Payment receipt doesn't show items
                                    paymentMethod: payment.paymentMode,
                                    paymentAmount: payment.amount,
                                    date: new Date(payment.createdAt)
                                  });
                                }}
                              >
                                <Printer className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to permanently delete this payment record? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deletePayment(payment._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sales Section */}
          {activeSection === 'sales' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">Sales History</h1>
                <Button 
                  onClick={fetchSales}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Sales</CardTitle>
                  <CardDescription>Complete sales transaction history</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Mode</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow key={sale._id}>
                          <TableCell className="font-mono text-sm">{sale.invoice}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sale.customer}</p>
                              <p className="text-sm text-slate-500">{sale.customerPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{sale.product.name}</TableCell>
                          <TableCell>{sale.quantity}</TableCell>
                          <TableCell className="font-bold">₹{sale.finalAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={sale.paymentMode === 'online' ? 'default' : 'secondary'}>
                              {sale.paymentMode}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Sale Details</DialogTitle>
                                    <DialogDescription>
                                      Complete information about this sale
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Invoice Number</Label>
                                        <p className="font-mono">{sale.invoice}</p>
                                      </div>
                                      <div>
                                        <Label>Transaction ID</Label>
                                        <p className="font-mono">{sale.transactionId}</p>
                                      </div>
                                      <div>
                                        <Label>Customer</Label>
                                        <p>{sale.customer}</p>
                                      </div>
                                      <div>
                                        <Label>Phone</Label>
                                        <p>{sale.customerPhone}</p>
                                      </div>
                                      <div>
                                        <Label>Product</Label>
                                        <p>{sale.product.name}</p>
                                      </div>
                                      <div>
                                        <Label>Quantity</Label>
                                        <p>{sale.quantity}</p>
                                      </div>
                                      <div>
                                        <Label>Unit Price</Label>
                                        <p>₹{sale.product.price}</p>
                                      </div>
                                      <div>
                                        <Label>Total</Label>
                                        <p>₹{sale.total}</p>
                                      </div>
                                      <div>
                                        <Label>Discount</Label>
                                        <p>{sale.discount}%</p>
                                      </div>
                                      <div>
                                        <Label>Final Amount</Label>
                                        <p className="font-bold">₹{sale.finalAmount}</p>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Print individual sale invoice using receipt template
                                  printReceipt({
                                    transactionId: sale.transactionId,
                                    invoiceNo: sale.invoice,
                                    cashier: "Salesperson",
                                    customer: sale.customer,
                                    customerPhone: sale.customerPhone,
                                    items: [{
                                      id: sale.product._id,
                                      name: sale.product.name,
                                      quantity: sale.quantity,
                                      price: sale.product.price,
                                      total: sale.total
                                    }],
                                    paymentMethod: sale.paymentMode,
                                    discount: sale.discount,
                                    date: new Date(sale.createdAt)
                                  });
                                }}
                              >
                                <Printer className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Sale</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to permanently delete this sale record? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteSale(sale._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Complete your sale</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Details */}
            <div className="space-y-3">
              <Label>Customer Details</Label>
              <Input
                placeholder="Customer Name"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Phone Number"
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                maxLength={10}
              />
            </div>

            {/* Discount */}
            <div>
              <Label>Discount (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
              />
            </div>

            {/* Payment Mode */}
            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Card 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    paymentMode === 'cash' 
                      ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md' 
                      : 'hover:bg-slate-50 border-slate-200'
                  )}
                  onClick={() => {
                    setPaymentMode('cash');
                    setPaymentError('');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <Banknote className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <span className="font-medium">Cash</span>
                  </CardContent>
                </Card>
                
                <Card 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    paymentMode === 'online' 
                      ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md' 
                      : 'hover:bg-slate-50 border-slate-200'
                  )}
                  onClick={() => {
                    setPaymentMode('online');
                    setPaymentError('');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <CreditCard className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <span className="font-medium">Online</span>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Order Summary */}
            <Card className="bg-slate-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount ({discountPercent}%):</span>
                    <span>-₹{getDiscountAmount().toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">₹{getFinalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status Messages */}
            {paymentStatus === 'processing' && paymentMode === 'online' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-600">
                  🔄 New payment window opened. Please complete your payment in the browser window and return here.
                </p>
              </div>
            )}

            {/* Error Message */}
            {paymentError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{paymentError}</p>
              </div>
            )}

            {/* Success Message */}
            {paymentStatus === 'success' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">✅ Payment confirmed! Generating invoice and completing order...</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCheckout(false);
                  setPaymentError('');
                  setPaymentStatus('idle');
                }}
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={processSale}
                disabled={
                  !customerDetails.name || 
                  !customerDetails.phone || 
                  customerDetails.phone.length !== 10 ||
                  isProcessingPayment || 
                  paymentStatus === 'success'
                }
              >
                {isProcessingPayment && (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isProcessingPayment ? (
                  paymentMode === 'online' ? 
                    (paymentStatus === 'processing' ? 'Complete Payment in Browser Window...' : 'Processing Order...') : 
                    'Processing Sale...'
                ) : (
                  paymentMode === 'online' ? 'Pay Online (New Browser Window)' : 'Complete Cash Sale'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Generated</DialogTitle>
            <DialogDescription>
              Your transaction has been completed successfully. Here's your receipt:
            </DialogDescription>
          </DialogHeader>

          {receiptData && (
            <div className="space-y-4">
              <POSReceipt
                storeInfo={{
                  name: "SmartPOS Store",
                  address: "123 Business Street, Downtown, NY 10001",
                  phone: "(555) 123-4567",
                  email: "info@smartpos.com"
                }}
                transactionId={receiptData.transactionId}
                cashier={JSON.parse(localStorage.getItem('user') || '{}').name || 'Salesperson'}
                items={receiptData.items}
                paymentMethod={receiptData.paymentMethod}
              />

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Print the receipt
                    window.print();
                  }}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                <Button
                  onClick={() => {
                    setShowReceipt(false);
                    setReceiptData(null);
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesmanDashboard;
