export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export interface RazorpayCheckoutOptions {
  amount: number;
  eventId: string;
  ticketCount: number;
  tierTitle?: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  attendeeAddress?: string;
  onSuccess: (paymentData: {
    paymentId: string;
    orderId: string;
    signature: string;
  }) => void;
  onError: (error: any) => void;
}

export const initializeRazorpayPayment = async (options: RazorpayCheckoutOptions) => {
  try {
    const res = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: options.amount,
        eventId: options.eventId,
        ticketCount: options.ticketCount,
        tierTitle: options.tierTitle,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to create payment order');
    }

    const { orderId, amount, currency, keyId, isMock } = data;

    if (isMock) {
      // Demo Payment Flow
      setTimeout(() => {
        options.onSuccess({
          paymentId: `pay_mock_${Date.now()}`,
          orderId: orderId || `order_mock_${Date.now()}`,
          signature: 'sig_mock_verified',
        });
      }, 800);
      return;
    }

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
    }

    const razorpayOptions = {
      key: keyId,
      amount: amount,
      currency: currency || 'INR',
      name: 'FANMEET',
      description: `Fanmeet Event Booking (${options.ticketCount} tickets)`,
      order_id: orderId,
      prefill: {
        name: options.attendeeName,
        email: options.attendeeEmail,
        contact: options.attendeePhone,
      },
      theme: {
        color: '#000000',
      },
      handler: function (response: any) {
        options.onSuccess({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: function () {
          options.onError(new Error('Payment window closed'));
        },
      },
    };

    const rzp = new (window as any).Razorpay(razorpayOptions);
    rzp.open();
  } catch (err: any) {
    options.onError(err);
  }
};
