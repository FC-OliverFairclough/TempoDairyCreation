import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";
import Stripe from "https://esm.sh/stripe@13.10.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Get the raw body
    const body = await req.text();

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verify webhook signature
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({
          error: `Webhook signature verification failed: ${err.message}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata.order_id;

        // Update order status in database
        const { error } = await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            order_status: "confirmed",
            payment_intent_id: session.payment_intent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (error) {
          console.error("Error updating order:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update order status" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500,
            },
          );
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const sessionId = paymentIntent.metadata?.checkout_session_id;

        if (sessionId) {
          // Find the order with this session ID
          const { data: orders, error: findError } = await supabase
            .from("orders")
            .select("id")
            .eq("stripe_session_id", sessionId)
            .limit(1);

          if (findError || !orders || orders.length === 0) {
            console.error(
              "Error finding order:",
              findError || "No order found",
            );
          } else {
            // Update order status
            const { error } = await supabase
              .from("orders")
              .update({
                payment_status: "failed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", orders[0].id);

            if (error) {
              console.error("Error updating order status:", error);
            }
          }
        }
        break;
      }
      // Add other event types as needed
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
