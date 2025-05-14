import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import Layout from "./Layout";
import { getOrderBySessionId } from "@/services/stripeService";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  user_id: string;
  delivery_address: string;
  delivery_date: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No order information found.",
      });
      navigate("/dashboard");
      return;
    }

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const orderData = await getOrderBySessionId(sessionId);
        setOrder(orderData);

        // Clear the cart after successful order
        localStorage.removeItem("cart");
      } catch (error) {
        console.error("Error fetching order:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not retrieve your order details.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [navigate, searchParams, toast]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-bold">Loading your order...</h2>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find your order details.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Order Confirmed!</h1>
            <p className="text-muted-foreground mt-2">
              Thank you for your order. Your order has been received and is
              being processed.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Order #{order.id.slice(0, 8)}</span>
                <Badge variant="outline" className="capitalize">
                  {order.order_status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Order Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order Date</p>
                    <p>{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Status</p>
                    <p className="capitalize">{order.payment_status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Delivery Date</p>
                    <p>{new Date(order.delivery_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Delivery Address</p>
                    <p>{order.delivery_address}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Order Items</h3>
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <p>Product #{item.product_id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
              <Button onClick={() => navigate("/order-history")}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                View All Orders
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
