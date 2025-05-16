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
  console.log("Function invoked. Method:", req.method);

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    // Log basic request info
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));

    // Get environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    console.log("Environment variables:", {
      hasStripeKey: !!stripeKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
    });

    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Database connection variables not configured");
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const { products, userId, deliveryAddress, deliveryDate } = requestData;

    console.log("Request payload summary:", {
      productCount: products?.length,
      userId,
      hasAddress: !!deliveryAddress,
      hasDate: !!deliveryDate,
    });

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
    console.log("Initializing Stripe...");
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Create Supabase client with console logs for debugging
    console.log(`Creating Supabase client with URL: ${supabaseUrl}`);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // SIMPLIFIED APPROACH: Skip database operations and go directly to Stripe
    console.log(
      "Skipping database operations and going directly to Stripe checkout",
    );

    // Calculate total amount
    const totalAmount = products.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );

    console.log("Total amount:", totalAmount);

    // Get origin for success/cancel URLs
    const origin = req.headers.get("origin") || "http://localhost:5173";
    console.log("Using origin:", origin);

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

    console.log(`Creating Stripe session with ${lineItems.length} line items`);

    try {
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

      console.log("Stripe session created:", session.id);

      // Return both sessionId and url
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
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
      return new Response(
        JSON.stringify({
          error: "Failed to create Stripe checkout session",
          details: stripeError.message,
          success: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
