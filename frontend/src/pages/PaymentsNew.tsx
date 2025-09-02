import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Separator } from '../components/ui/separator';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Search,
  CreditCard,
  TrendingUp,
  DollarSign,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  Printer,
  Receipt,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  Banknote,
  FileText,
  FileSpreadsheet,
  FileBarChart
} from 'lucide-react';

interface Payment {
  _id: string;
  sale?: {
    _id: string;
    invoice: string;
    customer: string;
    product: {
      name: string;
      sku: string;
    };
    quantity: number;
    total: number;
    date: string;
    salesperson: {
      name: string;
    };
  };
  amount: number;
  paymentMode: 'cash' | 'online';
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description?: string;
  customerName?: string;
  customerPhone?: string;
}

interface PaymentStats {
  totalAmount: number;
  totalTransactions: number;
  todayAmount: number;
  todayTransactions: number;
  cashAmount: number;
  onlineAmount: number;
  pendingAmount: number;
  completedAmount: number;
}

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
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
    pendingAmount: 0,
    completedAmount: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      // Fetch from sales endpoint as payments are created from sales
      const salesResponse = await api.get('/sales');
      const salesData = salesResponse.data;

      // Transform sales data to payment format
      const paymentData = salesData.map((sale: any) => ({
        _id: sale._id,
        sale: sale,
        amount: sale.finalAmount || sale.total,
        paymentMode: sale.paymentMode || 'cash',
        transactionId: sale.transactionId || `TXN-${sale._id}`,
        status: sale.paymentStatus || 'completed',
        date: sale.date,
        description: `Payment for ${sale.product.name}`,
        customerName: sale.customer,
        customerPhone: sale.customerPhone || 'N/A'
      }));

      setPayments(paymentData);
      calculateStats(paymentData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (paymentData: Payment[]) => {
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
      
      if (payment.paymentMode === 'cash') {
        acc.cashAmount += payment.amount;
      } else {
        acc.onlineAmount += payment.amount;
      }
      
      if (payment.status === 'pending') {
        acc.pendingAmount += payment.amount;
      } else if (payment.status === 'completed') {
        acc.completedAmount += payment.amount;
      }
      
      return acc;
    }, {
      totalAmount: 0,
      totalTransactions: 0,
      todayAmount: 0,
      todayTransactions: 0,
      cashAmount: 0,
      onlineAmount: 0,
      pendingAmount: 0,
      completedAmount: 0
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
        payment.sale?.product.name.toLowerCase().includes(filter.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesMethod = methodFilter === 'all' || payment.paymentMode === methodFilter;
      
      const matchesDateRange = 
        !dateRange?.from || 
        !dateRange?.to || 
        (new Date(payment.date) >= dateRange.from && new Date(payment.date) <= dateRange.to);
      
      return matchesFilter && matchesStatus && matchesMethod && matchesDateRange;
    })
    .sort((a, b) => {
      const aValue = a[sortBy.field as keyof Payment] || '';
      const bValue = b[sortBy.field as keyof Payment] || '';
      
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
    const variants = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const icons = {
      completed: CheckCircle,
      pending: Clock,
      failed: XCircle
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
    const variants = {
      cash: 'bg-green-100 text-green-800 border-green-200',
      online: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    const icons = {
      cash: Banknote,
      online: CreditCard
    };
    
    const Icon = icons[method as keyof typeof icons] || CreditCard;
    
    return (
      <Badge className={cn('border flex items-center gap-1', variants[method as keyof typeof variants])}>
        <Icon className="h-3 w-3" />
        {method.toUpperCase()}
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
      // Since payments are tied to sales, we delete the sale
      const payment = payments.find(p => p._id === paymentId);
      if (payment?.sale) {
        await api.delete(`/sales/${payment.sale._id}`);
        await fetchPayments(); // Refresh data
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Cash vs Online */}
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-purple-600" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Cash:</span>
                <span className="font-semibold">₹{stats.cashAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Online:</span>
                <span className="font-semibold">₹{stats.onlineAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5 text-orange-600" />
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
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
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
                      <TableCell className="font-mono text-xs">
                        {payment.transactionId}
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
                            <DropdownMenuItem onClick={() => window.print()}>
                              <Printer className="mr-2 h-4 w-4" />
                              Print Receipt
                            </DropdownMenuItem>
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
                                    Are you sure you want to delete this payment transaction? This action cannot be undone and will also delete the associated sale.
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
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              Payment Details
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Invoice No</Label>
                  <p className="font-mono">{selectedPayment.sale?.invoice || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Transaction ID</Label>
                  <p className="font-mono text-xs">{selectedPayment.transactionId}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium text-slate-600">Customer Details</Label>
                <div className="mt-1 space-y-1">
                  <p className="font-medium">{selectedPayment.customerName || selectedPayment.sale?.customer || 'Walk-in Customer'}</p>
                  <p className="text-sm text-slate-500">{selectedPayment.customerPhone || 'N/A'}</p>
                </div>
              </div>
              
              {selectedPayment.sale && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Product Details</Label>
                    <div className="mt-1 space-y-1">
                      <p className="font-medium">{selectedPayment.sale.product.name}</p>
                      <p className="text-sm text-slate-500">SKU: {selectedPayment.sale.product.sku}</p>
                      <p className="text-sm text-slate-500">Quantity: {selectedPayment.sale.quantity}</p>
                      <p className="text-sm text-slate-500">Salesperson: {selectedPayment.sale.salesperson.name}</p>
                    </div>
                  </div>
                </>
              )}
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Amount</Label>
                  <p className="text-xl font-bold">₹{selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Payment Method</Label>
                  <div className="mt-1">
                    {getMethodBadge(selectedPayment.paymentMode)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedPayment.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Date & Time</Label>
                  <p className="text-sm">{format(new Date(selectedPayment.date), 'PPP p')}</p>
                </div>
              </div>
              
              {selectedPayment.description && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Description</Label>
                    <p className="text-sm text-slate-700 mt-1">{selectedPayment.description}</p>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
