'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2 } from 'lucide-react';

import { Input } from '@/components/forms/Input';
import { Button } from '@/components/forms/Button';
import { supabase } from '@/lib/supabase';

const createSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  creator_id: z.string().min(1, 'Please select an owner'),
});

type CreateForm = z.infer<typeof createSchema>;

interface CreateIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateIPModal({ isOpen, onClose, onSuccess }: CreateIPModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        const { data } = await supabase
          .from('users')
          .select('id, display_name, company_name')
          .is('deleted_at', null)
          .order('display_name', { ascending: true });
        
        setUsers(data || []);
        setIsLoadingUsers(false);
      };
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: CreateForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('intellectual_properties')
        .insert({
          title: data.title,
          description: data.description,
          creator_id: data.creator_id,
          status: 'pending'
        });

      if (dbError) throw dbError;

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to create IP record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Create New Master IP</h2>
          <button onClick={onClose} className="text-foreground opacity-50 transition-colors hover:text-foreground hover:opacity-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <Input 
            label="Project Title" 
            placeholder="Enter the official IP designation" 
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-foreground">
              Project Owner
            </label>
            <div className="relative">
              <select
                className={`w-full appearance-none rounded-md border bg-background px-4 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                  errors.creator_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-border'
                }`}
                {...register('creator_id')}
                disabled={isLoadingUsers}
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.display_name || 'Unnamed User'} {user.company_name ? `(${user.company_name})` : ''}
                  </option>
                ))}
              </select>
              {isLoadingUsers && (
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                </div>
              )}
            </div>
            {errors.creator_id && (
              <p className="text-xs text-red-500">{errors.creator_id.message}</p>
            )}
            <p className="text-xs text-foreground opacity-50">
              Select the user who will own this IP. You can only select active users.
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-foreground">Description (Optional)</label>
            <textarea 
              className="min-h-[100px] w-full resize-y rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Brief summary of the project..."
              {...register('description')}
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 border-t border-border pt-4">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Record
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}