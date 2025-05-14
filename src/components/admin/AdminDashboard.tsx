import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../public/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  MapPin,
  Calendar,
  Users,
  Settings,
  Loader2,
} from "lucide-react";
import OrderManagement from "./OrderManagement";
import ProductCatalog from "./ProductCatalog";
import DeliveryManagement from "./DeliveryManagement";
import CustomerManagement from "./CustomerManagement";
import CustomerStatistics from "./CustomerStatistics";
import { isAdmin } from "@/services/supabaseAuthService";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const hasAdminAccess = await isAdmin();
        if (!hasAdminAccess) {
          navigate("/dashboard");
          return;
        }
        setAuthorized(true);
      } catch (error) {
        console.error("Error checking admin access:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Loading admin dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!authorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage orders, products, delivery zones, and customers.
          </p>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === "orders" ? "default" : "outline"}
            onClick={() => setActiveTab("orders")}
            className="flex items-center"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Orders
          </Button>

          <Button
            variant={activeTab === "products" ? "default" : "outline"}
            onClick={() => setActiveTab("products")}
            className="flex items-center"
          >
            <Package className="mr-2 h-4 w-4" />
            Products
          </Button>

          <Button
            variant={activeTab === "delivery" ? "default" : "outline"}
            onClick={() => setActiveTab("delivery")}
            className="flex items-center"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Delivery
          </Button>

          <Button
            variant={activeTab === "customers" ? "default" : "outline"}
            onClick={() => setActiveTab("customers")}
            className="flex items-center"
          >
            <Users className="mr-2 h-4 w-4" />
            Customers
          </Button>
        </div>

        {/* Dashboard Overview Cards */}
        {activeTab === "orders" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Total Orders</h3>
                <p className="text-3xl font-bold">128</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Pending</h3>
                <p className="text-3xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">
                  Awaiting delivery
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Completed</h3>
                <p className="text-3xl font-bold">104</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Revenue</h3>
                <p className="text-3xl font-bold">$2,580</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "products" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Total Products</h3>
                <p className="text-3xl font-bold">42</p>
                <p className="text-sm text-muted-foreground">In catalog</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Active</h3>
                <p className="text-3xl font-bold">36</p>
                <p className="text-sm text-muted-foreground">Available now</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Out of Stock</h3>
                <p className="text-3xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Need restock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Seasonal</h3>
                <p className="text-3xl font-bold">6</p>
                <p className="text-sm text-muted-foreground">Limited time</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "delivery" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Delivery Zone</h3>
                <p className="text-3xl font-bold">5 km</p>
                <p className="text-sm text-muted-foreground">Current radius</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Next Delivery</h3>
                <p className="text-3xl font-bold">Monday</p>
                <p className="text-sm text-muted-foreground">May 15, 2023</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Cutoff Time</h3>
                <p className="text-3xl font-bold">5:00 PM</p>
                <p className="text-sm text-muted-foreground">
                  For next day delivery
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Total Customers</h3>
                <p className="text-3xl font-bold">256</p>
                <p className="text-sm text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Active</h3>
                <p className="text-3xl font-bold">187</p>
                <p className="text-sm text-muted-foreground">
                  Ordered this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">New</h3>
                <p className="text-3xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Recurring</h3>
                <p className="text-3xl font-bold">142</p>
                <p className="text-sm text-muted-foreground">
                  Weekly deliveries
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Component Content */}
        <div className="bg-card rounded-lg border shadow">
          {activeTab === "orders" && <OrderManagement />}
          {activeTab === "products" && <ProductCatalog />}
          {activeTab === "delivery" && <DeliveryManagement />}
          {activeTab === "customers" && <CustomerManagement />}
        </div>
      </div>
    </Layout>
  );
}
