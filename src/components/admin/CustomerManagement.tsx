import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabaseData, updateSupabaseRecord } from "@/hooks/useSupabaseData";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  orderCount: number;
  status: "active" | "inactive";
}

interface Order {
  id: string;
  date: string;
  products: { name: string; quantity: number; price: number }[];
  total: number;
  status: "delivered" | "pending" | "cancelled";
}

const CustomerManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Customer>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch customers from Supabase
  const {
    data: supabaseCustomers,
    loading,
    error,
    count: totalCustomers,
  } = useSupabaseData<Customer>({
    table: "customers",
    columns:
      "*, (SELECT COUNT(*) FROM orders WHERE customer_id = customers.id) as order_count",
    orderBy: { column: sortField, ascending: sortDirection === "asc" },
  });

  // Transform Supabase data to match our Customer interface
  const customers = supabaseCustomers.map((customer: any) => ({
    id: customer.id,
    name: customer.name || "Unknown",
    email: customer.email || "Unknown",
    phone: customer.phone || "Unknown",
    address: customer.address || "Unknown",
    joinDate: customer.created_at || new Date().toISOString(),
    orderCount: customer.order_count || 0,
    status: customer.status || "inactive",
  }));

  // State for customer orders
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Fetch customer orders when a customer is selected
  useEffect(() => {
    const fetchCustomerOrders = async () => {
      if (!selectedCustomer) return;

      setLoadingOrders(true);
      setOrdersError(null);

      try {
        const { data: ordersData, error } = await supabase
          .from("orders")
          .select("*, order_items(*, products(*))")
          .eq("customer_id", selectedCustomer.id);

        if (error) throw error;

        // Transform orders data
        const transformedOrders =
          ordersData?.map((order: any) => ({
            id: order.id,
            date: order.delivery_date,
            products:
              order.order_items?.map((item: any) => ({
                name: item.products?.name || "Unknown Product",
                quantity: item.quantity,
                price: item.price,
              })) || [],
            total: order.total_amount || 0,
            status: order.order_status || "pending",
          })) || [];

        setCustomerOrders(transformedOrders);
      } catch (error) {
        console.error("Error fetching customer orders:", error);
        setOrdersError("Failed to load customer orders");
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchCustomerOrders();
  }, [selectedCustomer]);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm),
  );

  // Sort customers based on sort field and direction
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortDirection === "asc") {
      return a[sortField] > b[sortField] ? 1 : -1;
    } else {
      return a[sortField] < b[sortField] ? 1 : -1;
    }
  });

  // Handle sort click
  const handleSort = (field: keyof Customer) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  // Handle customer edit
  const handleCustomerEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  // Render sort indicator
  const renderSortIndicator = (field: keyof Customer) => {
    if (sortField === field) {
      return sortDirection === "asc" ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      );
    }
    return null;
  };

  return (
    <div className="bg-background p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Customer Management {totalCustomers !== null && `(${totalCustomers})`}
        </h1>
        <Button>
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers by name, email, or phone..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading and Error States */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading customers...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error loading customers: {error}
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Name {renderSortIndicator("name")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center">
                        Email {renderSortIndicator("email")}
                      </div>
                    </TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("orderCount")}
                    >
                      <div className="flex items-center">
                        Orders {renderSortIndicator("orderCount")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        Status {renderSortIndicator("status")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCustomers.length > 0 ? (
                    sortedCustomers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <div className="font-medium">{customer.name}</div>
                        </TableCell>
                        <TableCell
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          {customer.email}
                        </TableCell>
                        <TableCell
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          {customer.phone}
                        </TableCell>
                        <TableCell
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          {customer.orderCount}
                        </TableCell>
                        <TableCell
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <Badge
                            variant={
                              customer.status === "active"
                                ? "default"
                                : "outline"
                            }
                          >
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCustomerEdit(customer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No customers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      {selectedCustomer && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>
                View detailed information about this customer.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 flex flex-col items-center justify-start p-4 bg-muted/30 rounded-lg">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-2xl">
                    {selectedCustomer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold">
                  {selectedCustomer.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedCustomer.email}
                </p>

                <div className="w-full">
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Customer since:
                    </span>
                    <span className="text-sm">
                      {new Date(selectedCustomer.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Total orders:
                    </span>
                    <span className="text-sm">
                      {selectedCustomer.orderCount}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Status:
                    </span>
                    <Badge
                      variant={
                        selectedCustomer.status === "active"
                          ? "default"
                          : "outline"
                      }
                    >
                      {selectedCustomer.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-6 w-full">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCustomerEdit(selectedCustomer)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Customer
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2">
                <Tabs defaultValue="details">
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="orders">Order History</TabsTrigger>
                    <TabsTrigger value="preferences">
                      Delivery Preferences
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Contact Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Email
                            </p>
                            <p>{selectedCustomer.email}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Phone
                            </p>
                            <p>{selectedCustomer.phone}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Delivery Address
                        </h4>
                        <p>{selectedCustomer.address}</p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Account Notes
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          No notes available for this customer.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="orders">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Recent Orders</h4>

                      {loadingOrders && (
                        <div className="flex justify-center items-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2">Loading orders...</span>
                        </div>
                      )}

                      {ordersError && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{ordersError}</AlertDescription>
                        </Alert>
                      )}

                      {!loadingOrders &&
                      !ordersError &&
                      customerOrders.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customerOrders.map((order) => (
                                <TableRow key={order.id}>
                                  <TableCell>{order.id}</TableCell>
                                  <TableCell>
                                    {new Date(order.date).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    {order.products.length} items
                                  </TableCell>
                                  <TableCell>
                                    ${order.total.toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        order.status === "delivered"
                                          ? "default"
                                          : order.status === "pending"
                                            ? "outline"
                                            : "destructive"
                                      }
                                    >
                                      {order.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No order history available.
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="preferences">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Delivery Schedule
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-3 rounded-md border text-center">
                            <div className="font-medium">Monday</div>
                            <div className="text-sm text-muted-foreground">
                              Preferred
                            </div>
                          </div>
                          <div className="p-3 rounded-md border text-center bg-muted/30">
                            <div className="font-medium">Wednesday</div>
                            <div className="text-sm text-muted-foreground">
                              Not selected
                            </div>
                          </div>
                          <div className="p-3 rounded-md border text-center">
                            <div className="font-medium">Friday</div>
                            <div className="text-sm text-muted-foreground">
                              Alternative
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Product Preferences
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 rounded-md border">
                            <span>Whole Milk</span>
                            <Badge>Regular</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded-md border">
                            <span>Yogurt</span>
                            <Badge>Occasional</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded-md border">
                            <span>Butter</span>
                            <Badge>Regular</Badge>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Special Instructions
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Leave deliveries by the side gate.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Customer Dialog */}
      {selectedCustomer && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update customer information and preferences.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input id="name" defaultValue={selectedCustomer.name} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={selectedCustomer.email}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </label>
                  <Input id="phone" defaultValue={selectedCustomer.phone} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status
                  </label>
                  <select
                    id="status"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    defaultValue={selectedCustomer.status}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address
                </label>
                <Input id="address" defaultValue={selectedCustomer.address} />
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </label>
                <textarea
                  id="notes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Add notes about this customer..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (selectedCustomer) {
                    try {
                      // Map to Supabase format - split name into first_name and last_name
                      const nameParts = selectedCustomer.name.split(" ");
                      const firstName = nameParts[0] || "";
                      const lastName = nameParts.slice(1).join(" ") || "";

                      const supabaseData = {
                        first_name: firstName,
                        last_name: lastName,
                        email: selectedCustomer.email,
                        phone: selectedCustomer.phone,
                        address: selectedCustomer.address,
                        status: selectedCustomer.status,
                      };

                      await updateSupabaseRecord(
                        "users",
                        selectedCustomer.id,
                        supabaseData,
                      );
                      setIsEditDialogOpen(false);
                    } catch (error) {
                      console.error("Error updating customer:", error);
                    }
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CustomerManagement;
