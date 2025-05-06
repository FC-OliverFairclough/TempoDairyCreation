import { useState } from "react";

// This is a mock implementation of a Stripe payment hook
// In a real application, you would use the actual Stripe SDK

interface PaymentIntent {
  id: string;
  amount: number;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "processing"
    | "succeeded"
    | "canceled";
  client_secret?: string;
}

interface PaymentMethod {
  id: string;
  type: "card";
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface StripePaymentHook {
  loading: boolean;
  error: string | null;
  paymentIntent: PaymentIntent | null;
  paymentMethod: PaymentMethod | null;
  createPaymentIntent: (amount: number) => Promise<PaymentIntent>;
  processPayment: (
    paymentMethodId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getPaymentMethods: () => Promise<PaymentMethod[]>;
}

export function useStripePayment(): StripePaymentHook {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );

  // Mock function to create a payment intent
  const createPaymentIntent = async (
    amount: number,
  ): Promise<PaymentIntent> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock response
      const mockPaymentIntent: PaymentIntent = {
        id: `pi_${Math.random().toString(36).substring(2, 15)}`,
        amount,
        status: "requires_payment_method",
        client_secret: `pi_secret_${Math.random().toString(36).substring(2, 15)}`,
      };

      setPaymentIntent(mockPaymentIntent);
      return mockPaymentIntent;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create payment intent";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Mock function to process a payment
  const processPayment = async (
    paymentMethodId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 90% success rate for demo purposes
      const isSuccessful = Math.random() > 0.1;

      if (isSuccessful) {
        // Update payment intent status
        if (paymentIntent) {
          const updatedIntent = {
            ...paymentIntent,
            status: "succeeded" as const,
          };
          setPaymentIntent(updatedIntent);
        }

        return { success: true };
      } else {
        const errorMessage = "Payment failed. Please try again.";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Payment processing failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Mock function to get saved payment methods
  const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock saved payment methods
      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: "pm_1234567890",
          type: "card",
          card: {
            brand: "visa",
            last4: "4242",
            exp_month: 12,
            exp_year: 2025,
          },
        },
        {
          id: "pm_0987654321",
          type: "card",
          card: {
            brand: "mastercard",
            last4: "5555",
            exp_month: 10,
            exp_year: 2024,
          },
        },
      ];

      // Set the first payment method as selected by default
      if (mockPaymentMethods.length > 0) {
        setPaymentMethod(mockPaymentMethods[0]);
      }

      return mockPaymentMethods;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch payment methods";
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    paymentIntent,
    paymentMethod,
    createPaymentIntent,
    processPayment,
    getPaymentMethods,
  };
}
