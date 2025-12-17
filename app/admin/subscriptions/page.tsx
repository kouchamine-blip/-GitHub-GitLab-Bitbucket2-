'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Download, Search, Filter } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface Subscription {
  id: string;
  serial_number: number;
  user_id: string;
  email: string;
  full_name: string;
  subscription_date: string;
  subscription_time: string;
  platform: string;
  created_at: string;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('ALL');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      const { data, error, count } = await supabase
        .from('orus_subscriptions')
        .select('*', { count: 'exact' })
        .order('serial_number', { ascending: false });

      if (error) throw error;

      setSubscriptions(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.serial_number.toString().includes(searchTerm);

    const matchesPlatform =
      filterPlatform === 'ALL' || sub.platform === filterPlatform;

    return matchesSearch && matchesPlatform;
  });

  const exportToCSV = () => {
    const headers = [
      'Serial Number',
      'Full Name',
      'Email',
      'Subscription Date',
      'Subscription Time',
      'Platform',
    ];
    const csvData = filteredSubscriptions.map((sub) => [
      sub.serial_number,
      sub.full_name,
      sub.email,
      sub.subscription_date,
      sub.subscription_time,
      sub.platform,
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-tarina-orange text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscriptions</h1>
            <p className="text-gray-600">
              Total Tarina Users: <span className="font-bold text-tarina-orange">{totalCount}</span>
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-tarina-orange hover:bg-tarina-orange-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or serial number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tarina-orange focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tarina-orange focus:border-transparent appearance-none"
              >
                <option value="ALL">All Platforms</option>
                <option value="TARINA">Tarina</option>
                <option value="WEB">Web</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Serial #</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Full Name</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Time</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Platform</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-mono font-semibold text-tarina-orange">
                          #{sub.serial_number}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {sub.full_name}
                      </td>
                      <td className="py-4 px-4 text-gray-600">{sub.email}</td>
                      <td className="py-4 px-4 text-gray-600">
                        {formatDate(sub.subscription_date)}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {formatTime(sub.subscription_time)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-tarina-orange/10 text-tarina-orange">
                          {sub.platform}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredSubscriptions.length} of {totalCount} total subscriptions
          </div>
        </div>
      </div>
    </div>
  );
}
