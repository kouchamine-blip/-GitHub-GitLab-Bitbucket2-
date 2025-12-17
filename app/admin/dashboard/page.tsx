'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface KPIs {
  escrowFunds: number;
  grossRevenue: number;
  netRevenue: number;
  totalProducts: number;
  pendingModeration: number;
  awaitingDeposit: number;
  qualityControl: number;
  readyForPickup: number;
  totalTarinaUsers: number;
}

interface RevenueData {
  week: string;
  netRevenue: number;
}

export default function DashboardPage() {
  const { t } = useLocale();
  const [kpis, setKpis] = useState<KPIs>({
    escrowFunds: 0,
    grossRevenue: 0,
    netRevenue: 0,
    totalProducts: 0,
    pendingModeration: 0,
    awaitingDeposit: 0,
    qualityControl: 0,
    readyForPickup: 0,
    totalTarinaUsers: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
    fetchRevenueData();
  }, []);

  const fetchKPIs = async () => {
    try {
      const { data: transactions } = await supabase
        .from('orus_transactions')
        .select('montant_total, commission_plateforme, montant_vendeur_net, funds_released, status') as any;

      const escrowFunds = transactions
        ?.filter((t: any) => t.status === 'COMPLETED' && !t.funds_released)
        .reduce((sum: number, t: any) => sum + parseFloat(t.montant_vendeur_net), 0) || 0;

      const grossRevenue = transactions
        ?.filter((t: any) => t.status === 'COMPLETED')
        .reduce((sum: number, t: any) => sum + parseFloat(t.montant_total), 0) || 0;

      const netRevenue = transactions
        ?.filter((t: any) => t.status === 'COMPLETED')
        .reduce((sum: number, t: any) => sum + parseFloat(t.commission_plateforme), 0) || 0;

      const { count: totalProducts } = await supabase
        .from('orus_products')
        .select('*', { count: 'exact', head: true });

      const { count: pendingModeration } = await supabase
        .from('orus_products')
        .select('*', { count: 'exact', head: true })
        .eq('status_moderation', 'PENDING');

      const { count: awaitingDeposit } = await supabase
        .from('orus_products')
        .select('*', { count: 'exact', head: true })
        .eq('status_logistique', 'DEPOT_ATTENTE');

      const { count: qualityControl } = await supabase
        .from('orus_products')
        .select('*', { count: 'exact', head: true })
        .in('status_logistique', ['DEPOSE', 'CONTROLE_OK']);

      const { count: readyForPickup } = await supabase
        .from('orus_products')
        .select('*', { count: 'exact', head: true })
        .eq('status_logistique', 'VENDU');

      const { count: totalTarinaUsers } = await supabase
        .from('orus_subscriptions')
        .select('*', { count: 'exact', head: true });

      setKpis({
        escrowFunds,
        grossRevenue,
        netRevenue,
        totalProducts: totalProducts || 0,
        pendingModeration: pendingModeration || 0,
        awaitingDeposit: awaitingDeposit || 0,
        qualityControl: qualityControl || 0,
        readyForPickup: readyForPickup || 0,
        totalTarinaUsers: totalTarinaUsers || 0,
      });
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const { data } = await supabase
        .from('orus_transactions')
        .select('created_at, commission_plateforme')
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: true }) as any;

      const weeklyData: { [key: string]: number } = {};

      data?.forEach((transaction: any) => {
        const date = new Date(transaction.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + parseFloat(transaction.commission_plateforme);
      });

      const chartData = Object.entries(weeklyData).map(([week, netRevenue]) => ({
        week,
        netRevenue: Math.round(netRevenue * 100) / 100,
      }));

      setRevenueData(chartData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-finland-blue text-xl">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-finland-blue mb-2">{t('dashboard')}</h1>
        <p className="text-gray-600">Financial and operational overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">{t('escrowFunds')}</h3>
            <DollarSign className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-finland-blue">
            €{kpis.escrowFunds.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Funds pending release</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">{t('grossRevenue')}</h3>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-finland-blue">
            €{kpis.grossRevenue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Total processed</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-finland-blue">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">{t('netRevenue')}</h3>
            <TrendingUp className="w-8 h-8 text-finland-blue" />
          </div>
          <p className="text-3xl font-bold text-finland-blue">
            €{kpis.netRevenue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Platform commissions</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-finland-blue mb-6">
          Net Revenue Evolution (Weekly)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="netRevenue"
              stroke="#003580"
              strokeWidth={2}
              name="Net Revenue (€)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-xl font-bold text-finland-blue mb-4">Operational KPIs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-tarina-orange">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Tarina Users</h3>
              <Users className="w-6 h-6 text-tarina-orange" />
            </div>
            <p className="text-2xl font-bold text-tarina-orange">{kpis.totalTarinaUsers}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">{t('totalProducts')}</h3>
              <ShoppingBag className="w-6 h-6 text-finland-blue" />
            </div>
            <p className="text-2xl font-bold text-finland-blue">{kpis.totalProducts}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">{t('pendingModeration')}</h3>
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-finland-blue">{kpis.pendingModeration}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">{t('qualityControl')}</h3>
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-finland-blue">{kpis.qualityControl}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">{t('readyForPickup')}</h3>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-finland-blue">{kpis.readyForPickup}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
