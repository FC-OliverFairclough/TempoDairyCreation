// supabase/functions/create-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";
import Stripe from "https://esm.sh/stripe@13.10.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const { products, userId, deliveryAddress, deliveryDate, orderId } =
      await req.json();

    // Validate request data
    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid products data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not defined");
      return new Response(
        JSON.stringify({ error: "Stripe key is not configured" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Calculate total amount
    const totalAmount = products.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );

    // Get origin for success/cancel URLs
    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Create Stripe checkout session
    const lineItems = products.map((product) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name || product.title || "Product",
          description: product.description || "",
          images: product.image ? [product.image] : [],
          metadata: {
            product_id: product.id, // Store the product ID in metadata
          },
        },
        unit_amount: Math.round(Number(product.price) * 100), // Convert to cents
      },
      quantity: Number(product.quantity) || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: {
        user_id: userId,
        delivery_address: deliveryAddress,
        delivery_date: deliveryDate,
        // Store products data as JSON string for webhook processing
        products_data: JSON.stringify(products),
        order_id: orderId || "",
      },
    });

    // Initialize Supabase client
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY");

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (orderId) {
          // If orderId is provided, update the existing order with stripe session id
          const { data: updatedOrder, error: updateError } = await supabase
            .from("orders")
            .update({
              stripe_session_id: session.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .select()
            .single();

          if (updateError) {
            console.error(
              "Failed to update order with session ID:",
              updateError,
            );
          } else {
            console.log("Order updated with session ID:", updatedOrder.id);
          }
        } else {
          // If no orderId, create a new order (fallback)
          const { data: order, error } = await supabase
            .from("orders")
            .insert({
              user_id: userId,
              delivery_address: deliveryAddress,
              delivery_date: deliveryDate,
              total_amount: totalAmount,
              delivery_status: "processing",
              payment_status: "pending",
              stripe_session_id: session.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            console.error("Failed to insert order into database:", error);
          } else {
            console.log("Order created successfully:", order.id);

            // Insert order items with all required fields
            const orderItems = products.map((product) => ({
              order_id: order.id,
              product_id: product.id,
              quantity: Number(product.quantity) || 1,
              price: Number(product.price) || 0,
              subtotal:
                (Number(product.price) || 0) * (Number(product.quantity) || 1),
              created_at: new Date().toISOString(),
            }));

            console.log("Inserting order items:", orderItems);

            const { data: insertedItems, error: itemsError } = await supabase
              .from("order_items")
              .insert(orderItems)
              .select();

            if (itemsError) {
              console.error("Error creating order items:", itemsError);
            } else {
              console.log(
                `Successfully inserted ${insertedItems?.length || 0} order items:`,
                insertedItems,
              );
            }
          }
        }
      } else {
        console.warn(
          "Supabase credentials not found, skipping database insert",
        );
      }
    } catch (dbError) {
      // Log database error but don't fail the function
      console.error("Database operation failed:", dbError);
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        success: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
