import { Link, useLocation } from "wouter";
import logo from "@assets/Logo_1768734204427.jpeg";
import { Menu, X, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignInDialog } from "@/components/SignInDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Header() {
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [showCoachPopup, setShowCoachPopup] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#202020] h-[72px] shadow-md">
      <div className="container mx-auto px-4 h-full flex items-center justify-between max-w-7xl">
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative overflow-hidden rounded-lg w-10 h-10 bg-white/10 p-0.5">
            <img 
              src={logo} 
              alt="Rate My Coach" 
              className="w-full h-full object-cover rounded-md" 
            />
          </div>
          <span className="text-white font-bold text-xl tracking-tight hidden sm:block">
            Rate My Coach
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {isAdmin && (
                <Link href="/admin">
                  <button
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold btn-secondary-light flex items-center gap-2"
                    data-testid="button-admin-dashboard"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Dashboard
                  </button>
                </Link>
              )}
              <Link href="/profile">
                <button className="px-3 py-2 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-white/20">
                    <AvatarImage src={user.profilePicture || undefined} alt={user.name} />
                    <AvatarFallback className="bg-[#F5C518] text-[#202020] font-bold text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline">{user.name}</span>
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold btn-secondary-dark flex items-center gap-2"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="px-5 py-2.5 rounded-lg text-sm font-semibold btn-secondary-dark">
                  Sign in
                </button>
              </Link>
              <Link href="/register">
                <button className="px-5 py-2.5 rounded-lg text-sm font-semibold btn-secondary-light">
                  Register
                </button>
              </Link>
            </>
          )}
          {isAuthenticated && user?.isAthlete ? (
            <Link href="/rate-coach">
              <button className="px-6 py-2.5 rounded-lg text-sm font-bold btn-primary-yellow shadow-lg shadow-yellow-500/20" data-testid="button-header-write-review">
                Write a Review
              </button>
            </Link>
          ) : isAuthenticated ? (
            <Popover open={showCoachPopup} onOpenChange={setShowCoachPopup}>
              <PopoverTrigger asChild>
                <button 
                  onClick={() => setShowCoachPopup(true)}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold btn-primary-yellow shadow-lg shadow-yellow-500/20"
                  data-testid="button-header-write-review"
                >
                  Write a Review
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto px-4 py-2 text-sm font-medium text-white border-0"
                style={{ backgroundColor: '#8B4513' }}
                sideOffset={8}
              >
                Only athletes can submit reviews
              </PopoverContent>
            </Popover>
          ) : (
            <button 
              onClick={() => setShowSignInDialog(true)}
              className="px-6 py-2.5 rounded-lg text-sm font-bold btn-primary-yellow shadow-lg shadow-yellow-500/20"
              data-testid="button-header-write-review"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-[#252525] border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-3">
              {isAuthenticated && user ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                      <button
                        className="w-full py-3 rounded-lg text-sm font-semibold btn-secondary-light flex items-center justify-center gap-2"
                        data-testid="button-admin-dashboard-mobile"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Dashboard
                      </button>
                    </Link>
                  )}
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full py-3 rounded-lg text-sm font-semibold btn-secondary-dark flex items-center justify-center gap-2">
                      <Avatar className="h-8 w-8 border-2 border-white/20">
                        <AvatarImage src={user.profilePicture || undefined} alt={user.name} />
                        <AvatarFallback className="bg-[#F5C518] text-[#202020] font-bold text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {user.name}
                    </button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 rounded-lg text-sm font-semibold btn-secondary-dark flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full py-3 rounded-lg text-sm font-semibold btn-secondary-dark">
                      Sign in
                    </button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full py-3 rounded-lg text-sm font-semibold btn-secondary-light">
                      Register
                    </button>
                  </Link>
                </>
              )}
              {isAuthenticated && user?.isAthlete ? (
                <Link href="/rate-coach" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="w-full py-3 rounded-lg text-sm font-bold btn-primary-yellow">
                    Write a Review
                  </button>
                </Link>
              ) : isAuthenticated ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full py-3 rounded-lg text-sm font-bold btn-primary-yellow">
                      Write a Review
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto px-4 py-2 text-sm font-medium text-white border-0"
                    style={{ backgroundColor: '#8B4513' }}
                    sideOffset={8}
                  >
                    Only athletes can submit reviews
                  </PopoverContent>
                </Popover>
              ) : (
                <button 
                  onClick={() => {
                    setShowSignInDialog(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-lg text-sm font-bold btn-primary-yellow"
                >
                  Write a Review
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SignInDialog 
        open={showSignInDialog} 
        onOpenChange={setShowSignInDialog} 
        redirectTo="/rate-coach"
      />
    </header>
  );
}
