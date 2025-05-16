// supabase/functions/stripe-webhook/index.ts
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
    console.log("Webhook received");

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
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
    console.log(
      "Webhook body received (truncated):",
      body.substring(0, 200) + "...",
    );

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not defined");
      throw new Error("Stripe API key is not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Verify webhook signature
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!endpointSecret) {
      console.warn(
        "STRIPE_WEBHOOK_SECRET is not defined, skipping signature verification",
      );
    }

    let event;
    try {
      if (endpointSecret) {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
      } else {
        // Parse event without verification for testing
        event = JSON.parse(body);
      }
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase environment variables not defined");
      throw new Error("Database connection is not configured");
    }

    console.log("Creating Supabase client");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle the event
    console.log(`Processing webhook event type: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Extract metadata
      const userId = session.metadata.user_id;
      const deliveryAddress = session.metadata.delivery_address;
      const deliveryDate = session.metadata.delivery_date;

      console.log("Creating order from completed checkout session");

      try {
        // Create a new order record
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: userId,
            delivery_address: deliveryAddress,
            delivery_date: deliveryDate,
            order_status: "confirmed",
            payment_status: "paid",
            total_amount: session.amount_total / 100, // Convert from cents
            payment_method: "card",
            stripe_session_id: session.id,
            payment_intent_id: session.payment_intent,
          })
          .select()
          .single();

        if (orderError) {
          console.error("Error creating order:", orderError);
          throw orderError;
        }

        console.log("Order created:", order.id);

        // If line items are available, create order items
        if (session.line_items?.data) {
          const orderItems = session.line_items.data.map((item) => ({
            order_id: order.id,
            product_id: item.price?.product || "unknown", // This might need adjustment
            quantity: item.quantity,
            price: item.amount_total / 100 / item.quantity,
          }));

          const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems);

          if (itemsError) {
            console.error("Error creating order items:", itemsError);
            // Note: We don't throw here to avoid failing the webhook
          } else {
            console.log("Order items created");
          }
        } else {
          console.log(
            "No line items available in webhook, cannot create order items",
          );
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        // We don't want to cause a 500 error for Stripe, so we log but return success
      }
    }

    // Return a success response to Stripe
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
