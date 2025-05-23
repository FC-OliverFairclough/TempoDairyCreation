import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  orderItems: OrderItem[];
  total: number;
  deliveryDate: string;
  paymentStatus: "paid" | "pending" | "failed";
  orderStatus: "pending" | "confirmed" | "delivered" | "cancelled";
  createdAt: string;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch orders from Supabase
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build the query
      let query = supabase.from("orders").select(`
          id,
          created_at,
          delivery_date,
          delivery_status,
          payment_status,
          total_amount,
          delivery_address,
          user_id,
          users!inner(
            id,
            email,
            first_name,
            last_name,
            phone
          ),
          order_items(
            id,
            product_id,
            quantity,
            price,
            products(
              id,
              name,
              image_url
            )
          )
        `);

      // Apply status filter
      if (filterStatus !== "all") {
        if (
          filterStatus === "paid" ||
          filterStatus === "pending" ||
          filterStatus === "failed"
        ) {
          query = query.eq("payment_status", filterStatus);
        } else {
          query = query.eq("delivery_status", filterStatus);
        }
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === "asc" });

      const { data: ordersData, error: ordersError } = await query;

      if (ordersError) {
        throw new Error(ordersError.message);
      }

      // Transform the data
      const transformedOrders: Order[] = (ordersData || []).map(
        (order: any) => {
          const user = order.users;
          return {
            id: order.id,
            customerName: user
              ? `${user.first_name} ${user.last_name}`
              : "Unknown",
            customerEmail: user?.email || "Unknown",
            customerPhone: user?.phone || "Unknown",
            address: order.delivery_address || "Unknown",
            orderItems: order.order_items || [],
            total: order.total_amount || 0,
            deliveryDate: order.delivery_date || new Date().toISOString(),
            paymentStatus: order.payment_status || "pending",
            orderStatus: order.delivery_status || "pending",
            createdAt: order.created_at || new Date().toISOString(),
          };
        },
      );

      setOrders(transformedOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus, sortField, sortDirection]);

  // Filter orders by search term (client-side filtering for search)
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchTerm ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsEditDialogOpen(true);
  };

  // Handle saving order changes to Supabase
  const handleSaveOrderChanges = async (
    orderId: string,
    orderStatus: string,
    paymentStatus: string,
  ) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          delivery_status: orderStatus,
          payment_status: paymentStatus,
        })
        .eq("id", orderId);

      if (error) throw error;

      // Refresh orders
      await fetchOrders();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating order:", error);
      // Could add error handling UI here
    }
  };

  const handleDeleteOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
      case "confirmed":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTotalItems = (orderItems: OrderItem[]) => {
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="bg-background p-6 rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            placeholder="Search by order ID, customer name, or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed Payment</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={16} />
            More Filters
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading and Error States */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading orders...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Error loading orders: {error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("id")}
                  >
                    Order ID
                    {sortField === "id" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp size={16} className="inline ml-1" />
                      ) : (
                        <ChevronDown size={16} className="inline ml-1" />
                      ))}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("customerName")}
                  >
                    Customer
                    {sortField === "customerName" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp size={16} className="inline ml-1" />
                      ) : (
                        <ChevronDown size={16} className="inline ml-1" />
                      ))}
                  </TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("total_amount")}
                  >
                    Total
                    {sortField === "total_amount" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp size={16} className="inline ml-1" />
                      ) : (
                        <ChevronDown size={16} className="inline ml-1" />
                      ))}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("delivery_date")}
                  >
                    Delivery Date
                    {sortField === "delivery_date" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp size={16} className="inline ml-1" />
                      ) : (
                        <ChevronDown size={16} className="inline ml-1" />
                      ))}
                  </TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>{order.customerName}</div>
                        <div className="text-sm text-gray-500">
                          {order.customerEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTotalItems(order.orderItems)} items
                      </TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(order.deliveryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusBadgeColor(order.paymentStatus)}
                        >
                          {order.paymentStatus.charAt(0).toUpperCase() +
                            order.paymentStatus.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusBadgeColor(order.orderStatus)}
                        >
                          {order.orderStatus.charAt(0).toUpperCase() +
                            order.orderStatus.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrder(order)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      No orders found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      {selectedOrder && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Order Details - {selectedOrder.id.slice(0, 8)}
              </DialogTitle>
              <DialogDescription>
                Created on {new Date(selectedOrder.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="customer">Customer Info</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Order Status
                    </h3>
                    <Badge
                      className={`mt-1 ${getStatusBadgeColor(selectedOrder.orderStatus)}`}
                    >
                      {selectedOrder.orderStatus.charAt(0).toUpperCase() +
                        selectedOrder.orderStatus.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Payment Status
                    </h3>
                    <Badge
                      className={`mt-1 ${getStatusBadgeColor(selectedOrder.paymentStatus)}`}
                    >
                      {selectedOrder.paymentStatus.charAt(0).toUpperCase() +
                        selectedOrder.paymentStatus.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Delivery Date
                    </h3>
                    <p className="mt-1">
                      {new Date(
                        selectedOrder.deliveryDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Total Amount
                    </h3>
                    <p className="mt-1 font-semibold">
                      ${selectedOrder.total.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Total Items
                    </h3>
                    <p className="mt-1">
                      {getTotalItems(selectedOrder.orderItems)} items
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="customer" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Customer Name
                    </h3>
                    <p className="mt-1">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1">{selectedOrder.customerEmail}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="mt-1">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Delivery Address
                    </h3>
                    <p className="mt-1">{selectedOrder.address}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="products">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.products?.image_url && (
                              <img
                                src={item.products.image_url}
                                alt={item.products.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <span>
                              {item.products?.name ||
                                `Product ${item.product_id.slice(0, 8)}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>
                          ${(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Total:
                      </TableCell>
                      <TableCell className="font-bold">
                        ${selectedOrder.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditOrder(selectedOrder);
                }}
              >
                Edit Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Order Dialog */}
      {selectedOrder && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Edit Order - {selectedOrder.id.slice(0, 8)}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Order Status</h3>
                <Select
                  defaultValue={selectedOrder.orderStatus}
                  onValueChange={(value) => {
                    setSelectedOrder({
                      ...selectedOrder,
                      orderStatus: value as any,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Payment Status</h3>
                <Select
                  defaultValue={selectedOrder.paymentStatus}
                  onValueChange={(value) => {
                    setSelectedOrder({
                      ...selectedOrder,
                      paymentStatus: value as any,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Delivery Date</h3>
                <Input
                  type="date"
                  defaultValue={selectedOrder.deliveryDate.split("T")[0]}
                  onChange={(e) => {
                    setSelectedOrder({
                      ...selectedOrder,
                      deliveryDate: e.target.value,
                    });
                  }}
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
                onClick={() => {
                  if (selectedOrder) {
                    handleSaveOrderChanges(
                      selectedOrder.id,
                      selectedOrder.orderStatus,
                      selectedOrder.paymentStatus,
                    );
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Order Dialog */}
      {selectedOrder && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete order{" "}
                {selectedOrder.id.slice(0, 8)}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Delete Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default OrderManagement;
