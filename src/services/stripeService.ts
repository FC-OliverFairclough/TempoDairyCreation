// src/services/stripeService.ts - Improved error handling
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
}: {
  products: CartItem[];
  userId: string;
  deliveryAddress: string;
  deliveryDate: string;
}) {
  try {
    console.log("Creating checkout session with:", {
      productCount: products.length,
      userId,
      hasDeliveryAddress: !!deliveryAddress,
      hasDeliveryDate: !!deliveryDate,
    });

    // Format products to ensure consistent property names
    const formattedProducts = products.map((item) => ({
      id: item.id,
      name: item.name || item.title || "Unknown Product",
      description: item.description || "",
      price: item.price,
      quantity: item.quantity,
      image: item.image || item.image_url,
    }));

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

    console.log(
      `Making direct request to: ${supabaseUrl}/functions/v1/create-checkout-session`,
    );

    // Make direct fetch request to the function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-checkout-session`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          products: formattedProducts,
          userId,
          deliveryAddress,
          deliveryDate,
        }),
      },
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

    if (!data) {
      throw new Error("No data returned from checkout session function");
    }

    console.log("Checkout session response:", data);

    if (data.error) {
      throw new Error(data.error);
    }

    // Return the data
    return data;
  } catch (error) {
    console.error("Error creating checkout session:", error);
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
