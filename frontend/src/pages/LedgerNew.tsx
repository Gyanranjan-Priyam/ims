import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Label } from '../components/ui/label';
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
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Search,
  Plus,
  BookOpen,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Wallet,
  User
} from 'lucide-react';
import { format } from 'date-fns';

interface LedgerType {
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

const Ledger = () => {
  const navigate = useNavigate();
  const [ledgers, setLedgers] = useState<LedgerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLedger, setSelectedLedger] = useState<LedgerType | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state for adding/editing ledger
  const [formData, setFormData] = useState({
    name: '',
    contactInfo: { phone: '', email: '', address: '' },
    upiId: '',
    ledgerType: 'customer' as 'customer' | 'supplier' | 'expense' | 'income'
  });

  const fetchLedgers = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/ledger');
      setLedgers(response.data);
    } catch (err) {
      console.error('Error fetching ledgers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, []);

  // Filter ledgers based on search and filters
  const filteredLedgers = ledgers.filter(ledger => {
    const matchesSearch = 
      ledger.name.toLowerCase().includes(filter.toLowerCase()) ||
      ledger.ledgerId.toLowerCase().includes(filter.toLowerCase()) ||
      ledger.contactInfo.phone.includes(filter) ||
      ledger.contactInfo.email.toLowerCase().includes(filter.toLowerCase());
    
    const matchesType = typeFilter === 'all' || ledger.ledgerType === typeFilter;
    const matchesStatus = statusFilter === 'all' || ledger.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate summary statistics
  const totalLedgers = ledgers.length;
  const activeLedgers = ledgers.filter(l => l.status === 'active').length;
  const totalBalance = ledgers.reduce((sum, l) => sum + l.balance, 0);
  const positiveBalance = ledgers.filter(l => l.balance > 0).reduce((sum, l) => sum + l.balance, 0);
  const negativeBalance = ledgers.filter(l => l.balance < 0).reduce((sum, l) => sum + l.balance, 0);

  const handleAddLedger = async () => {
    try {
      const response = await api.post('/ledger', formData);
      setLedgers([response.data, ...ledgers]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error creating ledger:', err);
    }
  };

  const handleEditLedger = async () => {
    if (!selectedLedger) return;
    
    try {
      const response = await api.put(`/ledger/${selectedLedger._id}`, formData);
      setLedgers(ledgers.map(l => l._id === selectedLedger._id ? response.data : l));
      setIsEditDialogOpen(false);
      setSelectedLedger(null);
      resetForm();
    } catch (err) {
      console.error('Error updating ledger:', err);
    }
  };

  const handleDeleteLedger = async () => {
    if (!selectedLedger) return;
    
    try {
      await api.delete(`/ledger/${selectedLedger._id}`);
      setLedgers(ledgers.filter(l => l._id !== selectedLedger._id));
      setIsDeleteDialogOpen(false);
      setSelectedLedger(null);
    } catch (err) {
      console.error('Error deleting ledger:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactInfo: { phone: '', email: '', address: '' },
      upiId: '',
      ledgerType: 'customer'
    });
  };

  const openEditDialog = (ledger: LedgerType) => {
    setSelectedLedger(ledger);
    setFormData({
      name: ledger.name,
      contactInfo: ledger.contactInfo,
      upiId: ledger.upiId || '',
      ledgerType: ledger.ledgerType
    });
    setIsEditDialogOpen(true);
  };

  const openDetailsDialog = (ledger: LedgerType) => {
    setSelectedLedger(ledger);
    setIsDetailsDialogOpen(true);
  };

  const viewLedgerAccount = (ledgerId: string) => {
    navigate(`/ledger-account/${ledgerId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Ledger Management</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchLedgers}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Ledger
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Ledger</DialogTitle>
                <DialogDescription>
                  Create a new ledger account for customers, suppliers, or other parties.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter ledger name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ledgerType">Ledger Type *</Label>
                  <Select 
                    value={formData.ledgerType} 
                    onValueChange={(value: any) => setFormData({...formData, ledgerType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ledger type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="expense">Expense Account</SelectItem>
                      <SelectItem value="income">Income Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      value={formData.contactInfo.phone}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactInfo: {...formData.contactInfo, phone: e.target.value}
                      })}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      value={formData.contactInfo.email}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contactInfo: {...formData.contactInfo, email: e.target.value}
                      })}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    value={formData.contactInfo.address}
                    onChange={(e) => setFormData({
                      ...formData, 
                      contactInfo: {...formData.contactInfo, address: e.target.value}
                    })}
                    placeholder="Complete address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="upiId">UPI ID (Optional)</Label>
                  <Input
                    value={formData.upiId}
                    onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                    placeholder="name@upi"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLedger} disabled={!formData.name}>
                  Create Ledger
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ledgers</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLedgers}</div>
            <p className="text-xs text-muted-foreground">
              {activeLedgers} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totalBalance >= 0 ? "text-green-600" : "text-red-600"
            )}>
              ₹{totalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total across all ledgers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receivables</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{positiveBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Amount to receive
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payables</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{Math.abs(negativeBalance).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Amount to pay
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search ledgers..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ledgers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ledger ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLedgers.map((ledger) => (
                <TableRow key={ledger._id}>
                  <TableCell className="font-mono text-sm">
                    {ledger.ledgerId}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{ledger.name}</div>
                        {ledger.upiId && (
                          <div className="text-sm text-muted-foreground">
                            UPI: {ledger.upiId}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className="capitalize"
                    >
                      {ledger.ledgerType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {ledger.contactInfo.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {ledger.contactInfo.phone}
                        </div>
                      )}
                      {ledger.contactInfo.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {ledger.contactInfo.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-semibold",
                      ledger.balance >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ₹{ledger.balance.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={ledger.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {ledger.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(ledger.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewLedgerAccount(ledger._id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDetailsDialog(ledger)}>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Quick View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(ledger)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedLedger(ledger);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredLedgers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {filter || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'No ledgers found matching your filters' 
                : 'No ledgers created yet'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ledger Details</DialogTitle>
          </DialogHeader>
          {selectedLedger && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ledger ID</Label>
                  <p className="font-mono text-sm">{selectedLedger.ledgerId}</p>
                </div>
                <div>
                  <Label>Name</Label>
                  <p>{selectedLedger.name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Badge variant="outline" className="capitalize">
                    {selectedLedger.ledgerType}
                  </Badge>
                </div>
                <div>
                  <Label>Balance</Label>
                  <p className={cn(
                    "font-semibold",
                    selectedLedger.balance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    ₹{selectedLedger.balance.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <Label>Contact Information</Label>
                <div className="space-y-2 mt-2">
                  {selectedLedger.contactInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedLedger.contactInfo.phone}
                    </div>
                  )}
                  {selectedLedger.contactInfo.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {selectedLedger.contactInfo.email}
                    </div>
                  )}
                  {selectedLedger.contactInfo.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selectedLedger.contactInfo.address}
                    </div>
                  )}
                  {selectedLedger.upiId && (
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      UPI: {selectedLedger.upiId}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Badge 
                    variant={selectedLedger.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {selectedLedger.status}
                  </Badge>
                </div>
                <div>
                  <Label>Created</Label>
                  <p>{format(new Date(selectedLedger.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              onClick={() => selectedLedger && viewLedgerAccount(selectedLedger._id)}
            >
              View Full Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ledger</DialogTitle>
            <DialogDescription>
              Update ledger information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter ledger name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  value={formData.contactInfo.phone}
                  onChange={(e) => setFormData({
                    ...formData, 
                    contactInfo: {...formData.contactInfo, phone: e.target.value}
                  })}
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => setFormData({
                    ...formData, 
                    contactInfo: {...formData.contactInfo, email: e.target.value}
                  })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                value={formData.contactInfo.address}
                onChange={(e) => setFormData({
                  ...formData, 
                  contactInfo: {...formData.contactInfo, address: e.target.value}
                })}
                placeholder="Complete address"
              />
            </div>
            
            <div>
              <Label htmlFor="upiId">UPI ID (Optional)</Label>
              <Input
                value={formData.upiId}
                onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                placeholder="name@upi"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditLedger} disabled={!formData.name}>
              Update Ledger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ledger</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ledger? This action cannot be undone and will also delete all related entries and transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLedger} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Ledger;
