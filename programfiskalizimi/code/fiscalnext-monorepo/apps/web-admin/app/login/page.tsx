'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await authApi.login(email, password);
      const { user, token, tenant } = response.data;
      
      setAuth(user, token, tenant);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  const useDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">FiscalNext</h1>
          <p className="text-gray-600">Admin Dashboard</p>
        </div>
        
        <Card className="shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome Back</h2>

          {/* Demo Credentials */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">📋 Demo Credentials</p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => useDemoCredentials('owner@demo.com')}
                className="w-full text-left p-2 bg-white rounded hover:bg-blue-100 transition-colors"
              >
                <strong>Owner:</strong> owner@demo.com / password123
              </button>
              <button
                type="button"
                onClick={() => useDemoCredentials('manager@demo.com')}
                className="w-full text-left p-2 bg-white rounded hover:bg-blue-100 transition-colors"
              >
                <strong>Manager:</strong> manager@demo.com / password123
              </button>
            </div>
            <p className="text-xs text-blue-700 mt-2">Click to auto-fill credentials</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <a href="/forgot-password" className="text-primary-600 hover:text-primary-700">
                Forgot password?
              </a>
            </div>
            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full"
              disabled={loading}
            >
              Sign In
            </Button>
          </form>
          
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </a>
          </p>
        </Card>
        
        <p className="text-center text-xs text-gray-500 mt-6">
          © 2026 FiscalNext. All rights reserved.
        </p>
      </div>
    </div>
  );
}
