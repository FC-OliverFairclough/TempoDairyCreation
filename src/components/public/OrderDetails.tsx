import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
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
  };
}

interface OrderDetails {
  id: string;
  created_at: string;
  delivery_date?: string;
  delivery_status: string;
  payment_status: string;
  total_amount: number;
  delivery_address?: string;
  items: OrderItem[];
}

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!orderId) {
        navigate("/order-history");
        return;
      }

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

          // Fetch order details
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .eq("user_id", currentUser.id)
            .single();

          if (orderError) {
            throw orderError;
          }

          if (!orderData) {
            throw new Error("Order not found");
          }

          // Fetch order items
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
            .eq("order_id", orderId);

          if (itemsError) {
            console.error("Error fetching order items:", itemsError);
          }

          setOrder({
            ...orderData,
            items: itemsData || [],
          });
        } catch (err) {
          console.error("Error fetching order details:", err);
          if (err.message?.includes("JWT") || err.message?.includes("auth")) {
            navigate("/login");
          } else {
            setError("Failed to load order details. Please try again later.");
          }
        } finally {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in fetchOrderDetails:", err);
        if (err.message?.includes("JWT") || err.message?.includes("auth")) {
          navigate("/login");
        } else {
          setError("Failed to load order details. Please try again later.");
        }
        setLoading(false);
      }
    }

    fetchOrderDetails();
  }, [orderId, navigate]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "processing":
        return <Badge variant="outline">Processing</Badge>;
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
            <p>Loading order details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error || "Order not found"}</p>
            <Button asChild>
              <Link to="/order-history">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Order History
              </Link>
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
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/order-history">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Package className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-medium">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {order.delivery_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Date</p>
                  <p className="font-medium">
                    {new Date(order.delivery_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">
                  {getStatusBadge(order.delivery_status)}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <div className="mt-1">
                  {getStatusBadge(order.payment_status)}
                </div>
              </div>
              {order.delivery_address && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Delivery Address
                  </p>
                  <p className="font-medium">{order.delivery_address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Items:</span>
                  <span className="font-medium">{order.items.length}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            {order.items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No items found for this order.
              </p>
            ) : (
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.products?.name ||
                          `Product ${item.product_id.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        $
                        {(item.subtotal || item.price * item.quantity).toFixed(
                          2,
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
