import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Check,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/services/supabaseAuthService";
import { createOrder } from "@/services/orderService";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export default function Checkout() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load cart from localStorage on component mount
  useEffect(() => {
    const loadCartAndUser = async () => {
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          // Redirect to login if not authenticated
          navigate("/login");
          return;
        }
        setUser(currentUser);

        // Load cart from localStorage
        const savedCart = localStorage.getItem("milkman_cart");
        if (savedCart) {
          const cartData = JSON.parse(savedCart);

          // Convert cart object to array of items with product details
          const cartItemsArray: CartItem[] = [];

          // If we have products in localStorage, use them
          const productsData = localStorage.getItem("milkman_products");
          if (productsData) {
            const products = JSON.parse(productsData);

            // For each item in the cart, find the corresponding product
            Object.entries(cartData).forEach(([productId, quantity]) => {
              const product = products.find((p: any) => p.id === productId);
              if (product) {
                cartItemsArray.push({
                  id: productId,
                  name: product.title,
                  quantity: quantity as number,
                  price: product.price,
                });
              }
            });
          } else {
            // Fallback to mock data if no products in localStorage
            toast({
              title: "Cart data incomplete",
              description: "Some product information could not be loaded",
              variant: "destructive",
            });
          }

          if (cartItemsArray.length > 0) {
            setCartItems(cartItemsArray);
          } else {
            setError(
              "Your cart is empty. Please add some products before checkout.",
            );
            setTimeout(() => navigate("/products"), 3000);
          }
        } else {
          setError(
            "Your cart is empty. Please add some products before checkout.",
          );
          setTimeout(() => navigate("/products"), 3000);
        }
      } catch (err) {
        console.error("Error loading cart and user data:", err);
        setError("Failed to load checkout data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadCartAndUser();
  }, [navigate, toast]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = 2.99;
  const total = subtotal + deliveryFee;

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeliveryAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Mock payment processing function
  const processPayment = async (amount: number): Promise<boolean> => {
    // In a real app, this would integrate with Stripe or another payment processor
    return new Promise((resolve) => {
      // Simulate API call delay
      setTimeout(() => {
        // Simulate successful payment (would be actual API response in production)
        const isSuccessful = true;
        resolve(isSuccessful);
      }, 1500);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (
      !deliveryAddress.street ||
      !deliveryAddress.city ||
      !deliveryAddress.state ||
      !deliveryAddress.zipCode
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all address fields",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty. Please add products before checkout.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Process payment
      const paymentSuccessful = await processPayment(total);

      if (!paymentSuccessful) {
        throw new Error("Payment processing failed");
      }

      // Create order in database
      const orderItems = cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const newOrderId = await createOrder({
        user_id: user.id,
        total_amount: total,
        payment_method: paymentMethod,
        delivery_address: deliveryAddress,
        items: orderItems,
      });

      // Clear cart from localStorage
      localStorage.removeItem("milkman_cart");

      // Set order ID for confirmation page
      setOrderId(newOrderId);
      setIsComplete(true);
    } catch (err) {
      console.error("Error processing order:", err);
      toast({
        title: "Order processing failed",
        description:
          "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-center text-lg">Loading checkout...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Checkout Error</h1>
            <p className="text-muted-foreground mb-8">{error}</p>
            <Button asChild className="w-full">
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isComplete) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for your order. We've received your payment and will
              deliver your items on the next delivery day.
            </p>
            <div className="bg-muted p-4 rounded-md mb-8">
              <p className="font-medium">Order #{orderId.slice(0, 8)}</p>
              <p className="text-sm text-muted-foreground">
                A confirmation has been sent to your email
              </p>
            </div>
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link to="/order-history">View Order History</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </div>
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
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      name="street"
                      value={deliveryAddress.street}
                      onChange={handleAddressChange}
                      placeholder="123 Main St"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={deliveryAddress.city}
                        onChange={handleAddressChange}
                        placeholder="Anytown"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        value={deliveryAddress.state}
                        onChange={handleAddressChange}
                        placeholder="CA"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={deliveryAddress.zipCode}
                        onChange={handleAddressChange}
                        placeholder="12345"
                        required
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Payment Method</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-4">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1">
                      Credit/Debit Card
                    </Label>
                    <div className="flex space-x-1">
                      <div className="w-10 h-6 bg-gray-200 rounded"></div>
                      <div className="w-10 h-6 bg-gray-200 rounded"></div>
                      <div className="w-10 h-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-4">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex-1">
                      PayPal
                    </Label>
                    <div className="w-10 h-6 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-4">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash">Cash on Delivery</Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "card" && (
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" placeholder="123" />
                      </div>
                    </div>
                  </div>
                )}
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
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Place Order"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
