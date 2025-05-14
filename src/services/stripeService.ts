import { supabase } from "@/lib/supabase";
import stripePromise from "@/lib/stripe";

export interface CartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
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
      products,
      userId,
      deliveryAddress,
      deliveryDate,
    });

    // Direct fetch to the edge function URL instead of using the invoke method
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          products,
          userId,
          deliveryAddress,
          deliveryDate,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
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
