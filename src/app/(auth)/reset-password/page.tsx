// src/app/(auth)/reset-password/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

import { Input } from '@/components/forms/Input';
import { Button } from '@/components/forms/Button';
import { supabase } from '@/lib/supabase';

// Validation schema ensuring the password meets security requirements and matches the confirmation
const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (formData: ResetForm) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Supabase securely updates the password for the currently authenticated session
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) throw error;

      setSuccessMsg('Password updated successfully. Redirecting to dashboard...');
      
      // Provide a brief UX pause so the user can read the success message before routing
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-surface p-8 shadow-sm">
        
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-foreground opacity-70">
            Enter your new secure password below
          </p>
        </div>

        {/* Status Messaging */}
        {errorMsg && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {successMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input 
              label="New Password" 
              type="password" 
              icon={Lock} 
              placeholder="••••••••" 
              error={errors.password?.message}
              {...register('password')}
            />

            <Input 
              label="Confirm New Password" 
              type="password" 
              icon={Lock} 
              placeholder="••••••••" 
              error={errors.confirm_password?.message}
              {...register('confirm_password')}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Update Password
          </Button>
        </form>

      </div>
    </div>
  );
}