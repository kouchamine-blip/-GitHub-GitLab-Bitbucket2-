'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { supabase, OrusPayoutRequest } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { CheckCircle, XCircle } from 'lucide-react';

export default function FinancePage() {
  const { t } = useLocale();
  const { profile } = useAuth();
  const [payouts, setPayouts] = useState<(OrusPayoutRequest & { user?: { full_name: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('orus_payout_requests')
        .select(`
          *,
          user:orus_users!user_id(full_name)
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPayout = async (payoutId: string, status: 'COMPLETED' | 'REJECTED', reason?: string) => {
    if (!profile) return;

    try {
      const { error } = (await supabase
        .from('orus_payout_requests')
        .update({
          status,
          processed_at: new Date().toISOString(),
          processed_by: profile.id,
          rejection_reason: reason || null,
        })
        .eq('id', payoutId)) as any;

      if (error) throw error;

      if (status === 'COMPLETED') {
        const payout = payouts.find(p => p.id === payoutId);
        if (payout) {
          const { data: userData } = await supabase
            .from('orus_users')
            .select('wallet_balance')
            .eq('id', payout.user_id)
            .single();

          if (userData) {
            const newBalance = userData.wallet_balance - payout.amount;

            await supabase
              .from('orus_users')
              .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
              .eq('id', payout.user_id);

            await supabase
              .from('orus_wallet_transactions')
              .insert([{
                user_id: payout.user_id,
                amount: -payout.amount,
                type: 'PAYOUT',
                reference_id: payoutId,
                description: `Payout to ${payout.iban}`,
                balance_after: newBalance,
              }]);
          }
        }
      }

      fetchPayouts();
    } catch (error) {
      console.error('Error processing payout:', error);
    }
  };

  if (loading) {
    return <div className="text-finland-blue text-xl">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-finland-blue">{t('payoutRequests')}</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-finland-blue">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                {t('requestedAmount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                {t('iban')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                {t('requestDate')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payouts.map((payout) => (
              <tr key={payout.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {payout.user?.full_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  €{payout.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {payout.iban}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payout.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    payout.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    payout.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payout.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payout.requested_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {payout.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => processPayout(payout.id, 'COMPLETED')}
                        className="text-green-600 hover:text-green-900"
                        title={t('processPayout')}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason:');
                          if (reason) processPayout(payout.id, 'REJECTED', reason);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title={t('rejectPayout')}
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
