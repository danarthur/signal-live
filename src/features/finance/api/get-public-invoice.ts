/**
 * Finance feature – Fetch public invoice by token (client payment portal)
 * Uses system client to bypass RLS; only returns data for matching token.
 * @module features/finance/api/get-public-invoice
 */

import 'server-only';

import { getSystemClient } from '@/shared/api/supabase/system';
import type { PublicInvoiceDTO, PublicInvoiceItemDTO } from '../model/public-invoice';

// =============================================================================
// Server fetcher
// =============================================================================

export async function getPublicInvoice(token: string): Promise<PublicInvoiceDTO | null> {
  if (!token?.trim()) return null;

  const supabase = getSystemClient();

  // 1. Invoice by token
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, total_amount, token, issue_date, due_date, event_id, workspace_id')
    .eq('token', token.trim())
    .maybeSingle();

  if (invError || !invoice) return null;

  const invoiceId = invoice.id;
  const eventId = invoice.event_id;
  const workspaceId = invoice.workspace_id;

  // 2. Invoice items (sorted by sort_order)
  const { data: itemRows, error: itemsError } = await supabase
    .from('invoice_items')
    .select('id, invoice_id, description, quantity, unit_price, amount, sort_order')
    .eq('invoice_id', invoiceId)
    .order('sort_order', { ascending: true });

  if (itemsError) return null;

  const items: PublicInvoiceItemDTO[] = (itemRows ?? []).map((row) => ({
    id: row.id,
    invoice_id: row.invoice_id,
    description: row.description,
    quantity: String(row.quantity ?? '1'),
    unit_price: String(row.unit_price ?? '0'),
    amount: String(row.amount ?? '0'),
    sort_order: row.sort_order ?? 0,
  }));

  // 3. Workspace (name, logo)
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name, logo_url')
    .eq('id', workspaceId)
    .single();

  if (workspaceError || !workspace) return null;

  // 4. Event (title, starts_at)
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, starts_at')
    .eq('id', eventId)
    .single();

  if (eventError || !event) return null;

  // 5. Payments (to compute amountPaid)
  const { data: paymentRows } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoiceId)
    .eq('status', 'succeeded');

  const amountPaid = (paymentRows ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const totalAmount = Number(invoice.total_amount);
  const balanceDue = Math.max(0, totalAmount - amountPaid);

  return {
    invoice: {
      id: invoice.id,
      invoice_number: invoice.invoice_number ?? null,
      status: invoice.status,
      total_amount: String(invoice.total_amount),
      token: invoice.token,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
    },
    items,
    workspace: {
      id: workspace.id,
      name: workspace.name ?? '',
      logo_url: workspace.logo_url ?? null,
    },
    event: {
      id: event.id,
      title: event.title ?? 'Event',
      starts_at: event.starts_at ?? null,
    },
    amountPaid,
    balanceDue,
  };
}
