// src/services/stripeService.ts - Enhanced debugging version
import { supabase } from "@/lib/supabase";
import stripePromise from "@/lib/stripe";

export interface CartItem {
  id: string;
  name?: string;
  title?: string; // Handle both name and title properties
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  image_url?: string; // Handle both image and image_url properties
}

export async function createCheckoutSession({
  products,
  userId,
  deliveryAddress,
  deliveryDate,
  orderId,
}: {
  products: CartItem[];
  userId: string;
  deliveryAddress: string;
  deliveryDate: string;
  orderId?: string;
}) {
  try {
    console.log("=== CHECKOUT DEBUG START ===");
    console.log("Creating checkout session with:", {
      productCount: products.length,
      products: products.map((p) => ({
        id: p.id,
        name: p.name || p.title,
        price: p.price,
        quantity: p.quantity,
      })),
      userId,
      hasDeliveryAddress: !!deliveryAddress,
      hasDeliveryDate: !!deliveryDate,
    });

    // Format products to ensure consistent property names
    const formattedProducts = products.map((item) => {
      const formatted = {
        id: item.id,
        name: item.name || item.title || "Unknown Product",
        description: item.description || "",
        price: item.price,
        quantity: item.quantity,
        image: item.image || item.image_url,
      };
      console.log("Formatted product:", formatted);
      return formatted;
    });

    // Direct HTTP request to the function to avoid potential issues with the Supabase SDK
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Get current auth session
    const { data: authData } = await supabase.auth.getSession();
    const accessToken = authData?.session?.access_token;

    // Create headers with auth token if available
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: anonKey,
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const requestBody = {
      products: formattedProducts,
      userId,
      deliveryAddress,
      deliveryDate,
      orderId,
    };

    console.log(
      "Request body being sent:",
      JSON.stringify(requestBody, null, 2),
    );
    console.log(
      `Making request to: ${supabaseUrl}/functions/v1/create-checkout-session`,
    );

    // Make direct fetch request to the function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-checkout-session`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      },
    );

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      // Try to get error details from response
      let errorBody;
      try {
        errorBody = await response.text();
        console.error("Function error response:", errorBody);
      } catch (e) {
        console.error("Could not parse error response");
      }

      throw new Error(
        `Function returned ${response.status}: ${errorBody || response.statusText}`,
      );
    }

    // Parse response JSON
    const data = await response.json();
    console.log("Checkout session response:", data);

    if (!data) {
      throw new Error("No data returned from checkout session function");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    console.log("=== CHECKOUT DEBUG END ===");
    // Return the data
    return data;
  } catch (error) {
    console.error("=== CHECKOUT ERROR ===");
    console.error("Error creating checkout session:", error);
    console.error("=== CHECKOUT ERROR END ===");
    throw error;
  }
}

export async function redirectToCheckout(sessionId: string) {
  try {
    const stripe = await stripePromise;
    if (!stripe) throw new Error("Stripe failed to load");

    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error redirecting to checkout:", error);
    throw error;
  }
}

export async function getOrderBySessionId(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("stripe_session_id", sessionId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
}
