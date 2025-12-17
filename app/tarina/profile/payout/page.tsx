'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleContext';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PayoutPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [iban, setIban] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    const requestAmount = parseFloat(amount);

    if (requestAmount > (profile?.wallet_balance || 0)) {
      setError('Insufficient balance');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('orus_payout_requests')
        .insert([
          {
            user_id: user.id,
            amount: requestAmount,
            iban: iban,
            status: 'PENDING',
          },
        ]);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        router.push('/tarina/profile');
      }, 2000);
    } catch (error) {
      console.error('Error creating payout request:', error);
      setError('Failed to create payout request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <Link
        href="/tarina/profile"
        className="inline-flex items-center space-x-2 text-tarina-amber hover:text-tarina-amber-dark mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{t('back')}</span>
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-tarina-amber rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('payoutRequest')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Available: {profile?.wallet_balance?.toFixed(2) || '0.00'}€
          </p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-lg font-semibold mb-2">
              Payout request submitted successfully!
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting to profile...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Amount (€)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                {t('iban')}
              </label>
              <input
                type="text"
                required
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="FI12 3456 7890 1234 56"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tarina-amber hover:bg-tarina-amber-dark text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? t('loading') : 'Submit Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
