'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { supabase } from '@/lib/supabase';
import { Copy } from 'lucide-react';

interface TransactionWithDetails {
  id: string;
  montant_total: number;
  commission_plateforme: number;
  montant_vendeur_net: number;
  status: string;
  funds_released: boolean;
  created_at: string;
  product: {
    listing_serial: string;
    status_logistique: string;
    deposit_code: string;
  };
  buyer: {
    full_name: string;
    email: string;
  };
  seller: {
    full_name: string;
    email: string;
  };
}

export default function TransactionsPage() {
  const { t } = useLocale();
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('orus_transactions')
        .select(`
          *,
          product:orus_products!product_id(listing_serial, status_logistique, deposit_code),
          buyer:orus_users!buyer_id(full_name, email),
          seller:orus_users!seller_id(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyDepositCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getLogisticsStatusLabel = (status: string) => {
    switch (status) {
      case 'DEPOT_ATTENTE':
        return 'En attente de dépôt';
      case 'DEPOSE':
        return 'En attente de retrait';
      case 'RETIRE':
        return 'Récupéré';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-finland-blue text-xl">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-finland-blue">{t('transactions')}</h1>

      <div className="grid gap-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-finland-blue">
                  Transaction #{transaction.product?.listing_serial || 'N/A'}
                </h3>
                <p className="text-xs text-gray-500 font-mono">{transaction.id}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-finland-blue">
                  €{transaction.montant_total.toFixed(2)}
                </p>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  transaction.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {transaction.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Vendeur</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.seller?.full_name}</p>
                  <p className="text-xs text-gray-600">{transaction.seller?.email}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Acheteur</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.buyer?.full_name}</p>
                  <p className="text-xs text-gray-600">{transaction.buyer?.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Montants</p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission:</span>
                      <span className="font-semibold text-finland-blue">
                        €{transaction.commission_plateforme.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net Vendeur:</span>
                      <span className="font-semibold text-green-600">
                        €{transaction.montant_vendeur_net.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Fonds</p>
                  <p className="text-sm">
                    {transaction.funds_released ? (
                      <span className="text-green-600 font-medium">✓ Libérés</span>
                    ) : (
                      <span className="text-yellow-600 font-medium">⏳ En Escrow</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Statut Logistique</p>
                  <span className={`inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full ${
                    transaction.product?.status_logistique === 'RETIRE' ? 'bg-green-100 text-green-800' :
                    transaction.product?.status_logistique === 'DEPOSE' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getLogisticsStatusLabel(transaction.product?.status_logistique || '')}
                  </span>
                </div>

                {transaction.product?.deposit_code && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Code de Dépôt</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-lg font-mono font-bold text-finland-blue">
                        {transaction.product.deposit_code}
                      </span>
                      <button
                        onClick={() => copyDepositCode(transaction.product.deposit_code)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Copy className={`w-4 h-4 ${
                          copiedCode === transaction.product.deposit_code
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune transaction trouvée
        </div>
      )}
    </div>
  );
}
