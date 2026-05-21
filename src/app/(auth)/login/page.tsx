'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';

import { Input } from '@/components/forms/Input';
import { Button } from '@/components/forms/Button';
import { supabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (formData: LoginForm) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      router.push('/');
      router.refresh();
      
    } catch (error: unknown) {
      // Safely extracting the error string to prevent runtime crashes
      const message = error instanceof Error ? error.message : 'Invalid login credentials.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-surface p-8 shadow-sm">
        
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-foreground opacity-70">
            Sign in to access your ERP portal
          </p>
        </div>

        {errorMsg && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input 
              label="Email Address" 
              type="email" 
              icon={Mail} 
              placeholder="jane@company.com" 
              error={errors.email?.message}
              {...register('email')}
            />

            <Input 
              label="Password" 
              type="password" 
              icon={Lock} 
              placeholder="••••••••" 
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign In
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-foreground opacity-70">
          Don't have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
}