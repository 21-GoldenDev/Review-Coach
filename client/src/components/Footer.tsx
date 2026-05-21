import { useState } from "react";
import logo from "@assets/Logo_1768734204427.jpeg";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { SignInDialog } from "@/components/SignInDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function Footer() {
  const { isAuthenticated, user } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleWriteReviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      if (user?.isAthlete) {
        setLocation("/rate-coach");
      } else {
        toast({
          title: "Access Denied",
          description: "Only athletes can write reviews about coaches.",
          variant: "destructive",
        });
      }
    } else {
      setShowSignIn(true);
    }
  };

  return (
    <footer className="bg-[#202020] text-white pt-16 pb-8 border-t border-white/5">
      <SignInDialog open={showSignIn} onOpenChange={setShowSignIn} />
      
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded bg-white/10 p-0.5 overflow-hidden">
                 <img src={logo} alt="Rate My Coach" className="w-full h-full object-cover rounded" />
              </div>
              <span className="font-bold text-lg tracking-tight">Rate My Coach</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Empowering athletes to make informed decisions and helping coaches build their reputation through honest feedback.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-white">For Athletes</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="/search" className="hover:text-[#F5C518] transition-colors">Find a Coach</Link></li>
              <li>
                <Button 
                  variant="ghost"
                  onClick={handleWriteReviewClick} 
                  className="p-0 h-auto text-gray-400"
                  data-testid="button-footer-write-review"
                >
                  Write a Review
                </Button>
              </li>
            </ul>
          </div>
          
          <div>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-[#F5C518] transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-[#F5C518] transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex justify-center">
          <p className="text-xs text-gray-500">© 2026 Rate My Coach. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
