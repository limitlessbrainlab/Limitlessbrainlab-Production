/**
 * Payment Gateway Service
 * Handles all payments via Stripe (unified payment gateway)
 */

import StripeService from './stripeService';
import toast from 'react-hot-toast';

class PaymentGatewayService {
  constructor() {
    this.userLocation = null;
  }

  // Detect user location and currency
  async detectLocation() {
    try {
      // Check cache first
      const cached = sessionStorage.getItem('userPaymentLocation');
      if (cached) {
        const data = JSON.parse(cached);
        // Cache for 1 hour
        if (Date.now() - data.timestamp < 3600000) {
          this.userLocation = data;
          return data;
        }
      }

      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const countryCode = data.country_code;

      // Get currency config from Stripe service
      const stripeConfig = StripeService.getCurrencyConfig(countryCode);

      const locationData = {
        country: countryCode,
        countryName: data.country_name,
        city: data.city,
        currency: stripeConfig.currency,
        symbol: stripeConfig.symbol,
        multiplier: stripeConfig.multiplier,
        timestamp: Date.now()
      };

      // Cache the result
      sessionStorage.setItem('userPaymentLocation', JSON.stringify(locationData));

      this.userLocation = locationData;


      return locationData;
    } catch (error) {
      console.warn('Location detection failed, defaulting to USD');

      const defaultLocation = {
        country: 'US',
        currency: 'USD',
        symbol: '$',
        multiplier: 1,
        timestamp: Date.now()
      };

      this.userLocation = defaultLocation;

      return defaultLocation;
    }
  }

  // Get current location (cached or fresh)
  async getLocation() {
    if (!this.userLocation) {
      await this.detectLocation();
    }
    return this.userLocation;
  }

  // Check if Stripe is available
  isGatewayAvailable() {
    return StripeService.isAvailable();
  }

  // Get subscription packages with localized pricing
  async getSubscriptionPackages() {
    const location = await this.getLocation();

    // Return Stripe packages with localized currency
    return StripeService.getSubscriptionPackages(location.currency, location.multiplier)
      .map(pkg => ({
        ...pkg,
        symbol: location.symbol,
        gateway: 'stripe'
      }));
  }

  // Process subscription payment via Stripe
  async processSubscriptionPayment(tierData, userInfo, callbacks = {}) {

    try {
      // Do NOT gate on the frontend publishable key here. Checkout is created
      // by the backend (which holds the secret key) and returns a redirect URL,
      // exactly like the frequency/meditation flows. Gating on the frontend key
      // caused subscription purchases to fall back to the inquiry form whenever
      // VITE_STRIPE_PUBLISHABLE_KEY was absent in the deployed build.
      callbacks.onProcessing?.();

      // Create checkout session and redirect
      await StripeService.processSubscriptionPayment(tierData, userInfo);

      // Note: User will be redirected to Stripe Checkout
      // Success/failure will be handled via redirect URLs
      return {
        success: true,
        gateway: 'stripe',
        redirected: true
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      callbacks.onError?.(error);
      throw error;
    }
  }

  // Handle payment success callback (after redirect from Stripe)
  async handlePaymentSuccess(params, userEmail) {
    const { payment, tier, session_id } = params;

    if (payment === 'success' && tier) {
      // Verify and update subscription
      if (session_id) {
        try {
          // verify-session performs the FULL authoritative grant server-side
          // (patients tier/status/dashboard_access + payment rows + emails,
          // idempotent on session id). Don't also write payment_history from
          // the client here — that inserted a second row without the session
          // id, duplicating the payment in admin Payment History.
          const verification = await StripeService.verifyPaymentSuccess(session_id);
          if (verification.success) {
            return { success: true, tier, gateway: 'stripe' };
          }
        } catch (error) {
          console.error('Stripe verification failed:', error);
        }
      }

      // Generic success (subscription already updated by webhook)
      return { success: true, tier };
    }

    return { success: false };
  }

  // Format price for display
  formatPrice(amount, currency) {
    const location = this.userLocation || { symbol: '$' };

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || location.currency || 'USD'
      }).format(amount);
    } catch {
      return `${location.symbol}${amount}`;
    }
  }

  // Get available payment methods
  async getAvailablePaymentMethods() {
    const location = await this.getLocation();
    const methods = [];

    if (StripeService.isAvailable()) {
      methods.push({
        id: 'stripe',
        name: 'Credit/Debit Card',
        description: 'Pay securely with your card',
        icon: 'credit-card',
        currency: location.currency
      });
    }

    return methods;
  }

  // Open customer portal for managing subscriptions
  async openCustomerPortal(customerEmail) {
    try {
      const session = await StripeService.createCustomerPortalSession(customerEmail);
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      toast.error('Unable to open subscription management. Please try again.');
      throw error;
    }
  }
}

export default new PaymentGatewayService();
