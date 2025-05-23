import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "./Layout";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/services/supabaseAuthService";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal?: number;
  products?: {
    id?: string;
    name?: string;
    title?: string;
  };
}

interface Order {
  id: string;
  date: Date;
  status: string;
  total: number;
  items: OrderItem[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        // Check authentication first
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate("/login");
          return;
        }
        setUser(currentUser);

        try {
          setLoading(true);
          setError(null);

          // First, fetch the orders for this user
          const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false });

          if (ordersError) {
            throw ordersError;
          }

          // For each order, fetch its order items
          const ordersWithItems = await Promise.all(
            ordersData.map(async (order) => {
              // Fetch order items for this order
              const { data: itemsData, error: itemsError } = await supabase
                .from("order_items")
                .select(
                  `
                  id,
                  product_id,
                  quantity,
                  price,
                  subtotal,
                  products:product_id (id, name)
                `,
                )
                .eq("order_id", order.id);

              if (itemsError) {
                console.error(
                  `Error fetching items for order ${order.id}:`,
                  itemsError,
                );
                return {
                  id: order.id,
                  date: new Date(order.created_at),
                  status: order.delivery_status || "processing",
                  total: order.total_amount,
                  items: [],
                };
              }

              return {
                id: order.id,
                date: new Date(order.created_at),
                status: order.delivery_status || "processing",
                total: order.total_amount,
                items: itemsData || [],
              };
            }),
          );

          setOrders(ordersWithItems);
        } catch (err) {
          console.error("Error fetching orders:", err);
          if (err.message?.includes("JWT") || err.message?.includes("auth")) {
            navigate("/login");
          } else {
            setError(
              "Failed to load your order history. Please try again later.",
            );
          }
        } finally {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in fetchOrders:", err);
        if (err.message?.includes("JWT") || err.message?.includes("auth")) {
          navigate("/login");
        } else {
          setError(
            "Failed to load your order history. Please try again later.",
          );
        }
        setLoading(false);
      }
    }

    fetchOrders();
  }, [navigate]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "processing":
        return <Badge variant="outline">Processing</Badge>;
      case "shipped":
      case "confirmed":
        return <Badge variant="secondary">Confirmed</Badge>;
      case "completed":
      case "delivered":
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Loading your order history...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <Package className="h-6 w-6 mr-2 text-primary" />
            <h1 className="text-3xl font-bold">Order History</h1>
          </div>
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Package className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-3xl font-bold">Order History</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders yet. Start shopping to see your
              orders here.
            </p>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableCaption>A list of your recent orders.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    {order.date.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.items ? order.items.length : 0} items
                  </TableCell>
                  <TableCell className="text-right">
                    ${order.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                      asChild
                    >
                      <Link to={`/order-details/${order.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        <span>View</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Layout>
  );
}
