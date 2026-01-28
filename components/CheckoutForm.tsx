'use client';

import { useEffect, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { useRouter } from 'next/navigation';
import { local } from '../lib/utils/localize';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) {
        setMessage("Something went wrong.");
        return;
      }
      
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          setTimeout(() => router.push('/'), 3000);
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/",
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Payment error");
      } else {
        setMessage("An unexpected error occurred.");
      }
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement id="payment-element" />
      </div>
      
      <button 
        disabled={isLoading || !stripe || !elements} 
        id="submit"
        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <span id="button-text" className="flex items-center justify-center">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
          ) : null}
          {isLoading ? "Processing..." : "Pay now"}
        </span>
      </button>
      
      {message && (
        <div id="payment-message" className={`mt-4 p-4 rounded-lg text-center font-medium ${
          message.includes('succeeded') || message.includes('success') 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : message.includes('error') || message.includes('failed')
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        }`}>
          {message}
        </div>
      )}
    </form>
  );
}
