import { loadStripe } from "@stripe/stripe-js";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
    "pk_test_51ROJ8B2KtqBELzH4RwsGlULovNT0ucKNq4iippkxztSAYTSSKv2OiuMDlFu3CdNGS3gRjERTzrLKoRQCJnxNHHbd009mKtAUUh",
);

export default stripePromise;
