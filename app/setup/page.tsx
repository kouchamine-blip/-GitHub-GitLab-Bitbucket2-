'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: 'admin@orus.fi',
    password: '',
    fullName: 'System Administrator',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult({});

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: data.message });
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setResult({ error: data.error });
      }
    } catch (error) {
      setResult({ error: 'Failed to create admin account' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-finland-blue px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-finland-blue mb-2">ORUS Setup</h1>
          <p className="text-gray-600">Create your admin account</p>
        </div>

        {result.success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {result.message}
            <br />
            <span className="text-sm">Redirecting to login...</span>
          </div>
        )}

        {result.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {result.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finland-blue"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finland-blue"
              placeholder="admin@orus.fi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finland-blue"
              placeholder="Strong password (min 6 chars)"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-finland-blue text-white rounded-lg font-medium hover:bg-finland-blue-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
          <p className="font-medium mb-2">Note:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>This creates an account with ADMIN role</li>
            <li>Full access to all back-office features</li>
            <li>Password must be at least 6 characters</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
