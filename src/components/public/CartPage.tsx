import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "./Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category?: string;
  isOrganic?: boolean;
  available: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Load cart and products from localStorage
    const loadCart = () => {
      try {
        setLoading(true);
        const savedCart = localStorage.getItem("milkman_cart");
        const savedProducts = localStorage.getItem("milkman_products");

        if (!savedCart || !savedProducts) {
          setCartItems([]);
          return;
        }

        const cartData = JSON.parse(savedCart);
        const products = JSON.parse(savedProducts);

        // Convert cart object to array of items with product details
        const cartItemsArray: CartItem[] = [];

        Object.entries(cartData).forEach(([productId, quantity]) => {
          const product = products.find((p: Product) => p.id === productId);
          if (product) {
            cartItemsArray.push({
              ...product,
              quantity: quantity as number,
            });
          }
        });

        setCartItems(cartItemsArray);
      } catch (error) {
        console.error("Error loading cart:", error);
        toast({
          title: "Error",
          description: "Failed to load your cart",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [toast]);

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Update cart items state
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item,
      ),
    );

    // Update localStorage
    const savedCart = localStorage.getItem("milkman_cart");
    if (savedCart) {
      const cartData = JSON.parse(savedCart);
      cartData[productId] = newQuantity;
      localStorage.setItem("milkman_cart", JSON.stringify(cartData));
    }
  };

  const removeFromCart = (productId: string) => {
    // Remove item from cart items state
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId),
    );

    // Update localStorage
    const savedCart = localStorage.getItem("milkman_cart");
    if (savedCart) {
      const cartData = JSON.parse(savedCart);
      delete cartData[productId];
      localStorage.setItem("milkman_cart", JSON.stringify(cartData));
    }

    toast({
      title: "Item removed",
      description: "Item has been removed from your cart",
      duration: 2000,
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("milkman_cart");
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
      duration: 2000,
    });
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = cartItems.length > 0 ? 2.99 : 0;
  const total = subtotal + deliveryFee;

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-center text-lg">Loading your cart...</p>
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
          <h1 className="text-3xl font-bold">Your Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Button asChild size="lg">
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row gap-4"
                      >
                        <div className="w-full sm:w-24 h-24 overflow-hidden rounded-md">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium">{item.title}</h3>
                            <p className="font-semibold">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            ${item.price.toFixed(2)} each
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between px-6 py-4 border-t">
                  <Button variant="outline" onClick={clearCart}>
                    Clear Cart
                  </Button>
                  <Button asChild>
                    <Link to="/products">Continue Shopping</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>${deliveryFee.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-6 py-4 border-t">
                  <Button className="w-full" asChild>
                    <Link
                      to="/checkout"
                      className="flex items-center justify-center"
                    >
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
