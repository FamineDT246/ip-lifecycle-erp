// src/app/(auth)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

import { Input } from '@/components/forms/Input';
import { Button } from '@/components/forms/Button';

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    setStatus('idle');
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setStatus('success');
    setMessage('If an account exists with that email, a password reset link has been sent.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-sm">
        
        <Link href="/login" className="mb-6 flex w-fit items-center text-sm text-foreground opacity-70 transition-opacity hover:opacity-100">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Link>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="mt-2 text-sm text-foreground opacity-70">Enter your email to receive recovery instructions</p>
        </div>

        {status === 'error' && (
          <div className="mb-6 flex items-center gap-2 rounded bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="mb-6 flex items-center gap-2 rounded bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input 
            label="Email Address"
            icon={Mail}
            type="email"
            disabled={status === 'success'}
            placeholder="name@organization.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Button 
            type="submit" 
            isLoading={isSubmitting} 
            disabled={status === 'success'}
            className="w-full py-2.5 mt-2"
          >
            Send Reset Link
          </Button>
        </form>
      </div>
    </div>
  );
}