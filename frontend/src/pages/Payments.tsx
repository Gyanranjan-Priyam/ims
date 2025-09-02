import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  CheckCircle,
  Clock,
  XCircle,
  Banknote,
  CreditCard,
  Wallet,
  FileText,
  Receipt,
  DollarSign,
  RotateCcw,
  TrendingUp,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileBarChart,
  Search,
  Calendar as CalendarIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '../components/ui/dropdown-menu';
import { RefreshCw } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '../components/ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '../components/ui/alert-dialog';
import { MoreHorizontal, Eye, Printer, Trash2 } from 'lucide-react';

// Generate Receipt using React component in new window
const generateReceipt = (payment: any) => {
  try {
    // Validate payment data
    if (!payment) {
      alert('No payment data available to generate receipt');
      return;
    }

    // Store payment data in localStorage for the receipt component
    localStorage.setItem('payment_receipt', JSON.stringify(payment));
    
    // Open receipt in new window/tab
    const receiptWindow = window.open('/payment-receipt', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (!receiptWindow) {
      alert('Please allow popups to print receipts');
      return;
    }
    
    // Optional: Remove data from localStorage after some time
    setTimeout(() => {
      localStorage.removeItem('payment_receipt');
    }, 30000); // 30 seconds
    
  } catch (error) {
    console.error('Error generating receipt:', error);
    alert('Error generating receipt. Please try again.');
  }
};

// Generate Invoice using print-ready HTML
const generateInvoice = async (payment: any) => {
  try {
    // Validate payment data
    if (!payment) {
      alert('No payment data available to generate invoice');
      return;
    }
    
    // Fetch all sales for this transaction/invoice to get multiple items
    let invoiceItems = [];
    let totalDiscount = 0;
    let subtotalBeforeDiscount = 0;
    
    try {
      // If payment has transactionId or invoice, fetch all sales with same transactionId/invoice
      if (payment.transactionId || payment.invoice) {
        const salesResponse = await api.get('/sales');
        const allSales = salesResponse.data || [];
        
        // Filter sales by same transactionId or invoice
        const relatedSales = allSales.filter((sale: any) => 
          (payment.transactionId && sale.transactionId === payment.transactionId) ||
          (payment.invoice && sale.invoice === payment.invoice)
        );
        
        if (relatedSales.length > 0) {
          invoiceItems = relatedSales.map((sale: any, index: number) => {
            const itemSubtotal = sale.total || sale.finalAmount || 0;
            const itemDiscount = sale.discount || 0;
            const originalPrice = sale.product?.sellingPrice || sale.product?.price || 0;
            const originalAmount = originalPrice * (sale.quantity || 1);
            
            subtotalBeforeDiscount += originalAmount;
            totalDiscount += (originalAmount * itemDiscount / 100);
            
            return {
              id: index + 1,
              description: sale.product?.name || sale.productName || "Product",
              price: originalPrice,
              quantity: sale.quantity || 1,
              subtotal: itemSubtotal,
              discount: itemDiscount,
              originalAmount: originalAmount
            };
          });
        }
      }
      
      // If no related sales found, check if payment has direct sale reference
      if (invoiceItems.length === 0 && payment.sale) {
        const itemDiscount = payment.sale.discount || 0;
        const originalPrice = payment.sale.product?.price || payment.amount;
        const originalAmount = originalPrice * (payment.sale.quantity || 1);
        
        subtotalBeforeDiscount = originalAmount;
        totalDiscount = (originalAmount * itemDiscount / 100);
        
        invoiceItems = [{
          id: 1,
          description: payment.sale.product?.name || payment.description || "Payment Transaction",
          price: originalPrice,
          quantity: payment.sale.quantity || 1,
          subtotal: payment.amount || 0,
          discount: itemDiscount,
          originalAmount: originalAmount
        }];
      }
      
      // Fallback to single payment item if no sales data found
      if (invoiceItems.length === 0) {
        subtotalBeforeDiscount = payment.amount || 0;
        totalDiscount = 0;
        
        invoiceItems = [{
          id: 1,
          description: payment.description || "Payment Transaction",
          price: payment.amount || 0,
          quantity: 1,
          subtotal: payment.amount || 0,
          discount: 0,
          originalAmount: payment.amount || 0
        }];
      }
    } catch (error) {
      console.error('Error fetching sales data for invoice:', error);
      // Fallback to single item
      invoiceItems = [{
        id: 1,
        description: payment.sale?.product?.name || payment.description || "Payment Transaction",
        price: payment.amount || 0,
        quantity: payment.sale?.quantity || 1,
        subtotal: payment.amount || 0,
        discount: payment.sale?.discount || 0,
        originalAmount: payment.amount || 0
      }];
      subtotalBeforeDiscount = payment.amount || 0;
      totalDiscount = 0;
    }
    
    // Transform payment data to invoice format
    const invoiceData = {
      invoiceNumber: payment.invoiceNumber || payment.reference || payment.transactionId || `INV-${Date.now()}`,
      date: payment.date ? format(new Date(payment.date), 'MMMM dd, yyyy') : format(new Date(), 'MMMM dd, yyyy'),
      supplier: {
        name: "SmartPOS IMS",
        number: "IMS123456789",
        address: ["123 Business Street", "Commercial District", "Business City, 12345", "India"]
      },
      customer: {
        name: payment.customerName || payment.sale?.customer || "Walk-in Customer",
        mobile: payment.customerPhone || payment.phone || "N/A",
        address: ["Customer Address", "City, State", "Country"]
      },
      items: invoiceItems,
      pricing: {
        subtotal: subtotalBeforeDiscount,
        discount: totalDiscount,
        discountPercentage: subtotalBeforeDiscount > 0 ? (totalDiscount / subtotalBeforeDiscount) * 100 : 0,
        finalTotal: subtotalBeforeDiscount - totalDiscount
      },
      transactionDetails: {
        transactionId: payment.transactionId || payment.reference || "N/A",
        paymentMode: (payment.paymentMode || 'cash').toUpperCase(),
        status: (payment.status || 'completed').toUpperCase(),
        processedAt: payment.date ? format(new Date(payment.date), 'MMMM dd, yyyy HH:mm') : format(new Date(), 'MMMM dd, yyyy HH:mm')
      },
      notes: `Payment processed via ${(payment.paymentMode || 'cash').toUpperCase()}. Transaction ID: ${payment.transactionId || 'N/A'}. Payment Type: ${(payment.paymentType || 'general').toUpperCase()}.${totalDiscount > 0 ? ` Discount Applied: ${((totalDiscount / subtotalBeforeDiscount) * 100).toFixed(1)}%` : ''}`
    };

    // Store invoice data in localStorage for Invoice component
    localStorage.setItem('invoice_payment', JSON.stringify(invoiceData));

    // Open the Invoice component route in a new window
    const invoiceWindow = window.open('/invoice', '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
    if (!invoiceWindow) {
      alert('Invoice popup was blocked. Please allow popups for this site and try again.');
      return;
    }

    // Optional: Remove data from localStorage after some time
    setTimeout(() => {
      localStorage.removeItem('invoice_payment');
    }, 60000); // 1 minute

  } catch (error) {
    console.error('Error generating invoice:', error);
    alert('Error generating invoice. Please try again.');
  }
};
interface PaymentStats {
  totalAmount: number;
  totalTransactions: number;
  todayAmount: number;
  todayTransactions: number;
  cashAmount: number;
  onlineAmount: number;
  bankTransferAmount: number;
  chequeAmount: number;
  pendingAmount: number;
  completedAmount: number;
  salesAmount: number;
  ledgerAmount: number;
  expenseAmount: number;
  refundAmount: number;
}

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<any>('');
  const [statusFilter, setStatusFilter] = useState<any>('all');
  const [methodFilter, setMethodFilter] = useState<any>('all');
  const [typeFilter, setTypeFilter] = useState<any>('all');
  const [sourceFilter, setSourceFilter] = useState<any>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>();
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [, setPaymentStatus] = useState<{
    status: string;
    canRefund: boolean;
    amountRefunded: number;
  } | null>(null);
  const [, setIsCheckingStatus] = useState(false);
  const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' }>({
    field: 'date',
    order: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState<PaymentStats>({
    totalAmount: 0,
    totalTransactions: 0,
    todayAmount: 0,
    todayTransactions: 0,
    cashAmount: 0,
    onlineAmount: 0,
    bankTransferAmount: 0,
    chequeAmount: 0,
    pendingAmount: 0,
    completedAmount: 0,
    salesAmount: 0,
    ledgerAmount: 0,
    expenseAmount: 0,
    refundAmount: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      // Fetch payments from multiple sources
      const [salesResponse, paymentsResponse, ledgerTransactionsResponse] = await Promise.all([
        api.get('/sales'),
        api.get('/payments').catch(() => ({ data: [] })), // Fallback if payments endpoint doesn't exist
        api.get('/ledger/transactions/all').catch((error) => {
          console.error('Error fetching ledger transactions:', error);
          return { data: [] };
        }) // Fetch all ledger transactions
      ]);

      const allPayments: any[] = [];
      const seenTransactionIds = new Set<string>(); // To prevent duplicates

      // Transform sales data to payment format
      const salesData = salesResponse.data;
      const salesPayments = salesData
        .filter((sale: any) => sale.paymentStatus === 'completed') // Only completed sales
        .map((sale: any) => {
          const txnId = sale.transactionId || `TXN-${sale._id}`;
          
          // Skip if already seen
          if (seenTransactionIds.has(txnId)) return null;
          seenTransactionIds.add(txnId);

          return {
            _id: sale._id,
            sale: sale,
            amount: sale.finalAmount || sale.total,
            paymentMode: sale.paymentMode || 'cash',
            transactionId: txnId,
            status: sale.paymentStatus || 'completed',
            date: sale.date || sale.createdAt,
            description: `Payment for ${sale.product.name}`,
            customerName: sale.customer,
            customerPhone: sale.customerPhone || 'N/A',
            paymentType: 'sale' as const,
            source: sale.createdBy === 'admin' ? 'admin' as const : 'salesperson' as const,
            reference: sale.invoice,
            category: 'sales'
          };
        })
        .filter((payment: any) => payment !== null) as any[];

      allPayments.push(...salesPayments);

      // Add ledger transactions (entries and payment history)
      if (ledgerTransactionsResponse.data && Array.isArray(ledgerTransactionsResponse.data)) {
        const ledgerPayments = ledgerTransactionsResponse.data
          .map((ledgerTxn: any) => {
            const txnId = ledgerTxn.transactionId || `LED-${ledgerTxn._id}`;
            
            // Skip if already seen
            if (seenTransactionIds.has(txnId)) return null;
            seenTransactionIds.add(txnId);

            return {
              _id: ledgerTxn._id,
              amount: ledgerTxn.amount || 0,
              paymentMode: ledgerTxn.paymentMethod || 'cash',
              transactionId: txnId,
              status: ledgerTxn.status || 'completed',
              date: ledgerTxn.date || ledgerTxn.createdAt,
              description: ledgerTxn.description || 'Ledger payment received',
              customerName: ledgerTxn.customerName || 'N/A',
              customerPhone: ledgerTxn.customerPhone || 'N/A',
              paymentType: 'ledger' as const,
              source: ledgerTxn.source === 'salesperson' ? 'salesperson' as const : 'admin' as const,
              reference: ledgerTxn.invoiceNumber || ledgerTxn.reference || ledgerTxn.transactionId,
              category: 'ledger',
              invoiceNumber: ledgerTxn.invoiceNumber, // Add invoice number from backend
              entryType: ledgerTxn.entryType // Add entry type for reference
            };
          })
          .filter((payment: any) => payment !== null) as any[];

        allPayments.push(...ledgerPayments);
      }

      // Add direct payments if they exist
      if (paymentsResponse.data && Array.isArray(paymentsResponse.data)) {
        const directPayments = paymentsResponse.data
          .map((payment: any) => {
            const txnId = payment.transactionId || payment.id || `PAY-${payment._id}`;
            
            // Skip if already seen
            if (seenTransactionIds.has(txnId)) return null;
            seenTransactionIds.add(txnId);

            return {
              _id: payment._id,
              amount: payment.amount,
              paymentMode: payment.paymentMode || payment.paymentMethod || 'cash',
              transactionId: txnId,
              status: payment.status || 'completed',
              date: payment.date || payment.createdAt,
              description: payment.description || payment.notes || 'General payment',
              customerName: payment.customer || payment.customerName || 'N/A',
              customerPhone: payment.customerPhone || payment.phone || 'N/A',
              paymentType: payment.type || 'general' as const,
              source: payment.source || payment.createdBy || 'admin' as const,
              reference: payment.reference || payment.invoiceNumber,
              category: payment.category || 'general'
            };
          })
          .filter((payment: any) => payment !== null) as any[];

        allPayments.push(...directPayments);
      }

      // Sort by date (newest first)
      allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setPayments(allPayments);
      calculateStats(allPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (paymentData: any[]) => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const newStats = paymentData.reduce((acc, payment) => {
      const paymentDate = new Date(payment.date);
      const isToday = paymentDate >= todayStart;
      
      acc.totalAmount += payment.amount;
      acc.totalTransactions += 1;
      
      if (isToday) {
        acc.todayAmount += payment.amount;
        acc.todayTransactions += 1;
      }
      
      // Payment method breakdown
      switch (payment.paymentMode) {
        case 'cash':
          acc.cashAmount += payment.amount;
          break;
        case 'online':
          acc.onlineAmount += payment.amount;
          break;
        case 'bank_transfer':
          acc.bankTransferAmount += payment.amount;
          break;
        case 'cheque':
          acc.chequeAmount += payment.amount;
          break;
        default:
          acc.onlineAmount += payment.amount; // Default to online
      }
      
      // Status breakdown
      if (payment.status === 'pending') {
        acc.pendingAmount += payment.amount;
      } else if (payment.status === 'completed') {
        acc.completedAmount += payment.amount;
      }
      
      // Payment type breakdown
      switch (payment.paymentType) {
        case 'sale':
          acc.salesAmount += payment.amount;
          break;
        case 'ledger':
          acc.ledgerAmount += payment.amount;
          break;
        case 'expense':
          acc.expenseAmount += payment.amount;
          break;
        case 'refund':
          acc.refundAmount += payment.amount;
          break;
        default:
          acc.salesAmount += payment.amount; // Default to sales
      }
      
      return acc;
    }, {
      totalAmount: 0,
      totalTransactions: 0,
      todayAmount: 0,
      todayTransactions: 0,
      cashAmount: 0,
      onlineAmount: 0,
      bankTransferAmount: 0,
      chequeAmount: 0,
      pendingAmount: 0,
      completedAmount: 0,
      salesAmount: 0,
      ledgerAmount: 0,
      expenseAmount: 0,
      refundAmount: 0
    });
    
    setStats(newStats);
  };

  // Filter and sort payments
  const filteredAndSortedPayments = payments
    .filter(payment => {
      const matchesFilter = 
        payment.sale?.invoice.toLowerCase().includes(filter.toLowerCase()) ||
        payment.customerName?.toLowerCase().includes(filter.toLowerCase()) ||
        payment.transactionId.toLowerCase().includes(filter.toLowerCase()) ||
        payment.sale?.product.name.toLowerCase().includes(filter.toLowerCase()) ||
        payment.description?.toLowerCase().includes(filter.toLowerCase()) ||
        payment.reference?.toLowerCase().includes(filter.toLowerCase()) ||
        payment.invoiceNumber?.toLowerCase().includes(filter.toLowerCase()); // Add invoice number to search
      
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesMethod = methodFilter === 'all' || payment.paymentMode === methodFilter;
      const matchesType = typeFilter === 'all' || payment.paymentType === typeFilter;
      const matchesSource = sourceFilter === 'all' || payment.source === sourceFilter;
      
      const matchesDateRange = 
        !dateRange?.from || 
        !dateRange?.to || 
        (new Date(payment.date) >= dateRange.from && new Date(payment.date) <= dateRange.to);
      
      return matchesFilter && matchesStatus && matchesMethod && matchesType && matchesSource && matchesDateRange;
    })
    .sort((a, b) => {
      const aValue = a[sortBy.field as keyof any] || '';
      const bValue = b[sortBy.field as keyof any] || '';
      
      if (sortBy.field === 'date') {
        const aDate = new Date(a.date).getTime();
        const bDate = new Date(b.date).getTime();
        return sortBy.order === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      if (sortBy.field === 'amount') {
        return sortBy.order === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortBy.order === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPayments.length / itemsPerPage);
  const paginatedPayments = filteredAndSortedPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    // Handle undefined or null status
    if (!status) {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          UNKNOWN
        </Badge>
      );
    }

    const variants = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    
    const icons = {
      completed: CheckCircle,
      pending: Clock,
      failed: XCircle,
      refunded: RotateCcw
    };
    
    const Icon = icons[status as keyof typeof icons] || Clock;
    
    return (
      <Badge className={cn('border flex items-center gap-1', variants[status as keyof typeof variants])}>
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    // Handle undefined or null method
    if (!method) {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          UNKNOWN
        </Badge>
      );
    }

    const variants = {
      cash: 'bg-green-100 text-green-800 border-green-200',
      online: 'bg-blue-100 text-blue-800 border-blue-200',
      bank_transfer: 'bg-purple-100 text-purple-800 border-purple-200',
      cheque: 'bg-orange-100 text-orange-800 border-orange-200',
      credit: 'bg-red-100 text-red-800 border-red-200',
      debit: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    const icons = {
      cash: Banknote,
      online: CreditCard,
      bank_transfer: Wallet,
      cheque: FileText,
      credit: CreditCard,
      debit: CreditCard
    };
    
    const Icon = icons[method as keyof typeof icons] || CreditCard;
    
    return (
      <Badge className={cn('border flex items-center gap-1', variants[method as keyof typeof variants])}>
        <Icon className="h-3 w-3" />
        {method.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getTypeBadge = (type: string, status?: string) => {
    // Handle undefined or null type
    if (!type) {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          UNKNOWN
        </Badge>
      );
    }

    // If payment is refunded, show REFUNDED badge instead of payment type
    if (status === 'refunded') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1">
          <RotateCcw className="h-3 w-3" />
          REFUNDED
        </Badge>
      );
    }

    const variants = {
      sale: 'bg-green-100 text-green-800 border-green-200',
      ledger: 'bg-blue-100 text-blue-800 border-blue-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200',
      refund: 'bg-red-100 text-red-800 border-red-200',
      expense: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    
    const icons = {
      sale: Receipt,
      ledger: FileText,
      general: DollarSign,
      refund: RotateCcw,
      expense: TrendingUp
    };
    
    const Icon = icons[type as keyof typeof icons] || DollarSign;
    
    return (
      <Badge className={cn('border flex items-center gap-1', variants[type as keyof typeof variants])}>
        <Icon className="h-3 w-3" />
        {type.toUpperCase()}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    // Handle undefined or null source
    if (!source) {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
          UNKNOWN
        </Badge>
      );
    }

    const variants = {
      salesperson: 'bg-blue-100 text-blue-800 border-blue-200',
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      system: 'bg-gray-100 text-gray-800 border-gray-200',
      customer: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <Badge className={cn('border text-xs', variants[source as keyof typeof variants])}>
        {source.toUpperCase()}
      </Badge>
    );
  };

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDelete = async (paymentId: string) => {
    try {
      const payment = payments.find(p => p._id === paymentId);
      if (!payment) return;

      // Handle different payment types differently
      if (payment.paymentType === 'sale' && payment.sale) {
        // For sales payments, delete the sale record
        await api.delete(`/sales/${payment.sale._id}`);
      } else if (payment.paymentType === 'ledger') {
        // For ledger payments, delete from ledger
        await api.delete(`/ledger/${payment._id}`);
      } else {
        // For general payments, delete from payments
        await api.delete(`/payments/${payment._id}`);
      }
      
      await fetchPayments(); // Refresh data
      alert('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Error deleting payment. Please try again.');
    }
  };

  // Razorpay Refund Function
  const handleRefund = async () => {
    if (!selectedPayment || selectedPayment.paymentMode !== 'online' || !refundReason.trim()) {
      return;
    }

    try {
      // Extract Razorpay payment ID from transaction ID
      const razorpayPaymentId = selectedPayment.transactionId;
      
      // Call backend to process refund
      const refundResponse = await api.post('/payments/refund', {
        paymentId: razorpayPaymentId,
        amount: selectedPayment.amount * 100, // Amount in paise
        reason: refundReason,
        saleId: selectedPayment.sale?._id
      });

      if (refundResponse.data.success) {
        alert('Refund processed successfully!');
        await fetchPayments(); // Refresh data
        setIsRefundDialogOpen(false);
        setRefundReason('');
        setSelectedPayment(null);
      } else {
        const errorMsg = refundResponse.data.error || 'Unknown error occurred';
        if (refundResponse.data.paymentStatus) {
          alert(`Failed to process refund: ${errorMsg}\n\nPayment Status: ${refundResponse.data.paymentStatus}\n\nNote: Only captured payments can be refunded.`);
        } else if (refundResponse.data.refundedAmount) {
          alert(`Failed to process refund: ${errorMsg}\n\nAlready refunded amount: ₹${refundResponse.data.refundedAmount}`);
        } else {
          alert(`Failed to process refund: ${errorMsg}`);
        }
      }
    } catch (error: any) {
      console.error('Error processing refund:', error);
      
      let errorMessage = 'Failed to process refund';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        
        // Add additional context if available
        if (error.response.data.paymentStatus) {
          errorMessage += `\n\nPayment Status: ${error.response.data.paymentStatus}`;
          errorMessage += '\n\nNote: Only captured payments can be refunded. The payment might be in pending, failed, or another non-captured state.';
        }
        
        if (error.response.data.refundedAmount !== undefined) {
          errorMessage += `\n\nAlready refunded: ₹${error.response.data.refundedAmount}`;
        }
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      alert(errorMessage);
    } finally {
      // Refund processing completed
    }
  };

  // Check Payment Status from Razorpay
  const checkPaymentStatus = async (paymentId: string) => {
    setIsCheckingStatus(true);
    try {
      const response = await api.get(`/payments/status/${paymentId}`);
      if (response.data.success) {
        setPaymentStatus({
          status: response.data.status,
          canRefund: response.data.canRefund,
          amountRefunded: response.data.amountRefunded
        });
        return response.data;
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
    return null;
  };

  // Open refund dialog with status check
  const openRefundDialog = async (payment: any) => {
    setSelectedPayment(payment);
    setRefundReason(''); // Reset refund reason
    
    if (payment.paymentMode === 'online' && payment.transactionId) {
      const status = await checkPaymentStatus(payment.transactionId);
      
      if (status && !status.canRefund) {
        if (status.amountRefunded > 0) {
          alert(`This payment has already been refunded. Refunded amount: ₹${status.amountRefunded}`);
        } else {
          alert(`Cannot refund this payment. Payment status: ${status.status}. Only captured payments can be refunded.`);
        }
        return;
      }
    }
    
    setIsRefundDialogOpen(true);
  };

  // Open receipt dialog
  const openReceiptDialog = (payment: any) => {
    // For now, just use the generateReceipt function which opens in new window
    generateReceipt(payment);
  };

  // Export Functions
  const exportToCSV = () => {
    const headers = [
      'Date',
      'Invoice No',
      'Customer Name',
      'Product',
      'Amount',
      'Payment Mode',
      'Transaction ID',
      'Status',
      'Salesperson'
    ];

    const csvData = filteredAndSortedPayments.map(payment => [
      format(new Date(payment.date), 'yyyy-MM-dd HH:mm:ss'),
      payment.sale?.invoice || 'N/A',
      payment.customerName || payment.sale?.customer || 'N/A',
      payment.sale?.product.name || 'N/A',
      payment.amount,
      payment.paymentMode,
      payment.transactionId,
      payment.status,
      payment.sale?.salesperson.name || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    // Create Excel-compatible CSV with BOM
    const headers = [
      'Date',
      'Invoice No',
      'Customer Name',
      'Product',
      'Amount',
      'Payment Mode',
      'Transaction ID',
      'Status',
      'Salesperson'
    ];

    const csvData = filteredAndSortedPayments.map(payment => [
      format(new Date(payment.date), 'yyyy-MM-dd HH:mm:ss'),
      payment.sale?.invoice || 'N/A',
      payment.customerName || payment.sale?.customer || 'N/A',
      payment.sale?.product.name || 'N/A',
      payment.amount,
      payment.paymentMode,
      payment.transactionId,
      payment.status,
      payment.sale?.salesperson.name || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePaymentReport = () => {
    const reportContent = `
PAYMENT REPORT
Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
===============================================

SUMMARY STATISTICS:
- Total Transactions: ${stats.totalTransactions}
- Total Amount: ₹${stats.totalAmount.toLocaleString()}
- Today's Transactions: ${stats.todayTransactions}
- Today's Amount: ₹${stats.todayAmount.toLocaleString()}
- Cash Payments: ₹${stats.cashAmount.toLocaleString()}
- Online Payments: ₹${stats.onlineAmount.toLocaleString()}
- Pending Amount: ₹${stats.pendingAmount.toLocaleString()}
- Completed Amount: ₹${stats.completedAmount.toLocaleString()}

PAYMENT BREAKDOWN BY METHOD:
- Cash: ${payments.filter(p => p.paymentMode === 'cash').length} transactions (₹${stats.cashAmount.toLocaleString()})
- Online: ${payments.filter(p => p.paymentMode === 'online').length} transactions (₹${stats.onlineAmount.toLocaleString()})

PAYMENT BREAKDOWN BY STATUS:
- Completed: ${payments.filter(p => p.status === 'completed').length} transactions (₹${stats.completedAmount.toLocaleString()})
- Pending: ${payments.filter(p => p.status === 'pending').length} transactions (₹${stats.pendingAmount.toLocaleString()})
- Failed: ${payments.filter(p => p.status === 'failed').length} transactions

DETAILED TRANSACTIONS:
===============================================
${filteredAndSortedPayments.map(payment => `
Date: ${format(new Date(payment.date), 'dd/MM/yyyy HH:mm')}
Invoice: ${payment.sale?.invoice || 'N/A'}
Customer: ${payment.customerName || payment.sale?.customer || 'N/A'}
Product: ${payment.sale?.product.name || 'N/A'}
Amount: ₹${payment.amount.toLocaleString()}
Mode: ${payment.paymentMode.toUpperCase()}
Transaction ID: ${payment.transactionId}
Status: ${payment.status.toUpperCase()}
Salesperson: ${payment.sale?.salesperson.name || 'N/A'}
---
`).join('')}

===============================================
End of Report
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_report_${format(new Date(), 'yyyy-MM-dd')}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="hover:bg-slate-100 transition-colors duration-200"
    >
      {children}
      {sortBy.field === field ? (
        sortBy.order === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
      )}
    </Button>
  );

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
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

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Payment Management
          </h1>
          <p className="text-slate-600">Track and manage your payment transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchPayments}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportToCSV} className="gap-2">
                <FileText className="h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generatePaymentReport} className="gap-2">
                <FileBarChart className="h-4 w-4" />
                Payment Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Today's Collection */}
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              Today's Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-green-600">₹{stats.todayAmount.toLocaleString()}</p>
              <p className="text-sm text-slate-600">{stats.todayTransactions} transactions</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Collection */}
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Total Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-blue-600">₹{stats.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-slate-600">{stats.totalTransactions} transactions</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Summary */}
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-purple-600" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Cash:</span>
                <span className="font-semibold text-xs">₹{stats.cashAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Online:</span>
                <span className="font-semibold text-xs">₹{stats.onlineAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Bank Transfer:</span>
                <span className="font-semibold text-xs">₹{stats.bankTransferAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Cheque:</span>
                <span className="font-semibold text-xs">₹{stats.chequeAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Types Summary */}
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5 text-orange-600" />
              Payment Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Sales:</span>
                <span className="font-semibold text-xs text-green-600">₹{stats.salesAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Ledger:</span>
                <span className="font-semibold text-xs text-blue-600">₹{stats.ledgerAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Expenses:</span>
                <span className="font-semibold text-xs text-red-600">₹{stats.expenseAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Refunds:</span>
                <span className="font-semibold text-xs text-yellow-600">₹{stats.refundAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Status Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Completed:</span>
                <span className="font-semibold text-green-600">₹{stats.completedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Pending:</span>
                <span className="font-semibold text-yellow-600">₹{stats.pendingAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search payments, invoices, customers..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 bg-white border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Method Filter */}
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">Sales</SelectItem>
                <SelectItem value="ledger">Ledger</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            {/* Source Filter */}
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="salesperson">Salesperson</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 bg-white">
                  <CalendarIcon className="h-4 w-4" />
                  Date Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange as any}
                  onSelect={setDateRange as any}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Payment Transactions
          </CardTitle>
          <CardDescription>
            Showing {paginatedPayments.length} of {filteredAndSortedPayments.length} payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>
                    <SortButton field="date">Date</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="sale.invoice">Invoice No</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="customerName">Customer</SortButton>
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>
                    <SortButton field="amount">Amount</SortButton>
                  </TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Invoice/Transaction ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-slate-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">No payments found</p>
                      <p className="text-sm">Try adjusting your search filters</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPayments.map((payment, index) => (
                    <TableRow 
                      key={payment._id}
                      className="hover:bg-slate-50 transition-colors duration-150"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium">
                        {format(new Date(payment.date), 'MMM dd, yyyy')}
                        <div className="text-xs text-slate-500">
                          {format(new Date(payment.date), 'HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.sale?.invoice || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.customerName || payment.sale?.customer || 'Walk-in Customer'}</div>
                          <div className="text-xs text-slate-500">{payment.customerPhone || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.sale?.product.name || 'N/A'}</div>
                          <div className="text-xs text-slate-500">{payment.sale?.product.sku || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">₹{payment.amount.toLocaleString()}</div>
                        {payment.sale?.quantity && (
                          <div className="text-xs text-slate-500">
                            Qty: {payment.sale.quantity}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getMethodBadge(payment.paymentMode)}
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(payment.paymentType, payment.status)}
                      </TableCell>
                      <TableCell>
                        {getSourceBadge(payment.source)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.paymentType === 'ledger' && payment.invoiceNumber ? (
                          <div>
                            <div className="font-semibold text-blue-600">{payment.invoiceNumber}</div>
                            <div className="text-xs text-slate-500">{payment.transactionId}</div>
                          </div>
                        ) : (
                          payment.transactionId
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedPayment(payment);
                              setIsDetailsDialogOpen(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => generateInvoice(payment)}>
                              <Receipt className="mr-2 h-4 w-4" />
                              Generate Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => generateReceipt(payment)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Print Receipt (New Window)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openReceiptDialog(payment)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Receipt
                            </DropdownMenuItem>
                            {payment.paymentMode === 'online' && payment.status === 'completed' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => openRefundDialog(payment)}
                                  className="text-orange-600"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Process Refund
                                </DropdownMenuItem>
                              </>
                            )}
                            {payment.paymentMode === 'online' && payment.status === 'authorized' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      const res = await api.post('/payments/capture', {
                                        paymentId: payment.transactionId,
                                        amount: payment.amount * 100 // paise
                                      });
                                      if (res.data.success && res.data.status === 'captured') {
                                        alert('Payment captured successfully! You can now refund this payment.');
                                        // Update payment status in UI immediately
                                        setPayments(prev => prev.map(p =>
                                          p.transactionId === payment.transactionId
                                            ? { ...p, status: 'captured' }
                                            : p
                                        ));
                                      } else {
                                        alert('Capture API called, but payment status is still: ' + (res.data.status || 'unknown') + '\nPlease check Razorpay dashboard or try again.');
                                        console.log('Capture response:', res.data.capture);
                                        console.log('Status response:', res.data);
                                      }
                                    } catch (err: any) {
                                      alert('Error capturing payment: ' + (err.response?.data?.error || err.message));
                                    }
                                  }}
                                  className="text-blue-600"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Capture Payment
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Transaction
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Payment Transaction</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this payment transaction? This action cannot be undone.
                                    {payment.paymentType === 'sale' && payment.sale && 
                                      ' This will also delete the associated sale record.'
                                    }
                                    {payment.paymentType === 'ledger' && 
                                      ' This will delete the ledger entry.'
                                    }
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(payment._id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-slate-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedPayments.length)} of {filteredAndSortedPayments.length} payments
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="whitespace-nowrap"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl p-6 rounded-lg border-0 shadow-lg bg-white/90 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Payment Details
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Detailed information about the payment transaction
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <p className="text-lg font-medium">
                {selectedPayment?.date && !isNaN(new Date(selectedPayment.date).getTime())
                  ? format(new Date(selectedPayment.date), 'MMM dd, yyyy')
                  : 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Invoice No</Label>
              <p className="text-lg font-medium">
                {selectedPayment?.sale?.invoice || 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <p className="text-lg font-medium">
                {selectedPayment?.customerName || selectedPayment?.sale?.customer || 'Walk-in Customer'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <p className="text-lg font-medium">
                {selectedPayment?.sale?.product.name || 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <p className="text-lg font-medium text-green-600">
                ₹{selectedPayment?.amount.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <div className="flex items-center gap-2">
                {getMethodBadge(selectedPayment?.paymentMode)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedPayment?.status)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Transaction ID</Label>
              <p className="text-lg font-medium">
                {selectedPayment?.transactionId}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Salesperson</Label>
              <p className="text-lg font-medium">
                {selectedPayment?.sale?.salesperson.name || 'N/A'}
              </p>
            </div>
          </div>

          {/* Notes and Description */}
          <div className="mt-6">
            <Label>Description / Notes</Label>
            <Textarea
              value={selectedPayment?.description || ''}
              readOnly
              className="mt-2 resize-none h-24 bg-slate-50 border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Refund Button (for online payments only) */}
          {selectedPayment?.paymentMode === 'online' && selectedPayment?.status === 'completed' && (
            <div className="mt-4">
              <Button
                onClick={() => openRefundDialog(selectedPayment)}
                className="w-full"
              >
                Process Refund
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="max-w-md p-6 rounded-lg border-0 shadow-lg bg-white/90 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Process Refund
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Issue a refund for the payment transaction
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount</Label>
              <p className="text-lg font-medium text-green-600">
                ₹{selectedPayment?.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <Label>Payment Mode</Label>
              <div className="flex items-center gap-2">
                {getMethodBadge(selectedPayment?.paymentMode)}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedPayment?.status)}
              </div>
            </div>
            <div>
              <Label>Transaction ID</Label>
              <p className="text-lg font-medium">
                {selectedPayment?.transactionId}
              </p>
            </div>
            <div>
              <Label>Refund Reason</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter the reason for refund"
                className="mt-2 resize-none h-24 bg-slate-50 border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              onClick={() => setIsRefundDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              className="bg-red-600 hover:bg-red-700"
            >
              Issue Refund
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
