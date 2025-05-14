import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Layout from "./Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CreditCard,
  MapPin,
  ShoppingCart,
  Truck,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  createCheckoutSession,
  redirectToCheckout,
} from "@/services/stripeService";

interface CartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  // Get cart items from localStorage on component mount
  useEffect(() => {
    const loadCartItems = () => {
      try {
        // Load cart from localStorage
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
          const cartData = JSON.parse(savedCart);

          // Convert cart object to array of items with product details
          const cartItemsArray: CartItem[] = [];

          // If we have products in localStorage, use them
          const productsData = localStorage.getItem("products");
          if (productsData) {
            const products = JSON.parse(productsData);

            // For each item in the cart, find the corresponding product
            Object.entries(cartData).forEach(([productId, quantity]) => {
              const product = products.find((p: any) => p.id === productId);
              if (product) {
                cartItemsArray.push({
                  id: productId,
                  name: product.name || product.title,
                  description: product.description,
                  price: product.price,
                  quantity: quantity as number,
                  image: product.image_url,
                });
              }
            });
          }

          console.log("Cart items array:", cartItemsArray);
          if (cartItemsArray.length > 0) {
            setCartItems(cartItemsArray);
          } else {
            toast({
              title: "Empty cart",
              description:
                "Your cart is empty. Please add products before checkout.",
              variant: "destructive",
            });
            navigate("/products");
          }
        } else {
          toast({
            title: "Empty cart",
            description:
              "Your cart is empty. Please add products before checkout.",
            variant: "destructive",
          });
          navigate("/products");
        }
      } catch (error) {
        console.error("Error loading cart data:", error);
        toast({
          title: "Error",
          description: "There was a problem loading your cart data.",
          variant: "destructive",
        });
      }
    };

    // Set default delivery address from user profile
    if (user) {
      const fullAddress = [user.address, user.city, user.county, user.postcode]
        .filter(Boolean)
        .join(", ");

      setDeliveryAddress(fullAddress || "");
    }

    // Set default delivery date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeliveryDate(tomorrow.toISOString().split("T")[0]);

    loadCartItems();
  }, [navigate, toast, user]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = 2.99;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to complete your order.",
      });
      navigate("/login", { state: { from: location } });
      return;
    }

    if (!deliveryAddress) {
      toast({
        variant: "destructive",
        title: "Delivery address required",
        description: "Please enter a delivery address.",
      });
      return;
    }

    if (!deliveryDate) {
      toast({
        variant: "destructive",
        title: "Delivery date required",
        description: "Please select a delivery date.",
      });
      return;
    }

    try {
      setIsLoading(true);

      const { sessionId, url } = await createCheckoutSession({
        products: cartItems,
        userId: user.id,
        deliveryAddress,
        deliveryDate,
      });

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        await redirectToCheckout(sessionId);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description:
          "There was a problem processing your order. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-center text-lg">Processing your order...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <ShoppingCart className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-6 bg-card">
              <CardHeader>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Delivery Address</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Delivery Address</Label>
                    <Input
                      id="address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter your full delivery address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Delivery Date</Label>
                    <div className="flex">
                      <Calendar className="mr-2 h-4 w-4 opacity-70 mt-3" />
                      <Input
                        id="date"
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Payment Method</CardTitle>
                </div>
                <CardDescription>
                  Your payment will be securely processed by Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-4 border rounded-md bg-muted/50 mb-4">
                  <CreditCard className="h-6 w-6 mr-2 text-primary" />
                  <span>
                    You'll be redirected to Stripe to complete your payment
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>For testing, you can use these card numbers:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Success: 4242 4242 4242 4242</li>
                    <li>Requires Authentication: 4000 0025 0000 3155</li>
                    <li>Decline: 4000 0000 0000 0002</li>
                  </ul>
                  <p className="mt-2">
                    Use any future expiry date, any 3-digit CVC, and any postal
                    code.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <p className="font-medium">
                          {item.name} x {item.quantity}
                        </p>
                      </div>
                      <p>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-between">
                    <p>Subtotal</p>
                    <p>${subtotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 mr-1" />
                      <p>Delivery</p>
                    </div>
                    <p>${deliveryFee.toFixed(2)}</p>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold">
                    <p>Total</p>
                    <p>${total.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleCheckout}
                  className="w-full"
                  disabled={isLoading || cartItems.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Proceed to Payment"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
