// src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Mail, Lock, User, Phone, Briefcase } from 'lucide-react';

import { Input } from '@/components/forms/Input';
import { Button } from '@/components/forms/Button';
import { supabase } from '@/lib/supabase';

// 1. The Validation Schema (Locked down and syntax corrected)
const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  company_name: z.string().min(2, 'Company name is required for B2B accounts'),
  phone_number: z.string().optional(),
  // Zod Enum syntax fix, restricted to external roles ONLY
  role: z.enum(['buyer', 'creator'], {
    message: 'Please select an account role',
  }),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'buyer', // Safe default
    }
  });

  const onSubmit = async (formData: RegisterForm) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 2. The Supabase Auth Call with Metadata Payload
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role, 
            company_name: formData.company_name,
            phone_number: formData.phone_number,
          },
        },
      });

      if (error) throw error;

      // If email confirmation is turned off in Supabase, data.session will exist
      if (data.session) {
        router.push('/ops-admin'); // We can redirect to a specific buyer portal later
      } else {
        // If email confirmation is ON, tell them to check their inbox
        setSuccessMsg('Registration successful! Please check your email to verify your account.');
      }
      
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-surface p-8 shadow-sm">
        
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-foreground opacity-70">
            Join the IP Lifecycle ERP platform
          </p>
        </div>

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

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="space-y-4">
            <Input 
              label="Full Name" 
              icon={User} 
              placeholder="Jane Doe" 
              error={errors.full_name?.message}
              {...register('full_name')}
            />

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

          <div className="my-6 border-t border-border" />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Organization Details</h3>
            
            <Input 
              label="Company Name" 
              icon={Building2} 
              placeholder="Acme Corp" 
              error={errors.company_name?.message}
              {...register('company_name')}
            />

            <Input 
              label="Phone Number (Optional)" 
              type="tel" 
              icon={Phone} 
              placeholder="+1 (555) 000-0000" 
              error={errors.phone_number?.message}
              {...register('phone_number')}
            />
            
          </div>

          <Button type="submit" className="w-full mt-6" isLoading={isSubmitting}>
            Register Account
          </Button>

        </form>

        <p className="mt-4 text-center text-sm text-foreground opacity-70">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in here
          </Link>
        </p>

      </div>
    </div>
  );
}