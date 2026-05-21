import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CoachProfile from "@/pages/CoachProfile";
import SearchResults from "@/pages/SearchResults";
import Auth from "@/pages/Auth";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import RateCoach from "@/pages/RateCoach";
import AdminDashboard from "@/pages/AdminDashboard";
import AboutUs from "@/pages/AboutUs";
import Contact from "@/pages/Contact";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchResults} />
      <Route path="/coach/:id" component={CoachProfile} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Auth} />
      <Route path="/profile" component={Profile} />
      <Route path="/rate-coach" component={RateCoach} />
      <Route path="/rate" component={RateCoach} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/about" component={AboutUs} />
      <Route path="/contact" component={Contact} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
