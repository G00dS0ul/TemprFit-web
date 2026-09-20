'use client';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

export default function BuyXPButton({ xpAmount, priceUsd, onSuccess }) {
  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-sandbox',
    tx_ref: Date.now().toString(),
    amount: priceUsd,
    currency: 'USD',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: 'user@example.com',
      phone_number: '08102909304',
      name: 'TemprFit Athlete',
    },
    customizations: {
      title: `Buy ${xpAmount} XP`,
      description: 'Payment for TemprFit XP',
      logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const triggerPayment = () => {
    handleFlutterPayment({
      callback: (response) => {
        console.log(response);
        if (response.status === 'successful') {
          onSuccess(xpAmount);
        }
        closePaymentModal(); // this will close the modal programmatically
      },
      onClose: () => {},
    });
  };

  return (
    <button 
      onClick={triggerPayment}
      style={{
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        width: '100%'
      }}
    >
      Buy {xpAmount.toLocaleString()} XP (${priceUsd})
    </button>
  );
}
