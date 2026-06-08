import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Shield, Users, MessageSquare, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { AdminReviewsPanel } from "@/components/admin/AdminReviewsPanel";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("users");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold mb-2" data-testid="text-access-denied">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">You must be an admin to access this page.</p>
            <Button
              onClick={() => navigate("/login")}
              className="btn-primary-yellow"
              data-testid="button-go-to-login"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#202020] text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#F5C518]" />
            <h1 className="text-xl font-bold" data-testid="text-admin-header">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700 hover:text-white gap-2"
            >
              <Home className="w-4 h-4" />
              Homepage
            </Button>
            <span className="text-sm text-gray-400" data-testid="text-logged-in-as">
              Logged in as {user.name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-white border h-11 p-1">
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-[#F5C518] data-[state=active]:text-[#202020] gap-2"
              data-testid="tab-users"
            >
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:bg-[#F5C518] data-[state=active]:text-[#202020] gap-2"
              data-testid="tab-reviews"
            >
              <MessageSquare className="w-4 h-4" />
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            {activeTab === "users" && <AdminUsersPanel />}
          </TabsContent>

          <TabsContent value="reviews">
            {activeTab === "reviews" && <AdminReviewsPanel />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
