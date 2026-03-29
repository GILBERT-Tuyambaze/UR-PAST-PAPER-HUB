import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BrandMark from '@/components/BrandMark';
import { useAuth } from '@/contexts/AuthContext';
import { fetchNotifications } from '@/lib/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  BookOpen,
  Upload,
  LayoutDashboard,
  Shield,
  Menu,
  User,
  LogOut,
  LogIn,
  UserCircle2,
  Search,
  Moon,
  Sun,
  Bell,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, login, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedTheme = localStorage.getItem('ur-theme');
    if (storedTheme) {
      setDarkMode(storedTheme === 'dark');
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('ur-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }

    void fetchNotifications()
      .then((items) => setNotificationCount(items.filter((item) => !item.is_read).length))
      .catch(() => setNotificationCount(0));
  }, [user, location.pathname]);

  const navItems = [
    { path: '/', label: 'Home', icon: BookOpen },
    { path: '/search', label: 'Browse Papers', icon: Search },
    { path: '/upload', label: 'Upload', icon: Upload, auth: true },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, auth: true },
  ];
  const canAccessManagement = user?.role === 'admin' || user?.role === 'content_manager';
  const managementPath = user?.role === 'content_manager' ? '/content-manager' : '/admin';
  const managementLabel = user?.role === 'content_manager' ? 'Content Manager' : 'Admin';

  const isActive = (path: string) => location.pathname === path;
  const navLinkClass = (active: boolean) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active ? 'theme-accent-bg' : 'text-white/75 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="theme-shell">
      <header className="theme-nav-surface sticky top-0 z-50 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
              <BrandMark label imageClassName="h-10 w-10" labelClassName="hidden text-lg sm:block" />
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                if (item.auth && !user) return null;
                const Icon = item.icon;

                return (
                  <Link key={item.path} to={item.path} className={navLinkClass(isActive(item.path))}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              {canAccessManagement && (
                <Link to={managementPath} className={navLinkClass(isActive('/admin') || isActive('/content-manager'))}>
                  <Shield className="h-4 w-4" />
                  {managementLabel}
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode((prev) => !prev)}
                className="text-white/75 hover:bg-white/10 hover:text-white"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {user ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/dashboard#notifications')}
                    className="relative text-white/75 hover:bg-white/10 hover:text-white"
                  >
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                      <span className="theme-accent-bg absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]">
                        {notificationCount}
                      </span>
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/75 hover:bg-white/10 hover:text-white"
                      >
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 border-white/10 bg-[hsl(var(--surface-strong))] text-white"
                    >
                      <div className="px-2 py-1.5 text-sm text-white/70">{user.email || 'Logged in'}</div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <UserCircle2 className="mr-2 h-4 w-4" />
                        My Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await logout();
                          navigate('/');
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button onClick={login} className="theme-accent-bg text-sm" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}

              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/75 hover:bg-white/10 hover:text-white md:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="theme-nav-surface w-64 border-none text-white">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Mobile navigation menu</SheetTitle>
                    <SheetDescription>
                      Browse pages, access uploads, open the dashboard, and reach admin tools from the mobile menu.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-8 flex flex-col gap-2">
                    {user && (
                      <Link
                        to="/profile"
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                          isActive('/profile') ? 'theme-accent-bg' : 'text-white/75 hover:bg-white/10'
                        }`}
                      >
                        <UserCircle2 className="h-5 w-5" />
                        My Profile
                      </Link>
                    )}
                    {navItems.map((item) => {
                      if (item.auth && !user) return null;
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                            isActive(item.path) ? 'theme-accent-bg' : 'text-white/75 hover:bg-white/10'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      );
                    })}
                    {canAccessManagement && (
                      <Link
                        to={managementPath}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                          isActive('/admin') || isActive('/content-manager') ? 'theme-accent-bg' : 'text-white/75 hover:bg-white/10'
                        }`}
                      >
                        <Shield className="h-5 w-5" />
                        {managementLabel}
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="theme-footer mt-16 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <div className="mb-3">
                <BrandMark label imageClassName="h-8 w-8" labelClassName="theme-title" />
              </div>
              <p className="theme-muted text-sm">
                A collaborative platform for University of Rwanda students to share and access academic resources.
              </p>
            </div>
            <div>
              <h3 className="theme-title mb-3 font-semibold">Quick Links</h3>
              <div className="theme-muted flex flex-col gap-2 text-sm">
                <Link to="/" className="transition-colors hover:text-[hsl(var(--brand))]">Home</Link>
                <Link to="/search" className="transition-colors hover:text-[hsl(var(--brand))]">Browse Papers</Link>
                <Link to="/upload" className="transition-colors hover:text-[hsl(var(--brand))]">Upload Paper</Link>
                <Link to="/story" className="transition-colors hover:text-[hsl(var(--brand))]">Story Behind This Website</Link>
              </div>
            </div>
            <div>
              <h3 className="theme-title mb-3 font-semibold">Policy</h3>
              <div className="theme-muted flex flex-col gap-2 text-sm">
                <Link to="/terms" className="transition-colors hover:text-[hsl(var(--brand))]">Terms</Link>
                <Link to="/privacy" className="transition-colors hover:text-[hsl(var(--brand))]">Privacy Policy</Link>
                <a
                  href="https://tuyambaze-gilbert.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-[hsl(var(--brand))]"
                >
                  Gilbert Tuyambaze
                </a>
              </div>
            </div>
            <div>
              <h3 className="theme-title mb-3 font-semibold">Credits</h3>
              <p className="theme-muted text-sm">
                Led by Gilbert Tuyambaze with co-operator Karly Ngarambe, inspired by the need for a reliable UR academic archive.
              </p>
              <div className="theme-muted mt-3 flex flex-col gap-2 text-sm">
                <a
                  href="https://tuyambaze-gilbert.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-[hsl(var(--brand))]"
                >
                  Gilbert Tuyambaze
                </a>
                <a
                  href="https://rw.linkedin.com/in/karly-ngarambe-designer"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-[hsl(var(--brand))]"
                >
                  Karly Ngarambe
                </a>
              </div>
            </div>
          </div>
          <div className="theme-muted mt-8 border-t border-border/70 pt-6 text-center text-sm">
            Copyright 2026 UR Academic Resource Hub. Led by{' '}
            <a href="https://tuyambaze-gilbert.vercel.app/" target="_blank" rel="noreferrer" className="hover:text-[hsl(var(--brand))]">
              Gilbert Tuyambaze
            </a>{' '}
            with {' '}
            <a
              href="https://rw.linkedin.com/in/karly-ngarambe-designer"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[hsl(var(--brand))]"
            >
              Karly Ngarambe
            </a>
            .
          </div>
        </div>
      </footer>
    </div>
  );
}
