import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DealRoomWorkspace } from '@/components/deals/DealRoomWorkspace';
import { Container } from '@/components/ui/Container';

export default async function SalesDealRoomPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (profile?.role !== 'sales_rep' && profile?.role !== 'ops_admin') {
    redirect('/sales-crm');
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Sales Deal Room</h1>
        <p className="mt-1 text-sm text-foreground opacity-70">
          Manage negotiations, upload contracts, and close the deal.
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