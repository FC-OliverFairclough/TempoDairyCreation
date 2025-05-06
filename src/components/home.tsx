import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import OrderManagement from "./admin/OrderManagement";
import ProductCatalog from "./admin/ProductCatalog";
import DeliveryManagement from "./admin/DeliveryManagement";
import CustomerManagement from "./admin/CustomerManagement";

export default function Home() {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">Milkman Admin</h1>
          <p className="text-sm text-muted-foreground">Delivery Dashboard</p>
        </div>

        <nav className="space-y-2 flex-1">
          <Button
            variant={activeTab === "orders" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("orders")}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Orders
          </Button>

          <Button
            variant={activeTab === "products" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("products")}
          >
            <Package className="mr-2 h-4 w-4" />
            Products
          </Button>

          <Button
            variant={activeTab === "delivery" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("delivery")}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Delivery
          </Button>

          <Button
            variant={activeTab === "customers" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("customers")}
          >
            <Users className="mr-2 h-4 w-4" />
            Customers
          </Button>
        </nav>

        <div className="mt-auto pt-4 border-t">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">
            {activeTab === "orders" && "Order Management"}
            {activeTab === "products" && "Product Catalog"}
            {activeTab === "delivery" && "Delivery Management"}
            {activeTab === "customers" && "Customer Management"}
          </h2>
          <p className="text-muted-foreground">
            {activeTab === "orders" && "View and manage all customer orders"}
            {activeTab === "products" &&
              "Manage your product catalog and inventory"}
            {activeTab === "delivery" &&
              "Configure delivery zones and schedules"}
            {activeTab === "customers" &&
              "Manage customer information and preferences"}
          </p>
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
    </div>
  );
}
