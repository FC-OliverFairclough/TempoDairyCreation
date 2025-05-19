// supabase/functions/create-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.10.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const { products, userId, deliveryAddress, deliveryDate } =
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
      },
    });

    // Initialize Supabase client
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY");

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Insert order into database
        const { data: order, error } = await supabase
          .from("orders")
          .insert({
            user_id: userId,
            delivery_address: deliveryAddress,
            delivery_date: deliveryDate,
            total_amount: totalAmount,
            order_status: "pending",
            payment_status: "unpaid",
            stripe_session_id: session.id,
          })
          .select()
          .single();

        if (error) {
          // Log error but continue
          console.error("Failed to insert order into database:", error);
        } else {
          console.log("Order created successfully:", order.id);
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
