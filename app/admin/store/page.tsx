'use client';

import { useState } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { supabase } from '@/lib/supabase';
import { Scan } from 'lucide-react';

export default function StorePage() {
  const { t } = useLocale();
  const [code, setCode] = useState('');
  const [result, setResult] = useState('');
  const [action, setAction] = useState<'deposit' | 'quality' | 'withdrawal'>('deposit');

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult('');

    try {
      if (action === 'deposit') {
        const { data, error } = await supabase
          .from('orus_products')
          .select('*')
          .eq('deposit_code', code)
          .maybeSingle();

        if (error || !data) {
          setResult('Invalid deposit code');
          return;
        }

        await supabase
          .from('orus_products')
          .update({ status_logistique: 'DEPOSE', updated_at: new Date().toISOString() })
          .eq('id', data.id);

        setResult(`Product "${data.title}" marked as deposited`);
      } else if (action === 'quality') {
        const { data, error } = await supabase
          .from('orus_products')
          .select('*')
          .eq('deposit_code', code)
          .eq('status_logistique', 'DEPOSE')
          .maybeSingle();

        if (error || !data) {
          setResult('Invalid code or product not deposited');
          return;
        }

        await supabase
          .from('orus_products')
          .update({ status_logistique: 'CONTROLE_OK', updated_at: new Date().toISOString() })
          .eq('id', data.id);

        setResult(`Product "${data.title}" passed quality control`);
      } else if (action === 'withdrawal') {
        const { data, error } = await supabase
          .from('orus_products')
          .select('*')
          .eq('withdrawal_code', code)
          .eq('status_logistique', 'VENDU')
          .maybeSingle();

        if (error || !data) {
          setResult('Invalid withdrawal code or product not ready');
          return;
        }

        await supabase
          .from('orus_products')
          .update({ status_logistique: 'RETIRE', updated_at: new Date().toISOString() })
          .eq('id', data.id);

        setResult(`Product "${data.title}" withdrawn - Escrow funds released!`);
      }

      setCode('');
    } catch (error) {
      console.error('Error processing code:', error);
      setResult('Error processing request');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-finland-blue">{t('store')}</h1>

      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Action Type
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as any)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finland-blue"
          >
            <option value="deposit">{t('verifyDeposit')}</option>
            <option value="quality">{t('performQualityCheck')}</option>
            <option value="withdrawal">{t('processWithdrawal')}</option>
          </select>
        </div>

        <form onSubmit={handleScan} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {action === 'withdrawal' ? t('withdrawalCode') : t('depositCode')}
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finland-blue"
              placeholder="Enter code..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-finland-blue text-white rounded-lg font-medium hover:bg-finland-blue-light transition-colors flex items-center justify-center gap-2"
          >
            <Scan className="w-5 h-5" />
            {t('scanCode')}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.includes('Invalid') || result.includes('Error')
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
