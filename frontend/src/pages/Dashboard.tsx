import { useEffect, useState } from 'react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Users,
  RefreshCw,
  Package,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Star,
  Plus,
  FileText,
  Settings,
  Download,
  FileSpreadsheet,
  FileBarChart
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const mockStats = {
    revenueToday: 245000,
    salesOrders: 89,
    outOfStock: 12,
    pendingPayments: 25,
    totalCustomers: 1247,
    activeProducts: 456,
    completionRate: 94.5,
    dailySales: [
      { date: 'Aug 22', sales: 45000 },
      { date: 'Aug 23', sales: 52000 },
      { date: 'Aug 24', sales: 48000 },
      { date: 'Aug 25', sales: 61000 },
      { date: 'Aug 26', sales: 55000 },
      { date: 'Aug 27', sales: 67000 },
      { date: 'Aug 28', sales: 73000 }
    ],
    monthlySales: [
      { month: 'Jan', sales: 850000 },
      { month: 'Feb', sales: 920000 },
      { month: 'Mar', sales: 1050000 },
      { month: 'Apr', sales: 980000 },
      { month: 'May', sales: 1150000 },
      { month: 'Jun', sales: 1280000 }
    ],
    categorySales: [
      { category: 'Electronics', value: 450000 },
      { category: 'Accessories', value: 280000 },
      { category: 'Clothing', value: 180000 },
      { category: 'Books', value: 120000 },
      { category: 'Home', value: 95000 }
    ],
    salespersonPerformance: [
      { name: 'Sarah Wilson', sales: 285000 },
      { name: 'John Smith', sales: 245000 },
      { name: 'Mike Davis', sales: 195000 },
      { name: 'Emma Thompson', sales: 165000 }
    ],
    recentActivity: [
      { id: 1, type: 'sale', message: 'New sale completed - ₹45,000', time: '2 min ago' },
      { id: 2, type: 'stock', message: 'Low stock alert for iPhone 15 Pro', time: '15 min ago' },
      { id: 3, type: 'payment', message: 'Payment received - ₹28,500', time: '1 hour ago' },
      { id: 4, type: 'customer', message: 'New customer registered', time: '2 hours ago' }
    ]
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Fetch real dashboard data from backend
      const [salesRes, productsRes, paymentsRes, usersRes] = await Promise.all([
        api.get('/sales'),
        api.get('/products'),
        api.get('/payments'),
        api.get('/users')
      ]);
      
      const sales = Array.isArray(salesRes.data) ? salesRes.data : [];
      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];

      // Process data for dashboard stats
      const today = new Date().toDateString();
      
      // Calculate today's revenue from payments (not sales) - check for both 'paid' and 'completed' status
      const todayPayments = payments.filter((payment: any) => 
        (payment.status === 'paid' || payment.status === 'completed') && 
        new Date(payment.date || payment.createdAt).toDateString() === today
      );
      const revenueToday = todayPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
      
      const todaySales = sales.filter((sale: any) => new Date(sale.date || sale.createdAt).toDateString() === today);
      const outOfStock = products.filter((product: any) => product.stock <= (product.lowStockAlert || 0)).length;
      const pendingPayments = payments.filter((payment: any) => payment.status === 'unpaid' || payment.status === 'pending').length;

      // Generate daily sales data (last 7 days) - based on payments
      const dailySales = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayPayments = payments.filter((payment: any) => 
          (payment.status === 'paid' || payment.status === 'completed') && 
          new Date(payment.date || payment.createdAt).toDateString() === date.toDateString()
        );
        const dayTotal = dayPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
        return { date: dayName, sales: dayTotal };
      });

      // Generate monthly sales data - based on payments
      const monthlySales = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthPayments = payments.filter((payment: any) => {
          const paymentDate = new Date(payment.date || payment.createdAt);
          return (payment.status === 'paid' || payment.status === 'completed') && 
                 paymentDate.getMonth() === date.getMonth() && 
                 paymentDate.getFullYear() === date.getFullYear();
        });
        const monthTotal = monthPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
        return { month: monthName, sales: monthTotal };
      });

      // Generate category sales data
      const categoryMap = new Map();
      sales.forEach((sale: any) => {
        const category = sale.product?.category || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + sale.total);
      });
      const categorySales = Array.from(categoryMap.entries()).map(([category, value]) => ({
        category,
        value
      }));

      // Generate salesperson performance data
      const salespersonMap = new Map();
      sales.forEach((sale: any) => {
        const name = sale.salesperson?.name || 'Unknown';
        salespersonMap.set(name, (salespersonMap.get(name) || 0) + sale.total);
      });
      const salespersonPerformance = Array.from(salespersonMap.entries()).map(([name, sales]) => ({
        name,
        sales
      })).sort((a, b) => b.sales - a.sales);

      // Generate recent activity
      const recentActivity = [
        ...sales.slice(-2).map((sale: any, index: number) => ({
          id: `sale-${index}`,
          type: 'sale',
          message: `New sale completed - ₹${sale.total.toLocaleString()}`,
          time: getRelativeTime(sale.date)
        })),
        ...products.filter((p: any) => p.stock <= p.lowStockAlert).slice(0, 1).map((product: any, index: number) => ({
          id: `stock-${index}`,
          type: 'stock',
          message: `Low stock alert for ${product.name}`,
          time: '15 min ago'
        })),
        ...payments.filter((p: any) => p.status === 'paid').slice(-1).map((payment: any, index: number) => ({
          id: `payment-${index}`,
          type: 'payment',
          message: `Payment received - ₹${payment.amount.toLocaleString()}`,
          time: getRelativeTime(payment.date)
        }))
      ];

      const dashboardStats = {
        revenueToday,
        salesOrders: todaySales.length,
        outOfStock,
        pendingPayments,
        totalCustomers: users.filter((u: any) => u.role !== 'admin').length,
        activeProducts: products.length,
        dailySales,
        monthlySales,
        categorySales,
        salespersonPerformance,
        recentActivity
      };

      setStats(dashboardStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data if API fails
      setStats(mockStats);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  // Export Functions
  const exportDashboardCSV = () => {
    const headers = [
      'Metric',
      'Value',
      'Description'
    ];

    const csvData = [
      ['Revenue Today', `₹${(stats?.revenueToday || 0).toLocaleString()}`, 'Total revenue generated today'],
      ['Sales Orders', stats?.salesOrders || 0, 'Number of completed sales orders'],
      ['Out of Stock Items', stats?.outOfStock || 0, 'Products currently out of stock'],
      ['Pending Payments', stats?.pendingPayments || 0, 'Number of pending payment transactions'],
      ['Total Customers', stats?.totalCustomers || 0, 'Total registered customers'],
      ['Active Products', stats?.activeProducts || 0, 'Number of active products in inventory'],
      ['Completion Rate', `${(stats?.completionRate || 0).toFixed(1)}%`, 'Order completion percentage']
    ];

    // Add daily sales data
    if (stats?.dailySales) {
      csvData.push(['--- Daily Sales ---', '', '']);
      stats.dailySales.forEach((day: any) => {
        csvData.push([day.date, `₹${day.sales.toLocaleString()}`, 'Daily sales amount']);
      });
    }

    // Add category sales data
    if (stats?.categorySales) {
      csvData.push(['--- Category Sales ---', '', '']);
      stats.categorySales.forEach((category: any) => {
        csvData.push([category.category, `₹${category.value.toLocaleString()}`, 'Category sales amount']);
      });
    }

    // Add salesperson performance
    if (stats?.salespersonPerformance) {
      csvData.push(['--- Salesperson Performance ---', '', '']);
      stats.salespersonPerformance.forEach((person: any) => {
        csvData.push([person.name, `₹${person.sales.toLocaleString()}`, 'Salesperson total sales']);
      });
    }

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard_data_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDashboardExcel = () => {
    // Similar to CSV but with BOM for Excel compatibility
    const headers = [
      'Metric',
      'Value',
      'Description',
      'Category'
    ];

    const csvData = [
      ['Revenue Today', `₹${(stats?.revenueToday || 0).toLocaleString()}`, 'Total revenue generated today', 'Financial'],
      ['Sales Orders', stats?.salesOrders || 0, 'Number of completed sales orders', 'Sales'],
      ['Out of Stock Items', stats?.outOfStock || 0, 'Products currently out of stock', 'Inventory'],
      ['Pending Payments', stats?.pendingPayments || 0, 'Number of pending payment transactions', 'Financial'],
      ['Total Customers', stats?.totalCustomers || 0, 'Total registered customers', 'Customer'],
      ['Active Products', stats?.activeProducts || 0, 'Number of active products in inventory', 'Inventory'],
      ['Completion Rate', `${(stats?.completionRate || 0).toFixed(1)}%`, 'Order completion percentage', 'Performance']
    ];

    // Add daily sales data
    if (stats?.dailySales) {
      stats.dailySales.forEach((day: any) => {
        csvData.push([`Daily Sales - ${day.date}`, `₹${day.sales.toLocaleString()}`, 'Daily sales amount', 'Daily Sales']);
      });
    }

    // Add category sales data
    if (stats?.categorySales) {
      stats.categorySales.forEach((category: any) => {
        csvData.push([`Category - ${category.category}`, `₹${category.value.toLocaleString()}`, 'Category sales amount', 'Category Sales']);
      });
    }

    // Add salesperson performance
    if (stats?.salespersonPerformance) {
      stats.salespersonPerformance.forEach((person: any) => {
        csvData.push([`Salesperson - ${person.name}`, `₹${person.sales.toLocaleString()}`, 'Salesperson total sales', 'Performance']);
      });
    }

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateDashboardReport = () => {
    const reportContent = `
DASHBOARD OVERVIEW REPORT
Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
===============================================

KEY PERFORMANCE INDICATORS:
- Revenue Today: ₹${(stats?.revenueToday || 0).toLocaleString()}
- Sales Orders: ${stats?.salesOrders || 0}
- Out of Stock Items: ${stats?.outOfStock || 0}
- Pending Payments: ${stats?.pendingPayments || 0}
- Total Customers: ${stats?.totalCustomers || 0}
- Active Products: ${stats?.activeProducts || 0}
- Order Completion Rate: ${(stats?.completionRate || 0).toFixed(1)}%

DAILY SALES TREND:
${stats?.dailySales ? stats.dailySales.map((day: any) => `${day.date}: ₹${day.sales.toLocaleString()}`).join('\n') : 'No daily sales data available'}

MONTHLY SALES PERFORMANCE:
${stats?.monthlySales ? stats.monthlySales.map((month: any) => `${month.month}: ₹${month.sales.toLocaleString()}`).join('\n') : 'No monthly sales data available'}

CATEGORY WISE SALES:
${stats?.categorySales ? stats.categorySales.map((category: any) => `${category.category}: ₹${category.value.toLocaleString()}`).join('\n') : 'No category sales data available'}

SALESPERSON PERFORMANCE:
${stats?.salespersonPerformance ? stats.salespersonPerformance.map((person: any) => `${person.name}: ₹${person.sales.toLocaleString()}`).join('\n') : 'No salesperson data available'}

RECENT ACTIVITY:
${stats?.recentActivity ? stats.recentActivity.map((activity: any) => `• ${activity.message} (${activity.time})`).join('\n') : 'No recent activity available'}

===============================================
Report generated automatically from Dashboard data
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard_report_${format(new Date(), 'yyyy-MM-dd')}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour ago`;
    return `${Math.floor(diffInMinutes / 1440)} day ago`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards = [
    {
      title: "Today's Revenue",
      value: stats?.revenueToday ? `₹${stats.revenueToday.toLocaleString()}` : '₹0',
      description: "Daily earnings",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+12.5%",
      trend: "up"
    },
    {
      title: "Sales Orders",
      value: stats?.salesOrders || 0,
      description: "Total orders today",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+8.2%",
      trend: "up"
    },
    {
      title: "Out of Stock",
      value: stats?.outOfStock || 0,
      description: "Items need restocking",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "-3.1%",
      trend: "down"
    },
    {
      title: "Pending Payments",
      value: stats?.pendingPayments || 0,
      description: "Awaiting collection",
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "-15.3%",
      trend: "down"
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers || 0,
      description: "Registered customers",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      change: "+5.7%",
      trend: "up"
    },
    {
      title: "Active Products",
      value: stats?.activeProducts || 0,
      description: "Products in inventory",
      icon: Package,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      change: "+2.1%",
      trend: "up"
    }
  ];

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="space-y-2">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-slate-600">Welcome back! Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchData}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-slate-50 transition-all duration-200"
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
              <DropdownMenuItem onClick={exportDashboardCSV} className="gap-2">
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportDashboardExcel} className="gap-2">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generateDashboardReport} className="gap-2">
                <FileBarChart className="mr-2 h-4 w-4" />
                Dashboard Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index}
            className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "p-3 rounded-xl group-hover:scale-110 transition-transform duration-200 shadow-sm",
                  stat.bgColor
                )}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div className="flex items-center gap-1">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs",
                      stat.trend === 'up' ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
                    )}
                  >
                    {stat.change}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Sales Trend */}
          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Daily Sales Trends
              </CardTitle>
              <CardDescription>Sales performance over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.dailySales || []}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) => `₹${value/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Sales']}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      fill="url(#salesGradient)"
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Category Sales */}
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                  Category Performance
                </CardTitle>
                <CardDescription>Sales distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.categorySales || []}
                        dataKey="value"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {(stats?.categorySales || []).map((_: unknown, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={colors[index % colors.length]}
                            className="hover:opacity-80 transition-opacity duration-200"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Sales']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-orange-600" />
                  Top Performers
                </CardTitle>
                <CardDescription>Best salespeople this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.salespersonPerformance?.slice(0, 4).map((person: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors duration-200">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                          index === 0 ? "bg-yellow-500" : index === 1 ? "bg-slate-400" : index === 2 ? "bg-amber-600" : "bg-slate-300"
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{person.name}</p>
                          <p className="text-sm text-slate-500">Sales Rep</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">₹{person.sales.toLocaleString()}</p>
                        <p className="text-xs text-green-600">+12.5%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Minimal Sidebar */}
        <div className="space-y-4">
          {/* Today's Date */}
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {format(new Date(), 'dd')}
                </p>
                <p className="text-sm text-slate-600">
                  {format(new Date(), 'MMM yyyy')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8 px-2 text-xs">
                <Plus className="h-3 w-3" />
                New Sale
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8 px-2 text-xs">
                <Package className="h-3 w-3" />
                Add Product
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8 px-2 text-xs">
                <FileText className="h-3 w-3" />
                Reports
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8 px-2 text-xs">
                <Settings className="h-3 w-3" />
                Settings
              </Button>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">Sales</span>
                </div>
                <span className="text-xs font-medium">{stats?.todaySales || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">Low Stock</span>
                </div>
                <span className="text-xs font-medium">{stats?.outOfStock || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">Pending</span>
                </div>
                <span className="text-xs font-medium">{stats?.pendingPayments || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
