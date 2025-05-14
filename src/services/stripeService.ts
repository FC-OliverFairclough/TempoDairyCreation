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
    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          products,
          userId,
          deliveryAddress,
          deliveryDate,
        },
      },
    );

    if (error) throw new Error(error.message);
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
