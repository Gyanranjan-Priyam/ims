import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { 
  Home, 
  BarChart, 
  Boxes, 
  CreditCard, 
  Book, 
  Users, 
  ChevronLeft,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../../contexts/AuthContext';
import Topbar from './Topbar';

const sidebarItems = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', badge: null },
  { label: 'Sales', icon: BarChart, href: '/sales', badge: null },
  { label: 'Stocks', icon: Boxes, href: '/stocks', badge: null },
  { label: 'Payments', icon: CreditCard, href: '/payments', badge: null },
  { label: 'Ledger', icon: Book, href: '/ledger', badge: null },
  { label: 'Accounts', icon: Users, href: '/accounts', badge: null },
];

const bottomItems = [
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Logout', icon: LogOut, href: '/logout' },
];

const SidebarLayout = ({ children }: { children?: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Update active item based on current location
  useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = sidebarItems.find(item => item.href === currentPath);
    if (currentItem) {
      setActiveItem(currentItem.label);
    }
  }, [location.pathname]);

  const handleNavigation = (item: any) => {
    if (item.label === 'Logout') {
      logout();
    } else {
      navigate(item.href);
      setActiveItem(item.label);
    }
  };

  const SidebarItem = ({ item, isBottom = false }: { item: any, isBottom?: boolean }) => {
    const Icon = item.icon;
    const isActive = activeItem === item.label;
    
    const buttonContent = (
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3 px-3 py-2.5 h-auto transition-all duration-200",
          "hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98]",
          isActive && "bg-blue-50 text-blue-700 border-r-2 border-blue-500",
          isBottom && "text-slate-600 hover:text-slate-900",
          !isExpanded && "justify-center px-2"
        )}
        onClick={() => handleNavigation(item)}
      >
        <Icon className={cn(
          "h-5 w-5 transition-all duration-200",
          isActive && "text-blue-600",
          "group-hover:scale-110"
        )} />
        <span className={cn(
          "transition-all duration-200 truncate",
          !isExpanded && "opacity-0 w-0 ml-0",
          isExpanded && "opacity-100 w-auto ml-3"
        )}>
          {item.label}
        </span>
      </Button>
    );

    if (!isExpanded && !isMobile) {
      return (
        <TooltipProvider key={item.label} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="group">
                {buttonContent}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <div className="group" key={item.label}>{buttonContent}</div>;
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className={cn(
          "relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out z-40",
          "shadow-lg hover:shadow-xl",
          isExpanded || isMobile ? "w-64" : "w-16",
          isMobile && !isExpanded && "-translate-x-full absolute"
        )}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <div className={cn(
              "transition-all duration-200",
              !isExpanded && !isMobile && "opacity-0 w-0",
              (isExpanded || isMobile) && "opacity-100 w-auto"
            )}>
              <h1 className="font-bold text-lg bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                IMS Admin
              </h1>
              <p className="text-xs text-slate-500">Inventory System</p>
            </div>
          </div>
          
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="p-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-blue-100">
              <AvatarImage src="/api/placeholder/40/40" />
              <AvatarFallback className="bg-blue-600 text-white">AD</AvatarFallback>
            </Avatar>
            <div className={cn(
              "transition-all duration-200 truncate",
              !isExpanded && !isMobile && "opacity-0 w-0",
              (isExpanded || isMobile) && "opacity-100 w-auto"
            )}>
              <p className="font-semibold text-sm text-slate-900">Admin User</p>
              <p className="text-xs text-slate-500">admin@company.com</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => (
            <SidebarItem key={item.label} item={item} />
          ))}
        </nav>

        <Separator className="mx-3" />

        {/* Bottom Items */}
        <div className="p-3 space-y-1">
          {bottomItems.map((item) => (
            <SidebarItem key={item.label} item={item} isBottom />
          ))}
        </div>

        {/* Collapse/Expand Button (Desktop Only) */}
        {!isMobile && (
          <div className="p-3 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full transition-all duration-200 hover:bg-slate-100",
                !isExpanded && "justify-center px-2"
              )}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform duration-200",
                !isExpanded && "rotate-180"
              )} />
              <span className={cn(
                "ml-2 transition-all duration-200",
                !isExpanded && "opacity-0 w-0 ml-0",
                isExpanded && "opacity-100 w-auto"
              )}>
                Collapse
              </span>
            </Button>
          </div>
        )}

        {/* Animated border gradient */}
        <div className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-blue-400 via-purple-400 to-blue-400 opacity-20" />
      </div>

      {/* Mobile Overlay */}
      {isMobile && isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Mobile Trigger */}
      {isMobile && (
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 left-4 z-50 md:hidden shadow-lg bg-white/90 backdrop-blur-sm"
          onClick={() => setIsExpanded(true)}
        >
          <Home className="h-4 w-4" />
        </Button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setIsExpanded(!isExpanded)} />
        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
