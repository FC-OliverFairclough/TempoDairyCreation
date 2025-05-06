import React, { useState } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCircle,
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

  // Mock data for customers
  const customers: Customer[] = [
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "(555) 123-4567",
      address: "123 Main St, Anytown, AN 12345",
      joinDate: "2023-01-15",
      orderCount: 24,
      status: "active",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "(555) 987-6543",
      address: "456 Oak Ave, Somewhere, SM 67890",
      joinDate: "2023-02-20",
      orderCount: 18,
      status: "active",
    },
    {
      id: "3",
      name: "Michael Brown",
      email: "michael.b@example.com",
      phone: "(555) 456-7890",
      address: "789 Pine Rd, Elsewhere, EL 54321",
      joinDate: "2023-03-10",
      orderCount: 12,
      status: "inactive",
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily.d@example.com",
      phone: "(555) 234-5678",
      address: "321 Cedar Ln, Nowhere, NW 13579",
      joinDate: "2023-04-05",
      orderCount: 30,
      status: "active",
    },
    {
      id: "5",
      name: "Robert Wilson",
      email: "robert.w@example.com",
      phone: "(555) 876-5432",
      address: "654 Birch St, Anywhere, AW 97531",
      joinDate: "2023-05-12",
      orderCount: 6,
      status: "inactive",
    },
  ];

  // Mock data for orders
  const customerOrders: Order[] = [
    {
      id: "ORD-001",
      date: "2023-06-15",
      products: [
        { name: "Whole Milk", quantity: 2, price: 3.99 },
        { name: "Yogurt", quantity: 3, price: 1.99 },
      ],
      total: 13.95,
      status: "delivered",
    },
    {
      id: "ORD-002",
      date: "2023-06-22",
      products: [
        { name: "Whole Milk", quantity: 2, price: 3.99 },
        { name: "Butter", quantity: 1, price: 4.5 },
      ],
      total: 12.48,
      status: "delivered",
    },
    {
      id: "ORD-003",
      date: "2023-06-29",
      products: [
        { name: "Whole Milk", quantity: 2, price: 3.99 },
        { name: "Cheese", quantity: 1, price: 5.99 },
      ],
      total: 13.97,
      status: "pending",
    },
  ];

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
    <div className="bg-background p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Management</h1>
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
                      <TableCell onClick={() => handleCustomerSelect(customer)}>
                        <div className="font-medium">{customer.name}</div>
                      </TableCell>
                      <TableCell onClick={() => handleCustomerSelect(customer)}>
                        {customer.email}
                      </TableCell>
                      <TableCell onClick={() => handleCustomerSelect(customer)}>
                        {customer.phone}
                      </TableCell>
                      <TableCell onClick={() => handleCustomerSelect(customer)}>
                        {customer.orderCount}
                      </TableCell>
                      <TableCell onClick={() => handleCustomerSelect(customer)}>
                        <Badge
                          variant={
                            customer.status === "active" ? "default" : "outline"
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

                      {customerOrders.length > 0 ? (
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
              <Button onClick={() => setIsEditDialogOpen(false)}>
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
