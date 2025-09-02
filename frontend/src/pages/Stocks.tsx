import { useEffect, useState } from 'react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  TrendingDown,
  Boxes,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  ScanLine,
  DollarSign,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import BarcodeScanner from '../components/ui/BarcodeScanner';

interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  supplier: string;
  stock: number;
  price: number;
  lowStockAlert: number;
  description?: string;
  lastRestocked?: string;
  status: 'active' | 'inactive' | 'discontinued';
}

const Stocks = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [scanningFor, setScanningFor] = useState<'add' | 'edit'>('add');
  const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' }>({
    field: 'name',
    order: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Form state for adding new product
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    supplier: '',
    stock: 0,
    price: 0,
    lowStockAlert: 10,
    description: '',
    status: 'active'
  });


  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/products');
      setProducts(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = 
        (product.name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (product.sku || '').toLowerCase().includes(filter.toLowerCase()) ||
        (product.barcode || '').toLowerCase().includes(filter.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortBy.field as keyof Product];
      const bVal = b[sortBy.field as keyof Product];

      const order = sortBy.order === 'asc' ? 1 : -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * order;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * order;
      }

      if (aVal === undefined || aVal === null) return 1 * order;
      if (bVal === undefined || bVal === null) return -1 * order;

      if (aVal > bVal) return 1 * order;
      if (bVal > aVal) return -1 * order;
      
      return 0;
    });

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    totalProducts: products.length,
    lowStockItems: products.filter(p => (p.stock || 0) <= (p.lowStockAlert || 0)).length,
    outOfStockItems: products.filter(p => (p.stock || 0) === 0).length,
    totalValue: products.reduce((sum, product) => sum + ((product.stock || 0) * (product.price || 0)), 0)
  };

  const getStockStatus = (product: Product) => {
    const stock = product.stock || 0;
    const lowStockAlert = product.lowStockAlert || 0;
    if (stock === 0) return { status: 'out', color: 'bg-red-100 text-red-800 border-red-200' };
    if (stock <= lowStockAlert) return { status: 'low', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { status: 'good', color: 'bg-green-100 text-green-800 border-green-200' };
  };

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const openBarcodeScanner = (mode: 'add' | 'edit') => {
    setScanningFor(mode);
    setIsBarcodeScannerOpen(true);
  };

  const handleBarcodeDetected = (barcode: string, productInfo?: any) => {
    if (scanningFor === 'add') {
      setNewProduct(prev => ({
        ...prev,
        barcode,
        name: productInfo?.title || prev.name,
        category: productInfo?.category || prev.category,
        description: productInfo?.description || prev.description,
        supplier: productInfo?.brand || productInfo?.manufacturer || prev.supplier
      }));
    } else if (selectedProduct) {
      setSelectedProduct(prev => prev ? {
        ...prev,
        barcode,
        name: productInfo?.title || prev.name,
        category: productInfo?.category || prev.category,
        description: productInfo?.description || prev.description,
        supplier: productInfo?.brand || productInfo?.manufacturer || prev.supplier
      } : null);
    }
    setIsBarcodeScannerOpen(false);
  };

  const handleAddProduct = async () => {
    try {
      const response = await api.post('/products', newProduct);
      setProducts(prev => [...prev, response.data]);
      setIsAddDialogOpen(false);
      setNewProduct({
        name: '',
        sku: '',
        barcode: '',
        category: '',
        supplier: '',
        stock: 0,
        price: 0,
        lowStockAlert: 10,
        description: '',
        status: 'active'
      });
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;
    try {
      const response = await api.put(`/products/${selectedProduct._id}`, selectedProduct);
      setProducts(prev => prev.map(p => p._id === selectedProduct._id ? response.data : p));
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const product = products.find(p => p._id === productId);
      const productName = product?.name || 'Product';
      
      // Permanent delete from database
      await api.delete(`/products/${productId}`);
      
      // Remove from local state
      setProducts(prev => prev.filter(p => p._id !== productId));
      
      // Show success message
      alert(`✅ "${productName}" has been permanently deleted from the database.`);
      
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('❌ Error deleting product. Please try again.');
    }
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct({ ...product });
    setIsEditDialogOpen(true);
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
            Inventory Management
          </h1>
          <p className="text-slate-600">Track and manage your product inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchProducts}
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
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Import Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Import from CSV</DropdownMenuItem>
              <DropdownMenuItem>Import from Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openBarcodeScanner('add')}>
                <ScanLine className="mr-2 h-4 w-4" />
                Barcode Scanner
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Add New Product
                </DialogTitle>
                <DialogDescription>
                  Enter the details for the new product to add to your inventory.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Enter SKU"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <div className="relative">
                      <Input
                        id="barcode"
                        value={newProduct.barcode}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, barcode: e.target.value }))}
                        placeholder="Enter or scan barcode"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openBarcodeScanner('add')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        title="Scan barcode"
                      >
                        <ScanLine className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newProduct.category} onValueChange={(value) => setNewProduct(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                        <SelectItem value="Clothing">Clothing</SelectItem>
                        <SelectItem value="Books">Books</SelectItem>
                        <SelectItem value="Home">Home & Garden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={newProduct.supplier}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Enter supplier name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newProduct.status} onValueChange={(value: 'active' | 'inactive' | 'discontinued') => setNewProduct(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                    <Input
                      id="lowStockAlert"
                      type="number"
                      value={newProduct.lowStockAlert}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, lowStockAlert: parseInt(e.target.value) || 0 }))}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter product description (optional)"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleAddProduct} className="bg-blue-600 hover:bg-blue-700">
                  Add Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Product Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update the product information below.
                </DialogDescription>
              </DialogHeader>
              {selectedProduct && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Product Name *</Label>
                    <Input
                      id="edit-name"
                      placeholder="Enter product name"
                      value={selectedProduct.name || ''}
                      onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-sku">SKU *</Label>
                    <Input
                      id="edit-sku"
                      placeholder="Enter SKU"
                      value={selectedProduct.sku || ''}
                      onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, sku: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-barcode">Barcode</Label>
                    <div className="relative">
                      <Input
                        id="edit-barcode"
                        placeholder="Enter barcode"
                        value={selectedProduct.barcode || ''}
                        onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, barcode: e.target.value } : null)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openBarcodeScanner('edit')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        title="Scan barcode"
                      >
                        <ScanLine className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category *</Label>
                    <Select value={selectedProduct.category || ''} onValueChange={(value) => setSelectedProduct(prev => prev ? { ...prev, category: value } : null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Clothing">Clothing</SelectItem>
                        <SelectItem value="Books">Books</SelectItem>
                        <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Beauty">Beauty</SelectItem>
                        <SelectItem value="Toys">Toys</SelectItem>
                        <SelectItem value="Automotive">Automotive</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-supplier">Supplier</Label>
                    <Input
                      id="edit-supplier"
                      placeholder="Enter supplier name"
                      value={selectedProduct.supplier || ''}
                      onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, supplier: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={selectedProduct.status || 'active'} onValueChange={(value: 'active' | 'inactive' | 'discontinued') => setSelectedProduct(prev => prev ? { ...prev, status: value } : null)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-stock">Current Stock</Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      placeholder="0"
                      value={selectedProduct.stock || 0}
                      onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Price (₹)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={selectedProduct.price || 0}
                      onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lowStockAlert">Low Stock Alert</Label>
                    <Input
                      id="edit-lowStockAlert"
                      type="number"
                      placeholder="10"
                      value={selectedProduct.lowStockAlert || 10}
                      onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, lowStockAlert: parseInt(e.target.value) || 10 } : null)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Enter product description"
                      value={selectedProduct.description || ''}
                      onChange={(e) => setSelectedProduct(prev => prev ? { ...prev, description: e.target.value } : null)}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleEditProduct} className="bg-blue-600 hover:bg-blue-700">
                  Update Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Product Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Product Details</DialogTitle>
                <DialogDescription>
                  View detailed information about this product.
                </DialogDescription>
              </DialogHeader>
              {selectedProduct && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Product Name</Label>
                      <p className="text-sm mt-1">{selectedProduct.name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">SKU</Label>
                      <p className="text-sm mt-1 font-mono">{selectedProduct.sku || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Barcode</Label>
                      <p className="text-sm mt-1 font-mono">{selectedProduct.barcode || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Category</Label>
                      <p className="text-sm mt-1">{selectedProduct.category || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Supplier</Label>
                      <p className="text-sm mt-1">{selectedProduct.supplier || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Status</Label>
                      <Badge 
                        variant={(selectedProduct.status || 'inactive') === 'active' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {selectedProduct.status || 'inactive'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Current Stock</Label>
                      <p className="text-sm mt-1 font-semibold">{selectedProduct.stock || 0}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Price</Label>
                      <p className="text-sm mt-1 font-semibold">₹{(selectedProduct.price || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Low Stock Alert</Label>
                      <p className="text-sm mt-1">{selectedProduct.lowStockAlert || 10}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Last Restocked</Label>
                      <p className="text-sm mt-1">{selectedProduct.lastRestocked ? new Date(selectedProduct.lastRestocked).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  {selectedProduct.description && (
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Description</Label>
                      <p className="text-sm mt-1 text-slate-700">{selectedProduct.description}</p>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    if (selectedProduct) {
                      handleEditClick(selectedProduct);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Edit Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) {
              setDeleteConfirmation('');
            }
          }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ Permanent Delete</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedProduct && (
                    <>
                      This action will <strong>permanently delete</strong> <strong>"{selectedProduct.name}"</strong> from the database.
                      <br /><br />
                      <span className="text-red-600 font-semibold">This will:</span>
                      <ul className="list-disc ml-6 mt-2 space-y-1">
                        <li>Remove the product completely from inventory</li>
                        <li>Delete all associated product data</li>
                        <li>Remove it from all reports and analytics</li>
                        <li>This action <strong>CANNOT</strong> be undone</li>
                      </ul>
                      <br />
                      <span className="text-amber-600">Alternative: You can mark it as "discontinued" by editing the product instead.</span>
                      <br /><br />
                      <div className="space-y-2">
                        <Label htmlFor="delete-confirmation" className="text-sm font-medium">
                          Type <strong>"DELETE"</strong> to confirm:
                        </Label>
                        <Input
                          id="delete-confirmation"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="Type DELETE to confirm"
                          className="border-red-200 focus:border-red-400"
                        />
                      </div>
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteConfirmation !== 'DELETE'}
                  onClick={() => {
                    if (selectedProduct && deleteConfirmation === 'DELETE') {
                      handleDeleteProduct(selectedProduct._id);
                    }
                    setIsDeleteDialogOpen(false);
                    setSelectedProduct(null);
                    setDeleteConfirmation('');
                  }}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  🗑️ Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Products</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Boxes className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Active inventory items</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Low Stock</p>
                <p className="text-2xl font-bold text-slate-900">{stats.lowStockItems}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Items need restocking</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Out of Stock</p>
                <p className="text-2xl font-bold text-slate-900">{stats.outOfStockItems}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Immediate action required</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Value</p>
                <p className="text-2xl font-bold text-slate-900">₹{stats.totalValue.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Inventory worth</p>
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
                placeholder="Search products, SKU, or barcode..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 bg-white border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Books">Books</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button variant="outline" className="gap-2 bg-white">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Product Inventory
          </CardTitle>
          <CardDescription>
            Showing {paginatedProducts.length} of {filteredAndSortedProducts.length} products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>
                    <SortButton field="name">Product</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="sku">SKU</SortButton>
                  </TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>
                    <SortButton field="category">Category</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="supplier">Supplier</SortButton>
                  </TableHead>
                  <TableHead className="text-center">
                    <SortButton field="stock">Stock</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="price">Price</SortButton>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product, index) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <TableRow 
                      key={product._id || index}
                      className={cn(
                        "hover:bg-slate-50 transition-colors duration-150",
                        (product.stock || 0) === 0 && "bg-red-50/50",
                        (product.stock || 0) <= (product.lowStockAlert || 0) && (product.stock || 0) > 0 && "bg-yellow-50/50"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name || 'N/A'}</div>
                          {product.description && (
                            <div className="text-xs text-slate-500 truncate max-w-48">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs">{product.barcode || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{product.supplier || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn('border', stockStatus.color)}>
                          {product.stock || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{(product.price || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={(product.status || 'inactive') === 'active' ? 'default' : 'secondary'}
                          className={(product.status || 'inactive') === 'active' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {product.status || 'inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClick(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Stock History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteClick(product)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
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

      {/* Barcode Scanner Dialog */}
      <BarcodeScanner
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onBarcodeDetected={handleBarcodeDetected}
        currentBarcode={scanningFor === 'add' ? newProduct.barcode : selectedProduct?.barcode}
      />
    </div>
  );
};

export default Stocks;
