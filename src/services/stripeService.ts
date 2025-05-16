// src/services/stripeService.ts
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

    // Get the Supabase URL from environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("VITE_SUPABASE_URL is not defined");
    }

    // Get the current session for authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Create headers object with or without auth token
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header if session exists
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    } else {
      console.warn("No authenticated session found");
    }

    console.log(
      "Sending request to:",
      `${supabaseUrl}/functions/v1/create-checkout-session`,
    );
    console.log("With headers:", Object.keys(headers));

    // Format products to ensure consistent property names
    const formattedProducts = products.map((item) => ({
      id: item.id,
      name: item.name || item.title || "Unknown Product",
      description: item.description || "",
      price: item.price,
      quantity: item.quantity,
      image: item.image || item.image_url,
    }));

    // Use the Supabase client to invoke the function
    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          products: formattedProducts,
          userId,
          deliveryAddress,
          deliveryDate,
        },
      },
    );

    // This code has been moved inside the try/catch block above
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
