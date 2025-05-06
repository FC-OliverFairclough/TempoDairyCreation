import { useState, useEffect } from "react";
import { getCurrentUser } from "@/services/supabaseAuthService";
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
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  date: Date;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: OrderItem[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOrders() {
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          // Redirect to login if not authenticated
          navigate("/login");
          return;
        }
        setUser(currentUser);

        // Fetch orders for this user from Supabase
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(
            `
            id, 
            created_at, 
            delivery_status, 
            total_amount,
            order_items (id, product_id, quantity, price, products(title))
          `,
          )
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (ordersError) {
          throw ordersError;
        }

        if (ordersData) {
          // Transform the data to match our Order interface
          const transformedOrders: Order[] = ordersData.map((order: any) => ({
            id: order.id,
            date: new Date(order.created_at),
            status: order.delivery_status,
            total: order.total_amount,
            items: order.order_items.map((item: any) => ({
              id: item.id,
              name: item.products?.title || "Unknown Product",
              quantity: item.quantity,
              price: item.price,
            })),
          }));

          setOrders(transformedOrders);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load your order history. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [navigate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processing":
        return <Badge variant="outline">Processing</Badge>;
      case "shipped":
        return <Badge variant="secondary">Shipped</Badge>;
      case "delivered":
        return (
          <Badge variant="success" className="bg-green-500 text-white">
            Delivered
          </Badge>
        );
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
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    {order.date.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
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
