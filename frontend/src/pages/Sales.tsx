import { useEffect, useState } from 'react';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Search,
  ShoppingCart,
  TrendingUp,
  IndianRupee,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  Receipt,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Printer,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface Sale {
  _id: string;
  date: string;
  product: { 
    _id: string;
    name: string; 
    category: string;
    sku: string;
    price: number;
  };
  quantity: number;
  total: number;
  finalAmount: number;
  discount: number;
  salesperson: { 
    _id: string;
    name: string; 
  };
  customer: string;
  invoice: string;
  paymentMode: 'cash' | 'online';
  transactionId: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
}

interface MergedSale {
  _id: string;
  date: string;
  invoice: string;
  customer: string;
  salesperson: { 
    _id: string;
    name: string; 
  };
  paymentMode: 'cash' | 'online';
  transactionId: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  items: Sale[];
  totalQuantity: number;
  totalAmount: number;
  totalDiscount: number;
  finalAmount: number;
}

const Sales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [mergedSales, setMergedSales] = useState<MergedSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' }>({
    field: 'date',
    order: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedSale, setSelectedSale] = useState<MergedSale | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const mergeSalesByInvoice = (salesData: Sale[]): MergedSale[] => {
    const invoiceMap = new Map<string, Sale[]>();
    
    // Group sales by invoice number
    salesData.forEach(sale => {
      if (!invoiceMap.has(sale.invoice)) {
        invoiceMap.set(sale.invoice, []);
      }
      invoiceMap.get(sale.invoice)!.push(sale);
    });
    
    // Convert grouped sales to merged sales
    return Array.from(invoiceMap.entries()).map(([, items]) => {
      const firstItem = items[0];
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      
      // Discount is applied to overall subtotal, not individual items
      // Get discount percentage from the first item (assuming same discount for whole invoice)
      const discountPercentage = firstItem.discount || 0;
      const totalDiscount = (totalAmount * discountPercentage) / 100;
      const finalAmount = totalAmount - totalDiscount;
      
      return {
        _id: firstItem._id,
        date: firstItem.date,
        invoice: firstItem.invoice,
        customer: firstItem.customer,
        salesperson: firstItem.salesperson,
        paymentMode: firstItem.paymentMode,
        transactionId: firstItem.transactionId,
        paymentStatus: firstItem.paymentStatus,
        items: items,
        totalQuantity,
        totalAmount,
        totalDiscount,
        finalAmount
      };
    });
  };

  const fetchSales = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/sales');
      const salesData = Array.isArray(response.data) ? response.data : [];
      setSales(salesData);
      setMergedSales(mergeSalesByInvoice(salesData));
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
      setMergedSales([]);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateInvoice = (mergedSale: MergedSale) => {
    try {
      // Transform merged sale data to invoice format
      const invoiceItems = mergedSale.items.map((item, index) => {
        const originalAmount = item.product.price * item.quantity;
        
        return {
          id: index + 1,
          description: `${item.product.name} (${item.product.sku})`,
          price: item.product.price,
          quantity: item.quantity,
          subtotal: item.total,
          discount: mergedSale.totalDiscount || 0,
          originalAmount: originalAmount
        };
      });

      const invoiceData = {
        invoiceNumber: mergedSale.invoice || `INV-${Date.now()}`,
        date: format(new Date(mergedSale.date), 'MMMM dd, yyyy'),
        supplier: {
          name: "SmartPOS IMS",
          number: "IMS123456789",
          address: ["123 Business Street", "Commercial District", "Business City, 12345", "India"]
        },
        customer: {
          name: mergedSale.customer || "Walk-in Customer",
          mobile: "N/A", // Customer phone not available in MergedSale interface
          address: ["Customer Address", "City, State", "Country"]
        },
        items: invoiceItems,
        pricing: {
          subtotal: mergedSale.totalAmount,
          discount: mergedSale.totalDiscount || 0,
          discountPercentage: mergedSale.totalDiscount && mergedSale.totalAmount ? 
            (mergedSale.totalDiscount / mergedSale.totalAmount) * 100 : 0,
          finalTotal: mergedSale.finalAmount
        },
        transactionDetails: {
          transactionId: mergedSale.transactionId || "N/A",
          paymentMode: (mergedSale.paymentMode || 'cash').toUpperCase(),
          status: (mergedSale.paymentStatus || 'completed').toUpperCase(),
          processedAt: format(new Date(mergedSale.date), 'MMMM dd, yyyy HH:mm')
        },
        notes: `Sales invoice processed by ${mergedSale.salesperson.name}. Payment Mode: ${(mergedSale.paymentMode || 'cash').toUpperCase()}. Transaction ID: ${mergedSale.transactionId || 'N/A'}.${mergedSale.totalDiscount > 0 ? ` Discount Applied: ${((mergedSale.totalDiscount / mergedSale.totalAmount) * 100).toFixed(1)}%` : ''}`
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

  const handleDeleteSale = async (mergedSale: MergedSale) => {
    setDeletingSaleId(mergedSale._id);
    try {
      // Delete all sales that are part of this merged sale
      for (const item of mergedSale.items) {
        await api.delete(`/sales/${item._id}`);
      }
      
      // Update both sales and mergedSales state
      const updatedSales = sales.filter(sale => !mergedSale.items.some(item => item._id === sale._id));
      setSales(updatedSales);
      setMergedSales(mergeSalesByInvoice(updatedSales));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Failed to delete sale. Please try again.');
    } finally {
      setDeletingSaleId(null);
    }
  };

  const filteredAndSortedSales = mergedSales
    .filter(sale => {
      const matchesSearch = 
        sale.items.some(item => item.product?.name?.toLowerCase().includes(filter.toLowerCase())) ||
        sale.salesperson?.name?.toLowerCase().includes(filter.toLowerCase()) ||
        sale.customer?.toLowerCase().includes(filter.toLowerCase()) ||
        sale.invoice?.toLowerCase().includes(filter.toLowerCase());
      
      const matchesPayment = paymentFilter === 'all' || sale.paymentStatus === paymentFilter;
      
      const saleDate = new Date(sale.date);
      const matchesDateRange = 
        (!dateRange.from || saleDate >= dateRange.from) &&
        (!dateRange.to || saleDate <= dateRange.to);
      
      return matchesSearch && matchesPayment && matchesDateRange;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      if (sortBy.field.includes('.')) {
        const [obj, prop] = sortBy.field.split('.');
        aVal = (a as any)[obj]?.[prop];
        bVal = (b as any)[obj]?.[prop];
      } else if (sortBy.field === 'product.name') {
        aVal = a.items[0]?.product?.name || '';
        bVal = b.items[0]?.product?.name || '';
      } else if (sortBy.field === 'quantity') {
        aVal = a.totalQuantity;
        bVal = b.totalQuantity;
      } else {
        aVal = (a as any)[sortBy.field];
        bVal = (b as any)[sortBy.field];
      }
      
      if (sortBy.order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedSales.length / itemsPerPage);
  const paginatedSales = filteredAndSortedSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    totalSales: mergedSales.length,
    totalRevenue: mergedSales.filter(s => s.paymentStatus === 'completed').reduce((sum, sale) => sum + sale.finalAmount, 0),
    completedSales: mergedSales.filter(s => s.paymentStatus === 'completed').length,
    pendingSales: mergedSales.filter(s => s.paymentStatus === 'pending').length,
    averageOrderValue: mergedSales.length > 0 ? mergedSales.reduce((sum, sale) => sum + sale.finalAmount, 0) / mergedSales.length : 0,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge className={cn('border flex items-center gap-1', variants[status as keyof typeof variants])}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
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

  // Export Functions
  const exportToCSV = () => {
    const headers = [
      'Date',
      'Invoice No',
      'Customer Name',
      'Product(s)',
      'Quantity',
      'Subtotal',
      'Discount',
      'Final Amount',
      'Payment Mode',
      'Payment Status',
      'Salesperson',
      'Transaction ID'
    ];

    const csvData = filteredAndSortedSales.map(sale => [
      format(new Date(sale.date), 'yyyy-MM-dd HH:mm:ss'),
      sale.invoice,
      sale.customer || 'Walk-in Customer',
      sale.items.length === 1 
        ? sale.items[0].product.name 
        : sale.items.map(item => item.product.name).join('; '),
      sale.totalQuantity,
      sale.totalAmount,
      sale.totalDiscount,
      sale.finalAmount,
      sale.paymentMode.toUpperCase(),
      sale.paymentStatus.toUpperCase(),
      sale.salesperson.name,
      sale.transactionId
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
      'Product(s)',
      'Quantity',
      'Subtotal',
      'Discount Amount',
      'Discount %',
      'Final Amount',
      'Payment Mode',
      'Payment Status',
      'Salesperson',
      'Transaction ID'
    ];

    const csvData = filteredAndSortedSales.map(sale => [
      format(new Date(sale.date), 'yyyy-MM-dd HH:mm:ss'),
      sale.invoice,
      sale.customer || 'Walk-in Customer',
      sale.items.length === 1 
        ? sale.items[0].product.name 
        : sale.items.map(item => item.product.name).join('; '),
      sale.totalQuantity,
      sale.totalAmount,
      sale.totalDiscount,
      sale.totalAmount > 0 ? ((sale.totalDiscount / sale.totalAmount) * 100).toFixed(2) + '%' : '0%',
      sale.finalAmount,
      sale.paymentMode.toUpperCase(),
      sale.paymentStatus.toUpperCase(),
      sale.salesperson.name,
      sale.transactionId
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
    link.setAttribute('download', `sales_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSalesReport = () => {
    const reportContent = `
SALES REPORT
Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
===============================================

SUMMARY STATISTICS:
- Total Sales: ${stats.totalSales}
- Total Revenue: ₹${stats.totalRevenue.toLocaleString()}
- Completed Sales: ${stats.completedSales}
- Pending Sales: ${stats.pendingSales}
- Average Order Value: ₹${Math.round(stats.averageOrderValue).toLocaleString()}

SALES BREAKDOWN BY STATUS:
- Completed: ${stats.completedSales} sales (₹${stats.totalRevenue.toLocaleString()})
- Pending: ${stats.pendingSales} sales
- Failed: ${mergedSales.filter(s => s.paymentStatus === 'failed').length} sales

SALES BREAKDOWN BY PAYMENT MODE:
- Cash: ${mergedSales.filter(s => s.paymentMode === 'cash').length} sales (₹${mergedSales.filter(s => s.paymentMode === 'cash' && s.paymentStatus === 'completed').reduce((sum, sale) => sum + sale.finalAmount, 0).toLocaleString()})
- Online: ${mergedSales.filter(s => s.paymentMode === 'online').length} sales (₹${mergedSales.filter(s => s.paymentMode === 'online' && s.paymentStatus === 'completed').reduce((sum, sale) => sum + sale.finalAmount, 0).toLocaleString()})

TOP PERFORMING SALESPERSONS:
${Array.from(new Set(mergedSales.map(s => s.salesperson.name)))
  .map(salesperson => {
    const salesBySalesperson = mergedSales.filter(s => s.salesperson.name === salesperson && s.paymentStatus === 'completed');
    const totalRevenue = salesBySalesperson.reduce((sum, sale) => sum + sale.finalAmount, 0);
    return `- ${salesperson}: ${salesBySalesperson.length} sales (₹${totalRevenue.toLocaleString()})`;
  })
  .join('\n')}

DETAILED SALES TRANSACTIONS:
===============================================
${filteredAndSortedSales.map((sale, index) => `
${index + 1}. Invoice: ${sale.invoice}
   Date: ${format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}
   Customer: ${sale.customer || 'Walk-in Customer'}
   Products: ${sale.items.map(item => `${item.product.name} (Qty: ${item.quantity})`).join(', ')}
   Subtotal: ₹${sale.totalAmount.toLocaleString()}
   Discount: ₹${sale.totalDiscount.toLocaleString()} (${sale.totalAmount > 0 ? ((sale.totalDiscount / sale.totalAmount) * 100).toFixed(1) : 0}%)
   Final Amount: ₹${sale.finalAmount.toLocaleString()}
   Payment: ${sale.paymentMode.toUpperCase()} - ${sale.paymentStatus.toUpperCase()}
   Salesperson: ${sale.salesperson.name}
   Transaction ID: ${sale.transactionId}
---`).join('')}

===============================================
End of Report
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${format(new Date(), 'yyyy-MM-dd')}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
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

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Sales Management
          </h1>
          <p className="text-slate-600">Track and manage your sales transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchSales}
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
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} className="gap-2">
                <FileText className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generateSalesReport} className="gap-2">
                <Receipt className="mr-2 h-4 w-4" />
                Sales Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Sales</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalSales}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">All time transactions</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">From completed sales</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg. Order Value</p>
                <p className="text-2xl font-bold text-slate-900">₹{Math.round(stats.averageOrderValue).toLocaleString()}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Per transaction</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Sales</p>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingSales}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Awaiting completion</p>
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
                placeholder="Search sales, products, customers..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 bg-white border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
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

      {/* Sales Table */}
      <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Sales Transactions
          </CardTitle>
          <CardDescription>
            Showing {paginatedSales.length} of {filteredAndSortedSales.length} sales
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
                    <SortButton field="invoice">Invoice</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="product.name">Product</SortButton>
                  </TableHead>
                  <TableHead className="text-center">
                    <SortButton field="quantity">Qty</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="finalAmount">Total</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="customer">Customer</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="salesperson.name">Salesperson</SortButton>
                  </TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.map((sale, index) => (
                  <TableRow 
                    key={sale._id}
                    className="hover:bg-slate-50 transition-colors duration-150"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-medium">
                      {format(new Date(sale.date), 'MMM dd, yyyy')}
                      <div className="text-xs text-slate-500">
                        {format(new Date(sale.date), 'HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {sale.invoice}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {sale.items.length === 1 
                            ? sale.items[0].product?.name 
                            : `${sale.items.length} items`}
                        </div>
                        <div className="text-xs text-slate-500">
                          {sale.items.length === 1 
                            ? `${sale.items[0].product?.category} • ${sale.items[0].product?.sku}`
                            : sale.items.map(item => item.product?.name).join(', ').substring(0, 50) + (sale.items.length > 3 ? '...' : '')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{sale.totalQuantity}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{sale.finalAmount.toLocaleString()}
                      {sale.totalDiscount > 0 && (
                        <div className="text-xs text-green-600">
                          Discount: {((sale.totalDiscount / sale.totalAmount) * 100).toFixed(1)}%
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {sale.customer || 'Walk-in Customer'}
                    </TableCell>
                    <TableCell>
                      {sale.salesperson.name}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(sale.paymentStatus)}
                      <div className="text-xs text-slate-500 mt-1">
                        {sale.paymentMode.toUpperCase()}
                      </div>
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
                            setSelectedSale(sale);
                            setIsViewDialogOpen(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => generateInvoice(sale)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {(user?.role === 'admin' || sale.salesperson._id === user?._id) && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setSelectedSale(sale);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedSales.length)} of {filteredAndSortedSales.length} sales
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
        </CardContent>
      </Card>

      {/* View Sale Details Dialog */}
      {selectedSale && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Sale Details - {selectedSale.invoice}
              </DialogTitle>
              <DialogDescription>
                Complete information about this sale transaction
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedSale.date), 'PPpp')}
                  </p>
                </div>
                <div>
                  <Label>Invoice Number</Label>
                  <p className="text-sm font-medium">{selectedSale.invoice}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label>Product Details</Label>
                <div className="mt-2 space-y-2">
                  {selectedSale.items.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-slate-600">
                        {item.product.category} • SKU: {item.product.sku}
                      </p>
                      <p className="text-sm">
                        Quantity: {item.quantity} × ₹{item.product.price.toLocaleString()} = ₹{item.total.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="text-sm font-medium">{selectedSale.customer || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <Label>Salesperson</Label>
                  <p className="text-sm font-medium">{selectedSale.salesperson.name}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{selectedSale.totalAmount.toLocaleString()}</span>
                </div>
                {selectedSale.totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{selectedSale.totalDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Final Amount:</span>
                  <span>₹{selectedSale.finalAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Mode</Label>
                  <p className="text-sm font-medium">{selectedSale.paymentMode.toUpperCase()}</p>
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedSale.paymentStatus)}
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Transaction ID</Label>
                <p className="text-sm font-mono bg-slate-50 p-2 rounded">
                  {selectedSale.transactionId}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => generateInvoice(selectedSale)} className="gap-2">
                <Printer className="h-4 w-4" />
                Print Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedSale && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Sale</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this sale ({selectedSale.invoice})? This action cannot be undone and will restore the product stock.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteSale(selectedSale)}
                disabled={deletingSaleId === selectedSale._id}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletingSaleId === selectedSale._id ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Sales;
