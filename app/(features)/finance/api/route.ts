import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { systemClient } from '@/lib/supabase/system';

export async function GET() {
  try {
    const session = await getSession();

    // Query the "dashboard_ledger" view using the System Client
    const { data, error } = await systemClient
      .schema('finance')
      .from('dashboard_ledger')
      .select('*')
      .eq('workspace_id', session.workspace.id) // <--- CRITICAL: Manually enforce the workspace filter
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Finance API Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
