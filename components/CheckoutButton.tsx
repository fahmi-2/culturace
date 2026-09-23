'use client';

import { useState, useEffect } from 'react';

// Pastikan untuk menyesuaikan tipe props dengan kebutuhan Anda
interface CheckoutButtonProps {
  userId: number;
  eventId: number;
  amount: number;
}

export default function CheckoutButton({ userId, eventId, amount }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  // Load script Midtrans Snap saat komponen di-mount
  useEffect(() => {
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js"; // Gunakan URL sandbox untuk testing
    // Jika production gunakan: "https://app.midtrans.com/snap/snap.js"
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'YOUR_CLIENT_KEY';
    
    const script = document.createElement('script');
    script.src = snapScript;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      // 1. Panggil API internal Anda untuk membuat order dan mendapatkan token
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, eventId, amount }),
      });

      const data = await response.json();

      if (data.token) {
        // 2. Munculkan pop-up Snap Midtrans
        // @ts-ignore - mengabaikan tipe global window.snap yang belum didefinisikan
        window.snap.pay(data.token, {
          onSuccess: function (result: any) {
            console.log('Pembayaran Sukses!', result);
            alert('Pembayaran berhasil! E-Ticket akan dikirim ke email dan WhatsApp Anda.');
            // Opsional: Redirect user ke halaman sukses
          },
          onPending: function (result: any) {
            console.log('Menunggu Pembayaran', result);
            alert('Silakan selesaikan pembayaran Anda.');
          },
          onError: function (result: any) {
            console.log('Pembayaran Gagal', result);
            alert('Pembayaran gagal, silakan coba lagi.');
          },
          onClose: function () {
            console.log('Pop-up ditutup tanpa menyelesaikan pembayaran');
          },
        });
      } else {
        alert('Gagal mendapatkan token transaksi.');
      }
    } catch (error) {
      console.error('Error saat checkout:', error);
      alert('Terjadi kesalahan pada sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? 'Memproses...' : 'Beli Tiket Sekarang'}
    </button>
  );
}
