'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Card } from '@/components/ui';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  
  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    
    try {
      const response = await authApi.login(data.email, data.password);
      const { user, token, tenant } = response.data;
      
      setAuth(user, token, tenant);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">FiscalNext</h1>
          <p className="text-gray-600">Admin Dashboard</p>
        </div>
        
        <Card className="shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome Back</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="admin@example.com"
              {...register('email')}
              error={errors.email?.message}
            />
            
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
            
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
