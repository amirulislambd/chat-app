'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '../types';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';


export default function LoginForm() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { login, token } = useAuth();

  // Route guard: if token exists, redirect to chat
  useEffect(() => {
    if (token) {
      router.replace('/');
    }
  }, [token, router]);

  // Basic validation
  const isValidPhone = phone.trim().length > 3 && /^[+\d\s-]+$/.test(phone);
  const isValidName = name.trim().length > 0;
  const isFormValid = isValidPhone && isValidName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setError(null);
    setLoading(true);

    try {
      const response = await api.login(phone.trim(), name.trim());
      // On success, store the JWT token and user object
      login(response.user, response.token);
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Login failed. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Welcome to ChatApp
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+15551234567"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={!isFormValid || loading}
          className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${!isFormValid || loading
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            } transition-colors`}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging in...
            </span>
          ) : (
            'Log in / Register'
          )}
        </button>
      </form>
    </div>
  );
}
