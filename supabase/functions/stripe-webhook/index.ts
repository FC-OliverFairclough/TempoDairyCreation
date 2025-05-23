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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

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
      const productsData = session.metadata.products_data;
      const orderId = session.metadata.order_id;

      console.log("Processing completed checkout session");
      console.log("User ID:", userId);
      console.log("Products data:", productsData);

      try {
        // First check if we have an order ID in the metadata
        let existingOrder = null;
        let findError = null;

        if (orderId) {
          // Try to find the order by ID from metadata
          const orderResult = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

          existingOrder = orderResult.data;
          findError = orderResult.error;
        }

        // If no order found by ID, try to find by session ID
        if (!existingOrder) {
          const sessionResult = await supabase
            .from("orders")
            .select("*")
            .eq("stripe_session_id", session.id)
            .single();

          existingOrder = sessionResult.data;
          findError = sessionResult.error;
        }

        if (findError || !existingOrder) {
          console.log("No existing order found, creating new one");

          // Create a new order record if none exists
          const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
              user_id: userId,
              delivery_address: deliveryAddress,
              delivery_date: deliveryDate,
              delivery_status: "completed",
              payment_status: "paid",
              total_amount: session.amount_total / 100, // Convert from cents
              payment_method: "card",
              stripe_session_id: session.id,
              payment_intent_id: session.payment_intent,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (orderError) {
            console.error("Error creating order:", orderError);
            throw orderError;
          }

          console.log("Order created:", order.id);

          // Create order items if products data is available
          if (productsData) {
            try {
              const products = JSON.parse(productsData);
              console.log("Parsed products:", products);

              const orderItems = products.map((product) => ({
                order_id: order.id,
                product_id: product.id,
                quantity: Number(product.quantity) || 1,
                price: Number(product.price) || 0,
                subtotal:
                  (Number(product.price) || 0) *
                  (Number(product.quantity) || 1),
                created_at: new Date().toISOString(),
              }));

              const { data: insertedItems, error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItems)
                .select();

              if (itemsError) {
                console.error("Error creating order items:", itemsError);
              } else {
                console.log(
                  `Successfully created ${insertedItems?.length || 0} order items:`,
                  insertedItems,
                );
              }
            } catch (parseError) {
              console.error("Error parsing products data:", parseError);
            }
          }
        } else {
          console.log("Updating existing order:", existingOrder.id);

          // Update the existing order to completed status
          const { data: updatedOrder, error: updateError } = await supabase
            .from("orders")
            .update({
              delivery_status: "completed",
              payment_status: "paid",
              payment_intent_id: session.payment_intent,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingOrder.id)
            .select();

          if (updateError) {
            console.error("Error updating order:", updateError);
          } else {
            console.log(
              "Order updated successfully to completed status:",
              updatedOrder,
            );
          }

          // Check if order items already exist
          const { data: existingItems, error: itemsCheckError } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", existingOrder.id);

          if (itemsCheckError) {
            console.error(
              "Error checking existing order items:",
              itemsCheckError,
            );
          } else if (!existingItems || existingItems.length === 0) {
            console.log("No existing order items found, creating them");

            // Create order items if they don't exist and products data is available
            if (productsData) {
              try {
                const products = JSON.parse(productsData);
                console.log("Parsed products for existing order:", products);

                const orderItems = products.map((product) => ({
                  order_id: existingOrder.id,
                  product_id: product.id,
                  quantity: Number(product.quantity) || 1,
                  price: Number(product.price) || 0,
                  subtotal:
                    (Number(product.price) || 0) *
                    (Number(product.quantity) || 1),
                  created_at: new Date().toISOString(),
                }));

                const { data: insertedItems, error: itemsError } =
                  await supabase
                    .from("order_items")
                    .insert(orderItems)
                    .select();

                if (itemsError) {
                  console.error(
                    "Error creating order items for existing order:",
                    itemsError,
                  );
                } else {
                  console.log(
                    `Successfully created ${insertedItems?.length || 0} order items for existing order:`,
                    insertedItems,
                  );
                }
              } catch (parseError) {
                console.error(
                  "Error parsing products data for existing order:",
                  parseError,
                );
              }
            }
          } else {
            console.log("Order items already exist:", existingItems.length);
          }
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
