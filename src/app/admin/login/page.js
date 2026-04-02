'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/admin');
      } else {
        setError('Invalid credentials');
      }
    } catch {
      setError('Login failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Red Top Scoopers" width={80} height={80} className="mx-auto mb-4 rounded-full shadow-md animate-fade-in-down" />
          <h1 className="font-heading text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-500">Red Top Scoopers Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-secondary w-full text-center disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6">
          <a href="/" className="text-sm text-gray-400 hover:text-brand-green transition-colors">
            ← Back to website
          </a>
        </p>
      </div>
    </div>
  );
}
