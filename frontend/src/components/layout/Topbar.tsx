import { useState, useEffect } from 'react';
import { 
  Search, 
  LogOut, 
  Menu, 
  Moon, 
  Sun, 
  ChevronDown,
  Command
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut
} from '../ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';
import NotificationPanel from '../ui/NotificationPanel';

interface TopbarProps {
  onMenuClick?: () => void;
  className?: string;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick, className }) => {
  const { user, logout } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Get user info from auth context
  const userName = user?.name || 'User';
  const userEmail = user?.email || 'user@company.com';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    // Add keyboard shortcut for search (Cmd/Ctrl + K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-200",
      "shadow-sm hover:shadow-md",
      className
    )}>
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2 hover:bg-slate-100 transition-colors duration-200"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search Bar */}
          <div className={cn(
            "relative flex items-center transition-all duration-300 ease-in-out",
            searchFocused ? "w-80" : "w-64",
            "max-w-md"
          )}>
            <div className="relative w-full">
              <Search className={cn(
                "absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-200",
                searchFocused ? "text-blue-500 scale-110" : "text-slate-400"
              )} size={18} />
              <Input
                id="search-input"
                type="text"
                placeholder="Search anything..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className={cn(
                  "pl-10 pr-12 h-10 bg-slate-50 border-slate-200 transition-all duration-200",
                  "focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100",
                  "hover:bg-white hover:border-slate-300",
                  searchFocused && "ring-2 ring-blue-100 border-blue-300"
                )}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-600">
                  <Command className="h-3 w-3" />K
                </kbd>
              </div>
            </div>
            
            {/* Search Results Dropdown */}
            {searchValue && searchFocused && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg border border-slate-200 shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="p-3">
                  <p className="text-sm text-slate-500 mb-2">Recent searches</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-md cursor-pointer">
                      <Search className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">Product inventory</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-md cursor-pointer">
                      <Search className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">Sales report</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-slate-100 transition-all duration-200 hover:scale-105"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-amber-500" />
            ) : (
              <Moon className="h-5 w-5 text-slate-600" />
            )}
          </Button>

          {/* Notifications */}
          <NotificationPanel />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 transition-all duration-200 hover:scale-105"
              >
                <Avatar className="h-8 w-8 ring-2 ring-blue-100">
                  <AvatarImage src="/api/placeholder/32/32" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-900">{userName}</p>
                  <p className="text-xs text-slate-500">{user?.role === 'admin' ? 'Administrator' : 'Salesperson'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block transition-transform duration-200" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/api/placeholder/40/40" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-900">{userName}</p>
                    <p className="text-sm text-slate-500">{userEmail}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress bar for loading states */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 transition-opacity duration-300" />
    </header>
  );
};

export default Topbar;
