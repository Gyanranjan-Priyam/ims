import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Separator } from '../components/ui/separator';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
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
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  Shield,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Crown,
  User,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Phone,
  Mail,
  Clock,
  Key,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface UserAccount {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'salesperson' | 'manager' | 'accountant' | 'staff';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
  permissions: string[];
  department?: string;
  employeeId?: string;
  address?: string;
  joiningDate?: string;
  password?: string; // Optional, only used for form data
}

const Accounts = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' }>({
    field: 'name',
    order: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form state for adding/editing user
  const [formData, setFormData] = useState<Partial<UserAccount>>({
    name: '',
    email: '',
    phone: '',
    role: 'salesperson',
    isActive: true,
    department: '',
    employeeId: '',
    address: '',
    permissions: [],
    password: ''
  });


  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(filter.toLowerCase()) ||
        user.email?.toLowerCase().includes(filter.toLowerCase()) ||
        user.phone?.toLowerCase().includes(filter.toLowerCase()) ||
        user.employeeId?.toLowerCase().includes(filter.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' ? user.isActive : !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      
      if (sortBy.field.includes('.')) {
        const [obj, prop] = sortBy.field.split('.');
        const aObj = a[obj as keyof UserAccount] as any;
        const bObj = b[obj as keyof UserAccount] as any;
        aVal = aObj?.[prop];
        bVal = bObj?.[prop];
      } else {
        aVal = a[sortBy.field as keyof UserAccount];
        bVal = b[sortBy.field as keyof UserAccount];
      }
      
      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      if (sortBy.order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length,
    salespersons: users.filter(u => u.role === 'salesperson').length,
    recentLogins: users.filter(u => u.lastLogin && 
      new Date(u.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'manager': return <Shield className="h-4 w-4" />;
      case 'salesperson': return <Users className="h-4 w-4" />;
      case 'accountant': return <Calculator className="h-4 w-4" />;
      case 'staff': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      manager: 'bg-blue-100 text-blue-800 border-blue-200',
      salesperson: 'bg-green-100 text-green-800 border-green-200',
      accountant: 'bg-orange-100 text-orange-800 border-orange-200',
      staff: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    
    return (
      <Badge className={cn('border flex items-center gap-1', variants[role as keyof typeof variants])}>
        {getRoleIcon(role)}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={cn(
        'border flex items-center gap-1',
        isActive 
          ? 'bg-green-100 text-green-800 border-green-200' 
          : 'bg-red-100 text-red-800 border-red-200'
      )}>
        {isActive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSave = async () => {
    // Validation for required fields
    if (!formData.name || !formData.email) {
      alert('Please fill in all required fields (Name and Email)');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      if (selectedUser) {
        // Update existing user (don't send password in update)
        const updateData = { ...formData };
        delete updateData.password; // Remove password from update
        const res = await api.put(`/users/${selectedUser._id}`, updateData);
        const updatedUsers = users.map(u => 
          u._id === selectedUser._id ? res.data : u
        );
        setUsers(updatedUsers);
        setIsEditDialogOpen(false);
      } else {
        // Add new user
        const res = await api.post('/users', formData);
        setUsers(prev => [res.data, ...prev]);
        setIsAddDialogOpen(false);
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'salesperson',
        isActive: true,
        department: '',
        employeeId: '',
        address: '',
        permissions: [],
        password: ''
      });
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error saving user:', error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Error saving user. Please try again.');
      }
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    try {
      // Update password logic here
      console.log('Updating password for user:', selectedUser?._id);
      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating password:', error);
    }
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
            User Account Management
          </h1>
          <p className="text-slate-600">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchUsers}
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
              <DropdownMenuItem>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem>Export as Excel</DropdownMenuItem>
              <DropdownMenuItem>User Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Add New User
                </DialogTitle>
                <DialogDescription>
                  Create a new user account with appropriate role and permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password (leave blank for default)"
                  />
                  <p className="text-xs text-slate-500">
                    Leave blank to use default password: "defaultPassword123"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="salesperson">Salesperson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Enter department"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <Label htmlFor="isActive">Account Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Users</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">All registered users</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Currently active accounts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Admin level access</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Salespersons</p>
                <p className="text-2xl font-bold text-blue-600">{stats.salespersons}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Sales team members</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Recent Logins</p>
                <p className="text-2xl font-bold text-orange-600">{stats.recentLogins}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Last 24 hours</p>
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
                placeholder="Search users, email, phone..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 bg-white border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="salesperson">Salesperson</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
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
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            User Accounts
          </CardTitle>
          <CardDescription>
            Showing {paginatedUsers.length} of {filteredAndSortedUsers.length} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>
                    <SortButton field="name">Name</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="phone">Mobile Number</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="email">Email</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="role">Role</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="lastLogin">Last Login</SortButton>
                  </TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user, index) => (
                  <TableRow 
                    key={user._id}
                    className="hover:bg-slate-50 transition-colors duration-150"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-slate-100">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {user.name}
                            {getStatusBadge(user.isActive)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {user.employeeId} • {user.department}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {user.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, HH:mm') : 'Never'}
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
                            setSelectedUser(user);
                            setIsDetailsDialogOpen(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setFormData(user);
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Update User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsPasswordDialogOpen(true);
                          }}>
                            <Key className="mr-2 h-4 w-4" />
                            Update Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.name}'s account? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(user._id)}
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
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} users
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

      {/* User Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              User Details
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-4 ring-blue-100">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-xl">
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <p className="text-slate-600">{selectedUser.employeeId}</p>
                  <div className="mt-1">
                    {getRoleBadge(selectedUser.role)}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Email</Label>
                  <p className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Phone</Label>
                  <p className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {selectedUser.phone}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-600">Department</Label>
                <p className="mt-1">{selectedUser.department}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-600">Address</Label>
                <p className="mt-1">{selectedUser.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Joining Date</Label>
                  <p className="mt-1">{selectedUser.joiningDate ? format(new Date(selectedUser.joiningDate), 'PPP') : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Last Login</Label>
                  <p className="mt-1">{selectedUser.lastLogin ? format(new Date(selectedUser.lastLogin), 'PPp') : 'Never'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-600">Status</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedUser.isActive)}
                </div>
              </div>
              {selectedUser.permissions && selectedUser.permissions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Permissions</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUser.permissions.map((permission, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Update User Details
            </DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Full Name</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone Number</Label>
                <Input
                  id="editPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmail">Email Address</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="salesperson">Salesperson</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDepartment">Department</Label>
                <Input
                  id="editDepartment"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Enter department"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAddress">Address</Label>
              <Input
                id="editAddress"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter address"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <Label htmlFor="editIsActive">Account Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Update Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Update Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handlePasswordUpdate} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!newPassword || newPassword !== confirmPassword}
            >
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
