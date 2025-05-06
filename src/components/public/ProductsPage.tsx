import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import Layout from "./Layout";
import { supabase } from "@/lib/supabase";
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({}); // Product ID -> Quantity
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem("milkman_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("milkman_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        // Check if Supabase URL and key are available
        if (
          !import.meta.env.VITE_SUPABASE_URL ||
          !import.meta.env.VITE_SUPABASE_ANON_KEY
        ) {
          console.error("Supabase environment variables are missing");
          throw new Error(
            "Configuration error: Database connection not available",
          );
        }

        console.log("Fetching products from Supabase...");
        const { data, error } = await supabase
          .from("products")
          .select(
            "id, name, description, price, category, available, stock, image_url",
          );
        console.log("Supabase response:", { data, error });

        if (error) {
          console.error("Supabase query error:", error);
          throw error;
        }

        if (data && data.length > 0) {
          console.log(
            "Products loaded successfully:",
            data.length,
            "products found",
          );

          // Store products in localStorage for cart reference
          localStorage.setItem("milkman_products", JSON.stringify(data));
          // Transform data to match our Product interface if needed
          const formattedProducts = data.map((product) => ({
            id: product.id,
            title: product.name,
            description: product.description,
            price: product.price,
            image_url: product.image_url,
            category: product.category,
            isOrganic:
              product.category === "organic" ||
              product.name.toLowerCase().includes("organic"),
            available: product.available,
          }));
          setProducts(formattedProducts);
        } else {
          console.log("No products found or empty data array returned");
          throw new Error("No products available");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");

        // Fallback to mock data if Supabase fetch fails
        setProducts([
          {
            id: "1",
            title: "Whole Milk",
            description: "Fresh whole milk from local farms",
            price: 3.99,
            image_url:
              "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80",
            category: "milk",
            isOrganic: true,
            available: true,
          },
          {
            id: "2",
            title: "Low-Fat Milk",
            description: "2% milk, perfect for everyday use",
            price: 3.49,
            image_url:
              "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80",
            category: "milk",
            isOrganic: false,
            available: true,
          },
          {
            id: "3",
            title: "Butter",
            description: "Creamy butter made from grass-fed cows",
            price: 4.99,
            image_url:
              "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80",
            category: "butter",
            isOrganic: true,
            available: true,
          },
          {
            id: "4",
            title: "Yogurt",
            description: "Probiotic plain yogurt",
            price: 2.99,
            image_url:
              "https://images.unsplash.com/photo-1584278860047-22db9ff82bed?w=400&q=80",
            category: "yogurt",
            isOrganic: true,
            available: true,
          },
          {
            id: "5",
            title: "Cheese",
            description: "Aged cheddar cheese",
            price: 5.99,
            image_url:
              "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80",
            category: "cheese",
            isOrganic: false,
            available: true,
          },
          {
            id: "6",
            title: "Cream",
            description: "Heavy whipping cream",
            price: 3.29,
            image_url:
              "https://images.unsplash.com/photo-1587657565520-6c0c76b9f5f3?w=400&q=80",
            category: "cream",
            isOrganic: false,
            available: true,
          },
        ]);
        toast({
          title: "Using mock data",
          description:
            "Couldn't connect to the database, showing sample products instead",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [toast]);

  const filteredProducts =
    filter === "all"
      ? products
      : filter === "organic"
        ? products.filter((p) => p.isOrganic)
        : products.filter((p) => p.category === filter);

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const updatedCart = {
        ...prev,
        [productId]: (prev[productId] || 0) + 1,
      };

      // Save to localStorage immediately
      localStorage.setItem("milkman_cart", JSON.stringify(updatedCart));
      return updatedCart;
    });

    toast({
      title: "Added to cart",
      description: "Item has been added to your cart",
      duration: 2000,
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId] -= 1;
      } else {
        delete newCart[productId];
      }

      // Save to localStorage immediately
      localStorage.setItem("milkman_cart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-center text-lg">Loading products...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-red-500">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Our Products</h1>
            <p className="text-muted-foreground">
              Browse our selection of fresh dairy products
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === "milk" ? "default" : "outline"}
              onClick={() => setFilter("milk")}
              size="sm"
            >
              Milk
            </Button>
            <Button
              variant={filter === "cheese" ? "default" : "outline"}
              onClick={() => setFilter("cheese")}
              size="sm"
            >
              Cheese
            </Button>
            <Button
              variant={filter === "yogurt" ? "default" : "outline"}
              onClick={() => setFilter("yogurt")}
              size="sm"
            >
              Yogurt
            </Button>
            <Button
              variant={filter === "organic" ? "default" : "outline"}
              onClick={() => setFilter("organic")}
              size="sm"
            >
              Organic
            </Button>
          </div>
        </div>

        {/* Cart summary */}
        {totalItems > 0 && (
          <div className="bg-card border rounded-lg p-4 mb-8 flex justify-between items-center">
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              <span>
                {totalItems} item{totalItems !== 1 ? "s" : ""} in cart
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => (window.location.href = "/cart")}
              >
                View Cart
              </Button>
              <Button
                size="sm"
                onClick={() => (window.location.href = "/checkout")}
              >
                Checkout
              </Button>
            </div>
          </div>
        )}

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product: Product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
                {product.isOrganic && (
                  <Badge className="absolute top-2 right-2 bg-green-600">
                    Organic
                  </Badge>
                )}
              </div>

              <CardContent className="p-4">
                <h3 className="text-lg font-semibold">{product.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {product.description}
                </p>
                <p className="text-lg font-bold mt-2">
                  ${product.price.toFixed(2)}
                </p>
              </CardContent>

              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                {cart[product.id] ? (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFromCart(product.id)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{cart[product.id]}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => addToCart(product.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => addToCart(product.id)}>
                    Add to Cart
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
