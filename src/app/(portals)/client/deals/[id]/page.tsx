import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DealRoomWorkspace } from '@/components/deals/DealRoomWorkspace';
import { Container } from '@/components/ui/Container';

export default async function ClientDealRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const dealId = resolvedParams.id;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'buyer' && profile?.role !== 'creator') {
    redirect('/client');
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Secure Deal Room</h1>
        <p className="mt-1 text-sm text-foreground opacity-70">
          Review your licensing terms and communicate with your IP Vault representative.
        </p>
      </div>

      <DealRoomWorkspace 
        dealId={dealId} 
        currentUserRole={profile.role} 
        currentUserId={session.user.id} 
      />
    </Container>
  );
}