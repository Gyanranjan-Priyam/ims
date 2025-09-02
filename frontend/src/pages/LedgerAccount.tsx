import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Wallet,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  FileText,
  Search,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  X,
  Building2,
  Activity,
  Edit,
  Trash2,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface Ledger {
  _id: string;
  ledgerId: string;
  name: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  upiId?: string;
  balance: number;
  ledgerType: 'customer' | 'supplier' | 'expense' | 'income';
  status: 'active' | 'inactive';
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface LedgerEntry {
  _id: string;
  ledgerId: string;
  entryType: 'debit' | 'credit';
  amount: number;
  description: string;
  transactionId: string;
  category: 'sales' | 'purchase' | 'expense' | 'income' | 'loan' | 'investment';
  paymentMethod?: string;
  date: string;
  notes?: string;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  isPaymentTransaction?: boolean;
  originalTransactionType?: 'payment_received' | 'payment_made' | 'adjustment';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

interface Transaction {
  _id: string;
  ledgerId: string;
  transactionType: 'payment_received' | 'payment_made' | 'adjustment';
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'online';
  transactionId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  description?: string;
  date: string;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface DashboardData {
  ledger: Ledger;
  balance: number;
  totalDebits: number;
  totalCredits: number;
  totalPaymentsReceived: number;
  totalPaymentsMade: number;
  entryCount: number;
  transactionCount: number;
  recentEntries: LedgerEntry[];
  recentTransactions: Transaction[];
}

const LedgerAccount = () => {
  const { ledgerId } = useParams();
  const navigate = useNavigate();
  
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Filter and search states
  const [entrySearchTerm, setEntrySearchTerm] = useState('');
  const [entryFilter, setEntryFilter] = useState('all');
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Print refs
  const printRef = useRef<HTMLDivElement>(null);
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  
  // Selected transaction for receipt printing
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  // Dialog states
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  
  // Razorpay loading state
  const [, setIsRazorpayLoaded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Form states
  const [entryForm, setEntryForm] = useState({
    entryType: 'debit' as 'debit' | 'credit',
    amount: '',
    description: '',
    transactionId: '',
    category: 'sales' as 'sales' | 'purchase' | 'expense' | 'income' | 'loan' | 'investment',
    paymentMethod: '',
    notes: ''
  });
  
  const [transactionForm, setTransactionForm] = useState({
    transactionType: 'payment_received' as 'payment_received' | 'payment_made' | 'adjustment',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'upi' | 'online',
    transactionId: '',
    description: ''
  });

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const [ledgerRes, dashboardRes, entriesRes, transactionsRes] = await Promise.all([
        api.get(`/ledger/${ledgerId}`),
        api.get(`/ledger/${ledgerId}/dashboard`),
        api.get(`/ledger/${ledgerId}/combined-entries`),
        api.get(`/ledger/${ledgerId}/transactions`)
      ]);
      
      setLedger(ledgerRes.data);
      setDashboardData(dashboardRes.data);
      setEntries(entriesRes.data);
      setTransactions(transactionsRes.data);
    } catch (err) {
      console.error('Error fetching ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ledgerId) {
      fetchLedgerData();
    }
  }, [ledgerId]);

  // Check if Razorpay is loaded
  useEffect(() => {
    const checkRazorpay = () => {
      if (typeof (window as any).Razorpay !== 'undefined' || (window as any).razorpayLoaded) {
        console.log('Razorpay detected as loaded');
        setIsRazorpayLoaded(true);
      } else if ((window as any).razorpayLoadError) {
        console.error('Razorpay failed to load permanently');
        setIsRazorpayLoaded(false);
      } else {
        console.log('Razorpay not yet loaded, checking again...');
        setTimeout(checkRazorpay, 1000);
      }
    };

    checkRazorpay();

    // Also check periodically
    if (typeof (window as any).Razorpay === 'undefined') {
      setTimeout(checkRazorpay, 500);
    }
  }, []);

  const handleAddEntry = async () => {
    try {
      const entryData: any = {
        entryType: entryForm.entryType,
        amount: parseFloat(entryForm.amount),
        description: entryForm.description,
        category: entryForm.category,
        paymentMethod: entryForm.paymentMethod,
        notes: entryForm.notes
      };

      if (entryForm.transactionId && entryForm.transactionId.trim() !== '') {
        entryData.transactionId = entryForm.transactionId;
      }
      
      await api.post(`/ledger/${ledgerId}/entries`, entryData);
      
      await fetchLedgerData();
      setIsAddEntryOpen(false);
      setEntryForm({
        entryType: 'debit',
        amount: '',
        description: '',
        transactionId: '',
        category: 'sales',
        paymentMethod: '',
        notes: ''
      });
    } catch (err) {
      console.error('Error adding entry:', err);
    }
  };

  const processRazorpayPayment = async (transactionData: any): Promise<string> => {
    try {
      console.log('Creating Razorpay order for ledger transaction...');
      
      // Step 1: Create order on backend
      const orderResponse = await api.post('/payments/create-order', {
        amount: transactionData.amount,
        currency: 'INR',
        receipt: `ledger_${Date.now()}`,
        customer: ledger?.name || 'Ledger Customer',
        phone: ledger?.contactInfo?.phone || 'N/A'
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
          <title>Ledger Payment - SmartPOS</title>
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
            <div class="logo">Ledger Payment</div>
            <div class="amount">₹${(amount / 100).toFixed(2)}</div>
            <div class="customer-info">
              <strong>Ledger:</strong> ${ledger?.name || 'N/A'}<br>
              <strong>Phone:</strong> ${ledger?.contactInfo?.phone || 'N/A'}<br>
              <strong>Type:</strong> ${transactionData.transactionType.replace('_', ' ')}
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
                  name: 'SmartPOS Ledger',
                  description: '${transactionData.description || 'Ledger Transaction'}',
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
                    name: '${ledger?.name || 'Ledger Customer'}',
                    contact: '${ledger?.contactInfo?.phone || ''}',
                    email: '${ledger?.contactInfo?.email || ''}'
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
                    ledger_name: '${ledger?.name || 'N/A'}',
                    ledger_id: '${ledger?.ledgerId || 'N/A'}',
                    transaction_type: '${transactionData.transactionType}',
                    system: 'SmartPOS_Ledger'
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
        const paymentWindow = window.open('', 'razorpay_ledger_payment', 
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
          // Verify origin for security
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

  const handleAddTransaction = async () => {
    try {
      setIsProcessingPayment(true);
      
      const transactionData: any = {
        transactionType: transactionForm.transactionType,
        amount: parseFloat(transactionForm.amount),
        paymentMethod: transactionForm.paymentMethod,
        description: transactionForm.description
      };

      if (transactionForm.paymentMethod === 'upi' && transactionForm.transactionId && transactionForm.transactionId.trim() !== '') {
        transactionData.transactionId = transactionForm.transactionId;
      }

      if (transactionForm.paymentMethod === 'online') {
        try {
          // Process payment through new window
          const paymentId = await processRazorpayPayment(transactionData);
          
          // Add payment ID to transaction data
          transactionData.razorpayPaymentId = paymentId;
          
          // Create transaction with payment details
          await api.post(`/ledger/${ledgerId}/transactions`, transactionData);
          
          // Success - close dialog and refresh
          setIsAddTransactionOpen(false);
          setTransactionForm({
            transactionType: 'payment_received',
            amount: '',
            paymentMethod: 'cash',
            transactionId: '',
            description: ''
          });
          await fetchLedgerData();
          
        } catch (paymentError: any) {
          console.error('Payment failed:', paymentError);
          alert(`Payment failed: ${paymentError.message}`);
        }
      } else {
        // For cash/UPI payments, create transaction directly
        await api.post(`/ledger/${ledgerId}/transactions`, transactionData);
        
        setIsAddTransactionOpen(false);
        setTransactionForm({
          transactionType: 'payment_received',
          amount: '',
          paymentMethod: 'cash',
          transactionId: '',
          description: ''
        });
        
        await fetchLedgerData();
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
      alert('Error processing transaction. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleEditEntry = (entry: LedgerEntry) => {
    console.log('Edit entry:', entry);
  };

  const handleDeleteEntry = async (entryId: string) => {
    const entry = entries.find(e => e._id === entryId);
    if (entry?.isPaymentTransaction) {
      alert('Payment transactions cannot be deleted from here. Please use the Payments tab.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await api.delete(`/ledger/entries/${entryId}`);
        await fetchLedgerData();
      } catch (err) {
        console.error('Error deleting entry:', err);
      }
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/ledger/transactions/${transactionId}`);
        await fetchLedgerData();
      } catch (err) {
        console.error('Error deleting transaction:', err);
      }
    }
  };

  const getFilteredEntries = () => {
    let filtered = entries;

    if (entrySearchTerm) {
      filtered = filtered.filter(entry =>
        entry.description.toLowerCase().includes(entrySearchTerm.toLowerCase()) ||
        entry.transactionId.toLowerCase().includes(entrySearchTerm.toLowerCase()) ||
        entry.category.toLowerCase().includes(entrySearchTerm.toLowerCase())
      );
    }

    if (entryFilter !== 'all') {
      if (entryFilter === 'payment') {
        filtered = filtered.filter(entry => entry.isPaymentTransaction);
      } else if (entryFilter === 'manual') {
        filtered = filtered.filter(entry => !entry.isPaymentTransaction);
      } else {
        filtered = filtered.filter(entry => entry.entryType === entryFilter);
      }
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        switch (dateFilter) {
          case 'today':
            return entryDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return entryDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return entryDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;

    if (transactionSearchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description?.toLowerCase().includes(transactionSearchTerm.toLowerCase()) ||
        transaction.transactionId.toLowerCase().includes(transactionSearchTerm.toLowerCase()) ||
        transaction.paymentMethod.toLowerCase().includes(transactionSearchTerm.toLowerCase())
      );
    }

    if (transactionFilter !== 'all') {
      if (transactionFilter === 'payment_method') {
        // Additional filter by payment method if needed
      } else {
        filtered = filtered.filter(transaction => transaction.transactionType === transactionFilter);
      }
    }

    return filtered;
  };

  const exportToExcel = () => {
    const filteredEntries = getFilteredEntries();
    const ws = XLSX.utils.json_to_sheet(
      filteredEntries.map(entry => ({
        Date: format(new Date(entry.date), 'dd/MM/yyyy'),
        Description: entry.description,
        Category: entry.category,
        Type: entry.entryType,
        Amount: entry.amount,
        'Transaction ID': entry.transactionId,
        Source: entry.isPaymentTransaction ? 'Payment Transaction' : 'Manual Entry',
        'Payment Method': entry.paymentMethod || '-',
        Notes: entry.notes || '-'
      }))
    );
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger Entries');
    XLSX.writeFile(wb, `${ledger?.name}_entries_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const printEntriesPDF = () => {
    const filteredEntries = getFilteredEntries();
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(20);
    doc.text('Ledger Invoice', 14, 22);
    doc.setFontSize(12);
    doc.text(`Ledger: ${ledger?.name || 'N/A'}`, 14, 35);
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 45);
    
    const tableData = filteredEntries.map(entry => [
      format(new Date(entry.date), 'dd/MM/yyyy'),
      entry.description,
      entry.category,
      entry.entryType,
      `₹${entry.amount.toLocaleString()}`,
      entry.transactionId,
      entry.isPaymentTransaction ? 'Payment' : 'Manual'
    ]);

    autoTable(doc, {
      head: [['Date', 'Description', 'Category', 'Type', 'Amount', 'Transaction ID', 'Source']],
      body: tableData,
      startY: 55,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] }
    });

    doc.save(`${ledger?.name}_ledger_invoice_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const printReceiptPDF = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTimeout(() => {
      handlePrintReceipt();
    }, 100);
  };

  const handlePrintEntries = useReactToPrint({
    contentRef: printRef,
  });
  
  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptPrintRef,
  });

  const getLedgerTypeIcon = (type: string) => {
    switch (type) {
      case 'customer': return <User className="h-4 w-4" />;
      case 'supplier': return <Building2 className="h-4 w-4" />;
      case 'expense': return <TrendingDown className="h-4 w-4" />;
      case 'income': return <TrendingUp className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getEntryTypeIcon = (type: string, isPayment?: boolean) => {
    if (isPayment) return <CreditCard className="h-4 w-4" />;
    return type === 'debit' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getTransactionStatusIcon = (type: string) => {
    switch (type) {
      case 'payment_received': return <CheckCircle className="h-4 w-4" />;
      case 'payment_made': return <AlertTriangle className="h-4 w-4" />;
      case 'adjustment': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ledger) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="text-center p-8 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent>
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Ledger Not Found</h2>
            <p className="text-slate-600 mb-6">The requested ledger account could not be found.</p>
            <Button onClick={() => navigate('/ledger')} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ledgers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/ledger')}
            className="gap-2 hover:bg-slate-50 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              {ledger.name}
            </h1>
            <p className="text-slate-600">Ledger ID: {ledger.ledgerId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant={ledger.status === 'active' ? 'default' : 'secondary'}
            className={cn(
              "flex items-center gap-1 px-3 py-1",
              ledger.status === 'active' 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-slate-100 text-slate-800 border-slate-200"
            )}
          >
            {ledger.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {ledger.status}
          </Badge>
          {getLedgerTypeIcon(ledger.ledgerType)}
          <span className="text-sm text-slate-600 capitalize">{ledger.ledgerType}</span>
        </div>
      </div>

      {/* Ledger Info Card */}
      <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Ledger Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Phone</p>
                <p className="font-medium">{ledger.contactInfo.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-green-50 rounded-lg">
                <Mail className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Email</p>
                <p className="font-medium">{ledger.contactInfo.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-purple-50 rounded-lg">
                <MapPin className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Address</p>
                <p className="font-medium">{ledger.contactInfo.address || 'N/A'}</p>
              </div>
            </div>
            {ledger.upiId && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Wallet className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">UPI ID</p>
                  <p className="font-medium">{ledger.upiId}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <FileText className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Type</p>
                <p className="font-medium capitalize">{ledger.ledgerType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-teal-50 rounded-lg">
                <Calendar className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Created</p>
                <p className="font-medium">{format(new Date(ledger.createdAt), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-sm border-0 shadow-sm">
          <TabsTrigger 
            value="dashboard" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
          >
            <Activity className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="entries" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
          >
            <FileText className="h-4 w-4 mr-2" />
            Ledger Entries
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Payments & Transactions
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={cn(
                      "text-3xl font-bold",
                      dashboardData.balance >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ₹{dashboardData.balance.toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {dashboardData.balance >= 0 ? 'Credit Balance' : 'Debit Balance'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
                    <div className="p-2 bg-red-50 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      ₹{dashboardData.totalDebits.toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Outgoing amounts</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      ₹{dashboardData.totalCredits.toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Incoming amounts</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payments Received</CardTitle>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Receipt className="h-4 w-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      ₹{dashboardData.totalPaymentsReceived.toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Verified payments</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Recent Entries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.recentEntries.length > 0 ? (
                      <div className="space-y-3">
                        {dashboardData.recentEntries.map((entry) => (
                          <div key={entry._id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                entry.entryType === 'debit' ? "bg-red-50" : "bg-green-50"
                              )}>
                                {getEntryTypeIcon(entry.entryType, entry.isPaymentTransaction)}
                              </div>
                              <div>
                                <p className="font-medium">{entry.description}</p>
                                <p className="text-sm text-slate-500">
                                  {format(new Date(entry.date), 'MMM dd, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={cn(
                                "text-lg font-bold",
                                entry.entryType === 'debit' ? "text-red-600" : "text-green-600"
                              )}>
                                {entry.entryType === 'debit' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                              </div>
                              {entry.isPaymentTransaction && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Payment
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent entries</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      Recent Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.recentTransactions.length > 0 ? (
                      <div className="space-y-3">
                        {dashboardData.recentTransactions.map((transaction) => (
                          <div key={transaction._id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                transaction.transactionType === 'payment_received' ? "bg-green-50" : "bg-red-50"
                              )}>
                                {getTransactionStatusIcon(transaction.transactionType)}
                              </div>
                              <div>
                                <p className="font-medium capitalize">
                                  {transaction.transactionType.replace('_', ' ')}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={cn(
                                "text-lg font-bold",
                                transaction.transactionType === 'payment_received' ? "text-green-600" : "text-red-600"
                              )}>
                                {transaction.transactionType === 'payment_received' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                              </div>
                              <Badge variant="outline" className="text-xs mt-1 capitalize">
                                {transaction.paymentMethod}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent transactions</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Entries Tab */}
        <TabsContent value="entries" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Ledger Entries</h3>
              <p className="text-slate-600 flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4" />
                Shows all ledger entries and payment transactions in chronological order
              </p>
            </div>
            <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Add Ledger Entry
                  </DialogTitle>
                  <DialogDescription>
                    Add a new entry to the ledger account
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="entryType">Entry Type</Label>
                      <Select 
                        value={entryForm.entryType} 
                        onValueChange={(value: 'debit' | 'credit') => 
                          setEntryForm({...entryForm, entryType: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debit">Debit</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        type="number"
                        value={entryForm.amount}
                        onChange={(e) => setEntryForm({...entryForm, amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      value={entryForm.description}
                      onChange={(e) => setEntryForm({...entryForm, description: e.target.value})}
                      placeholder="Entry description"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={entryForm.category} 
                        onValueChange={(value: any) => 
                          setEntryForm({...entryForm, category: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="purchase">Purchase</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="loan">Loan</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="transactionId">Transaction ID</Label>
                      <Input
                        value={entryForm.transactionId}
                        onChange={(e) => setEntryForm({...entryForm, transactionId: e.target.value})}
                        placeholder="Leave empty for auto-generation"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Input
                      value={entryForm.paymentMethod}
                      onChange={(e) => setEntryForm({...entryForm, paymentMethod: e.target.value})}
                      placeholder="e.g., Bank Transfer, Cash"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      value={entryForm.notes}
                      onChange={(e) => setEntryForm({...entryForm, notes: e.target.value})}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddEntryOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddEntry} className="bg-blue-600 hover:bg-blue-700">
                    Add Entry
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filter and Export Toolbar */}
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search entries..."
                      value={entrySearchTerm}
                      onChange={(e) => setEntrySearchTerm(e.target.value)}
                      className="pl-10 w-64 bg-white"
                    />
                  </div>
                  
                  {/* Type Filter */}
                  <Select value={entryFilter} onValueChange={setEntryFilter}>
                    <SelectTrigger className="w-48 bg-white">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="payment">Payment Transactions</SelectItem>
                      <SelectItem value="manual">Manual Entries</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Date Filter */}
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-32 bg-white">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Clear Filters */}
                  {(entrySearchTerm || entryFilter !== 'all' || dateFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEntrySearchTerm('');
                        setEntryFilter('all');
                        setDateFilter('all');
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
                
                {/* Export Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportToExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={printEntriesPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF Invoice
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrintEntries}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category/Source</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredEntries().map((entry) => (
                      <TableRow 
                        key={entry._id}
                        className={cn(
                          "hover:bg-slate-50 transition-colors duration-150",
                          entry.isPaymentTransaction && "bg-blue-50/50 hover:bg-blue-100/50"
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              entry.entryType === 'debit' ? "bg-red-500" : "bg-green-500"
                            )} />
                            <div>
                              <div className="font-medium">
                                {format(new Date(entry.date), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-xs text-slate-500">
                                {format(new Date(entry.date), 'HH:mm')}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{entry.description}</span>
                            {entry.isPaymentTransaction && (
                              <div className="flex items-center gap-1 mt-1">
                                <CreditCard className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-blue-600 font-medium">
                                  Payment Transaction
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <Badge variant="outline" className="w-fit capitalize mb-1">
                              {entry.category}
                            </Badge>
                            {entry.isPaymentTransaction && entry.paymentMethod && (
                              <span className="text-xs text-slate-500">
                                via {entry.paymentMethod.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={cn(
                              "flex items-center gap-1 w-fit",
                              entry.entryType === 'debit' 
                                ? "bg-red-100 text-red-800 border-red-200" 
                                : "bg-green-100 text-green-800 border-green-200"
                            )}
                          >
                            {getEntryTypeIcon(entry.entryType, entry.isPaymentTransaction)}
                            {entry.isPaymentTransaction 
                              ? `${entry.entryType} (Payment)` 
                              : entry.entryType
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-bold",
                          entry.entryType === 'debit' ? "text-red-600" : "text-green-600"
                        )}>
                          {entry.entryType === 'debit' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono text-sm">{entry.transactionId || '-'}</span>
                            {entry.razorpayPaymentId && (
                              <div className="flex items-center gap-1 mt-1">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600">
                                  Razorpay Verified
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {!entry.isPaymentTransaction ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditEntry(entry)}
                                  className="hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteEntry(entry._id)}
                                  className="hover:bg-red-50 text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded">
                                Managed in Payments tab
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {entries.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No entries found</h3>
                    <p>Start by adding your first ledger entry</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Payments & Transactions</h3>
              <p className="text-slate-600 flex items-center gap-2 mt-1">
                <CreditCard className="h-4 w-4" />
                Manage payment transactions and financial records
              </p>
            </div>
            <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Add Transaction
                  </DialogTitle>
                  <DialogDescription>
                    Record a payment or transaction
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="transactionType">Transaction Type</Label>
                      <Select 
                        value={transactionForm.transactionType} 
                        onValueChange={(value: any) => 
                          setTransactionForm({...transactionForm, transactionType: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payment_received">Payment Received</SelectItem>
                          <SelectItem value="payment_made">Payment Made</SelectItem>
                          <SelectItem value="adjustment">Adjustment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        type="number"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select 
                        value={transactionForm.paymentMethod} 
                        onValueChange={(value: any) => 
                          setTransactionForm({...transactionForm, paymentMethod: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="online">Online (Razorpay)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="transactionId">Transaction ID</Label>
                      <Input
                        value={transactionForm.transactionId}
                        onChange={(e) => setTransactionForm({...transactionForm, transactionId: e.target.value})}
                        placeholder={
                          transactionForm.paymentMethod === 'cash' 
                            ? 'Auto-generated for cash transactions' 
                            : transactionForm.paymentMethod === 'upi'
                            ? 'Enter UPI transaction ID'
                            : 'Auto-generated for online payments'
                        }
                        disabled={transactionForm.paymentMethod === 'cash' || transactionForm.paymentMethod === 'online'}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                      placeholder="Transaction description..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddTransactionOpen(false)}
                    disabled={isProcessingPayment}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddTransaction} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? 'Processing...' : 'Add Transaction'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Transaction Filter Toolbar */}
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search transactions..."
                      value={transactionSearchTerm}
                      onChange={(e) => setTransactionSearchTerm(e.target.value)}
                      className="pl-10 w-64 bg-white"
                    />
                  </div>
                  
                  {/* Type Filter */}
                  <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                    <SelectTrigger className="w-48 bg-white">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="payment_received">Payment Received</SelectItem>
                      <SelectItem value="payment_made">Payment Made</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Clear Filters */}
                  {(transactionSearchTerm || transactionFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTransactionSearchTerm('');
                        setTransactionFilter('all');
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredTransactions().map((transaction) => (
                      <TableRow key={transaction._id} className="hover:bg-slate-50 transition-colors duration-150">
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {format(new Date(transaction.date), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-slate-500">
                              {format(new Date(transaction.date), 'HH:mm')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={cn(
                              "flex items-center gap-1 w-fit",
                              transaction.transactionType === 'payment_received' 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : "bg-red-100 text-red-800 border-red-200"
                            )}
                          >
                            {getTransactionStatusIcon(transaction.transactionType)}
                            <span className="capitalize">
                              {transaction.transactionType.replace('_', ' ')}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "p-1.5 rounded-lg",
                              transaction.paymentMethod === 'cash' ? "bg-green-50" :
                              transaction.paymentMethod === 'upi' ? "bg-blue-50" : "bg-purple-50"
                            )}>
                              {transaction.paymentMethod === 'cash' && <DollarSign className="h-3 w-3 text-green-600" />}
                              {transaction.paymentMethod === 'upi' && <Wallet className="h-3 w-3 text-blue-600" />}
                              {transaction.paymentMethod === 'online' && <CreditCard className="h-3 w-3 text-purple-600" />}
                            </div>
                            <span className="capitalize font-medium">
                              {transaction.paymentMethod.replace('_', ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-bold text-lg",
                          transaction.transactionType === 'payment_received' ? "text-green-600" : "text-red-600"
                        )}>
                          {transaction.transactionType === 'payment_received' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{transaction.transactionId || '-'}</span>
                        </TableCell>
                        <TableCell>{transaction.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printReceiptPDF(transaction)}
                              className="hover:bg-blue-50"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTransaction(transaction._id)}
                              className="hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {transactions.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No transactions found</h3>
                    <p>Record your first payment transaction</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Hidden Print Components - Keep existing print components unchanged */}
      <div ref={printRef} className="hidden print:block print:p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Ledger Invoice</h1>
          <p className="text-lg mt-2">{ledger?.name || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">Generated: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Ledger Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Ledger ID:</strong> {ledger?.ledgerId}
            </div>
            <div>
              <strong>Current Balance:</strong> 
              <span className={cn(
                "font-semibold ml-2",
                ledger && ledger.balance >= 0 ? "text-green-600" : "text-red-600"
              )}>
                ₹{ledger?.balance.toLocaleString()}
              </span>
            </div>
            <div>
              <strong>Phone:</strong> {ledger?.contactInfo.phone || 'N/A'}
            </div>
            <div>
              <strong>Email:</strong> {ledger?.contactInfo.email || 'N/A'}
            </div>
            <div className="col-span-2">
              <strong>Address:</strong> {ledger?.contactInfo.address || 'N/A'}
            </div>
          </div>
        </div>

        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Date</th>
              <th className="border border-gray-300 p-2">Description</th>
              <th className="border border-gray-300 p-2">Category</th>
              <th className="border border-gray-300 p-2">Type</th>
              <th className="border border-gray-300 p-2">Amount</th>
              <th className="border border-gray-300 p-2">Transaction ID</th>
              <th className="border border-gray-300 p-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredEntries().map((entry) => (
              <tr key={entry._id}>
                <td className="border border-gray-300 p-2">
                  {format(new Date(entry.date), 'dd/MM/yyyy')}
                </td>
                <td className="border border-gray-300 p-2">{entry.description}</td>
                <td className="border border-gray-300 p-2 capitalize">{entry.category}</td>
                <td className="border border-gray-300 p-2 capitalize">{entry.entryType}</td>
                <td className={cn(
                  "border border-gray-300 p-2 text-right font-semibold",
                  entry.entryType === 'debit' ? "text-red-600" : "text-green-600"
                )}>
                  {entry.entryType === 'debit' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                </td>
                <td className="border border-gray-300 p-2">{entry.transactionId}</td>
                <td className="border border-gray-300 p-2">
                  {entry.isPaymentTransaction ? 'Payment Transaction' : 'Manual Entry'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>This document was generated on {format(new Date(), 'dd MMMM yyyy')} at {format(new Date(), 'HH:mm')}</p>
        </div>
      </div>
      
      {/* Hidden Receipt Print Component */}
      <div ref={receiptPrintRef} className="hidden print:block print:p-8">
        {selectedTransaction && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold">Payment Receipt</h1>
              <p className="text-lg mt-2">{ledger?.name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">
                Receipt Date: {format(new Date(), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
            
            <div className="border-2 border-gray-300 p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Transaction ID:</span>
                  <span>{selectedTransaction.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date:</span>
                  <span>{format(new Date(selectedTransaction.date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Description:</span>
                  <span>{selectedTransaction.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Category:</span>
                  <span className="capitalize">{selectedTransaction.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Payment Method:</span>
                  <span className="capitalize">{selectedTransaction.paymentMethod}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Amount:</span>
                    <span className="text-green-600">₹{selectedTransaction.amount.toLocaleString()}</span>
                  </div>
                </div>
                {selectedTransaction.razorpayPaymentId && (
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Razorpay ID:</span>
                    <span>{selectedTransaction.razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">Thank you for your payment!</p>
              <p className="text-xs text-muted-foreground mt-2">
                This is a system generated receipt.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerAccount;
