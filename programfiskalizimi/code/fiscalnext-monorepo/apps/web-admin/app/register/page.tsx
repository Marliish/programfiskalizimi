'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Card } from '@/components/ui';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiCheck, FiBriefcase, FiUser, FiCheckCircle } from 'react-icons/fi';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const steps = [
    { number: 1, title: 'Business Info', icon: FiBriefcase },
    { number: 2, title: 'User Info', icon: FiUser },
    { number: 3, title: 'Review', icon: FiCheckCircle },
  ];

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['businessName', 'businessType', 'nipt', 'address', 'city', 'country', 'phone'];
    } else if (step === 2) {
      fieldsToValidate = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      // Only send fields that backend accepts
      const registerData = {
        email: data.email,
        password: data.password,
        businessName: data.businessName,
        firstName: data.firstName,
        lastName: data.lastName,
        country: data.country,
      };
      
      const response = await authApi.register(registerData);
      const { user, token, tenant } = response.data;
      
      // Auto-login after successful registration
      const { useAuthStore } = await import('@/lib/store');
      useAuthStore.getState().setAuth(user, token, tenant);
      
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const formData = watch();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">FiscalNext</h1>
          <p className="text-gray-600">Create your account</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={s.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      step >= s.number
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step > s.number ? <FiCheck className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span className="text-xs mt-2 font-medium text-gray-600">{s.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-24 h-1 mx-2 transition-colors ${
                      step > s.number ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <Card className="shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Business Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Information</h2>
                
                <Input
                  label="Business Name"
                  {...register('businessName')}
                  error={errors.businessName?.message}
                  placeholder="My Store"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('businessType')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select type</option>
                    <option value="retail">Retail</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="service">Service</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.businessType && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessType.message}</p>
                  )}
                </div>

                <Input
                  label="NIPT (Tax ID)"
                  {...register('nipt')}
                  error={errors.nipt?.message}
                  placeholder="K12345678L"
                />

                <Input
                  label="Address"
                  {...register('address')}
                  error={errors.address?.message}
                  placeholder="123 Main Street"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    {...register('city')}
                    error={errors.city?.message}
                    placeholder="Tirana"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('country')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select</option>
                      <option value="AL">Albania</option>
                      <option value="XK">Kosovo</option>
                    </select>
                    {errors.country && (
                      <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                    )}
                  </div>
                </div>

                <Input
                  label="Phone Number"
                  {...register('phone')}
                  error={errors.phone?.message}
                  placeholder="+355 69 123 4567"
                />
              </div>
            )}

            {/* Step 2: User Information */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Information</h2>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    {...register('firstName')}
                    error={errors.firstName?.message}
                    placeholder="John"
                  />

                  <Input
                    label="Last Name"
                    {...register('lastName')}
                    error={errors.lastName?.message}
                    placeholder="Doe"
                  />
                </div>

                <Input
                  type="email"
                  label="Email Address"
                  {...register('email')}
                  error={errors.email?.message}
                  placeholder="john@example.com"
                />

                <Input
                  type="password"
                  label="Password"
                  {...register('password')}
                  error={errors.password?.message}
                  placeholder="••••••••"
                  helperText="At least 8 characters, with uppercase, lowercase, and number"
                />

                <Input
                  type="password"
                  label="Confirm Password"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  placeholder="••••••••"
                />

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('terms')}
                    className="mt-1 mr-2"
                  />
                  <label className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="/terms" className="text-primary-600 hover:text-primary-700">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary-600 hover:text-primary-700">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.terms && (
                  <p className="text-sm text-red-600">{errors.terms.message}</p>
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Information</h2>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Details</h3>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="font-medium text-gray-500">Business Name</dt>
                      <dd className="text-gray-900">{formData.businessName}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Type</dt>
                      <dd className="text-gray-900 capitalize">{formData.businessType}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">NIPT</dt>
                      <dd className="text-gray-900">{formData.nipt}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Phone</dt>
                      <dd className="text-gray-900">{formData.phone}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="font-medium text-gray-500">Address</dt>
                      <dd className="text-gray-900">
                        {formData.address}, {formData.city}, {formData.country === 'AL' ? 'Albania' : 'Kosovo'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">User Details</h3>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="font-medium text-gray-500">Name</dt>
                      <dd className="text-gray-900">{formData.firstName} {formData.lastName}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Email</dt>
                      <dd className="text-gray-900">{formData.email}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={prevStep}>
                  Previous
                </Button>
              )}
              
              <div className="ml-auto flex gap-3">
                {step < 3 ? (
                  <Button type="button" variant="primary" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" isLoading={loading}>
                    Create Account
                  </Button>
                )}
              </div>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}
