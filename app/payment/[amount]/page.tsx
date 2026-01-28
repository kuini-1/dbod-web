'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faFire, faStar, faCheck, faShield, faClock } from '@fortawesome/free-solid-svg-icons';
import { API } from '@/lib/api/client';
import { local } from '@/lib/utils/localize';
import CheckoutForm from '@/components/CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51KCOVJIBPTWZxVxDDDzV4yksWDwSOkuuK5Vp3mJXAwM52EnVm4DlFSkFCk3YwbnBlu18C39giejpSpZVpXA3uBWQ00Gm7pSbbm');

export default function PaymentPage() {
  const [clientSecret, setClientSecret] = useState("");
  const params = useParams();
  const router = useRouter();
  const [donateData, setDonateData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Debug: Check what tokens we have
        const token = localStorage.getItem('authToken');
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        console.log('[Payment Page] Token in localStorage:', !!token);
        console.log('[Payment Page] Cookie exists:', !!cookies.token);
        
        // Ensure cookie is set if we have token but no cookie
        if (token && !cookies.token) {
          console.log('[Payment Page] Setting cookie from localStorage');
          document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
        }
        
        // Get user info
        const userRes = await API.get("/private");
        console.log('[Payment Page] Private endpoint status:', userRes.status);
        
        if (userRes.status === 201 || userRes.status === 200) {
          setUser(userRes.data);
          console.log('[Payment Page] User authenticated:', userRes.data.Username);
        } else {
          // If not authenticated, redirect to login
          console.error('[Payment Page] Not authenticated, redirecting to login');
          window.location.href = `/login?redirect=/payment/${params.amount}`;
        }
      } catch (err) {
        console.error('[Payment Page] Error fetching user:', err);
        window.location.href = `/login?redirect=/payment/${params.amount}`;
      } finally {
        setLoading(false);
      }
    })();
  }, [params.amount]);

  useEffect(() => {
    if (!user || loading) return;

    // Create payment intent
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('authToken') || ''}`
      },
      credentials: 'include',
      body: JSON.stringify({ 
        amount: parseInt(params.amount as string), 
        username: user.Username, 
        key: uuidv4() 
      }),
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            router.push(`/login?redirect=/payment/${params.amount}`);
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error('Failed to create payment intent:', error);
        setError('Failed to initialize payment. Please try again.');
      });

    // Fetch donation data
    (async () => {
      try {
        const infoResponse = await API.get('/donation-info');
        const res = await API.post("/donate", { id: parseInt(params.amount as string) });
        
        setDonateData({
          ...res.data,
          FirstTimeDonate: infoResponse.data.FirstTimeDonate
        });
      } catch (error: any) {
        console.error('Failed to fetch donation data:', error);
        if (error?.status === 401) {
          router.push(`/login?redirect=/payment/${params.amount}`);
        }
      }
    })();
  }, [params.amount, user, loading, router]);

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#ef4444',
      colorBackground: '#292524',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };
  const options = {
    clientSecret,
    appearance,
  };

  const Item = ({ price, baseCP, bonusCP, firstTime }: { price: number; baseCP: number; bonusCP: number; firstTime: boolean }) => {
    const eventBonusCP = bonusCP > 0 ? Math.round(baseCP * bonusCP) : 0;
    const firstTimeBonusCP = firstTime ? baseCP : 0;
    const totalCP = baseCP + eventBonusCP + firstTimeBonusCP;
    const hasBonuses = eventBonusCP > 0 || firstTimeBonusCP > 0;
    const bonusPercentage = hasBonuses 
      ? Math.round(((eventBonusCP + firstTimeBonusCP) / baseCP) * 100)
      : 0;

    return (
      <div className='group relative w-full max-w-[380px] bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] shadow-lg border-2 border-red-500/50 shadow-red-500/20'>
        {/* Animated glowing border effect */}
        <div className='absolute inset-0 bg-gradient-to-r from-red-500/30 via-red-400/30 to-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl' />
        
        <div className='relative p-6 space-y-5'>
          {/* Header: CP Display */}
          <div className='flex items-start justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='relative'>
                <FontAwesomeIcon 
                  icon={faGem} 
                  className='text-4xl text-red-400 drop-shadow-lg' 
                />
                {/* Glow effect */}
                <div className='absolute inset-0 blur-md text-red-400 opacity-50' />
              </div>
              <div className='flex flex-col'>
                <span className='text-4xl font-bold text-white leading-tight'>
                  {baseCP.toLocaleString()}
                </span>
                <span className='text-xs text-white/60'>Base CP</span>
              </div>
            </div>
            <div className='text-right'>
              <div className='text-3xl font-bold text-white mb-1'>${price}</div>
              <div className='text-xs text-white/60'>Price</div>
            </div>
          </div>

          {/* Bonuses Section */}
          {(eventBonusCP > 0 || (firstTime && firstTimeBonusCP > 0)) && (
            <div className='space-y-2 pt-3 border-t border-white/10'>
              {eventBonusCP > 0 && (
                <div className='flex items-center justify-between text-green-400 text-sm bg-green-500/10 rounded-lg px-3 py-2'>
                  <div className='flex items-center gap-2'>
                    <FontAwesomeIcon icon={faFire} className="text-xs" />
                    <span className="font-semibold">Event Bonus</span>
                  </div>
                  <span className='font-bold text-lg'>+{eventBonusCP.toLocaleString()} CP</span>
                </div>
              )}
              {firstTime && firstTimeBonusCP > 0 && (
                <div className='flex items-center justify-between text-green-400 text-sm bg-green-500/10 rounded-lg px-3 py-2'>
                  <div className='flex items-center gap-2'>
                    <FontAwesomeIcon icon={faStar} className="text-xs" />
                    <span className="font-semibold">First Time Bonus</span>
                  </div>
                  <span className='font-bold text-lg'>+{firstTimeBonusCP.toLocaleString()} CP</span>
                </div>
              )}
              {bonusPercentage > 0 && (
                <div className='text-center pt-1'>
                  <span className='text-xs text-green-400 font-bold bg-green-500/20 px-2 py-1 rounded-full'>
                    +{bonusPercentage}% BONUS!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Total CP - Prominent Display */}
          <div className='pt-4 border-t-2 border-white/20 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm text-white/70 font-semibold uppercase tracking-wide'>Total CP</span>
              <span className='text-3xl font-bold text-red-400'>
                {totalCP.toLocaleString()}
              </span>
            </div>
            {hasBonuses && (
              <div className='flex items-center gap-1 text-xs text-green-400'>
                <FontAwesomeIcon icon={faCheck} className="text-xs" />
                <span>Includes all bonuses</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-white bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 mx-auto mb-4"></div>
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-white bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-xl text-red-400 mb-4">{error}</div>
          <button 
            onClick={() => router.push('/donate')}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg font-bold text-white transition-all duration-300 cursor-pointer"
          >
            Return to Donation Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 min-h-screen duration-500 px-4 md:px-6 lg:px-8 py-8 md:py-12">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className='text-center mb-6 md:mb-8'>
          <div className="relative inline-block">
            {/* Main Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent mb-4 drop-shadow-2xl">
              Payment
            </h1>
            
            {/* Underline accent */}
            <div className="relative mx-auto mb-4">
              <div className="h-1.5 w-40 bg-gradient-to-r from-red-500 via-red-400 to-red-600 rounded-full shadow-lg mx-auto" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <FontAwesomeIcon icon={faGem} className="text-xl text-red-600 px-2" />
              </div>
            </div>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light">
              Complete your purchase to receive your Cash Points instantly
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center space-y-6">
          {clientSecret && donateData && (
            <Elements options={options} stripe={stripePromise}>
              <div className="w-full max-w-2xl space-y-6">
                {/* Package Display */}
                <div className="flex justify-center">
                  <Item 
                    price={donateData?.DonationData.price} 
                    baseCP={donateData?.DonationData.CP} 
                    bonusCP={donateData?.BonusCP || 0} 
                    firstTime={donateData?.FirstTimeDonate} 
                  />
                </div>

                {/* Payment Form */}
                <div className="w-full bg-gradient-to-br from-stone-800/95 via-stone-850/95 to-stone-900/95 backdrop-blur-md rounded-2xl p-5 md:p-6 border-2 border-white/10 shadow-2xl">
                  <div className="mb-5 text-center">
                    <h2 className="text-xl md:text-2xl font-bold mb-2 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                      Payment Details
                    </h2>
                    <p className="text-white/60 text-sm">
                      Enter your card information to complete the purchase
                    </p>
                  </div>
                  <div className="bg-stone-700/50 rounded-xl p-5 md:p-6 shadow-xl border border-white/10">
                    <CheckoutForm />
                  </div>
                </div>

                {/* Security Features */}
                <div className="flex flex-wrap justify-center gap-4 text-white/60 text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faShield} className="text-green-400" />
                    <span>Secure Payment Processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="text-green-400" />
                    <span>Instant CP Delivery</span>
                  </div>
                </div>
              </div>
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
