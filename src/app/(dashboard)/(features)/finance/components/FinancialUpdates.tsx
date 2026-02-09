'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LiquidPanel } from '@/shared/ui/liquid-panel';
import { cn } from '@/shared/lib/utils';

type FinanceRow = {
  id: string;
  amount: number | null;
  client_name: string | null;
  status: string | null;
  invoice_number: string | null;
};

export function FinancialUpdates() {
  const [invoices, setInvoices] = useState<FinanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    async function fetchFinances() {
      try {
        const response = await fetch('/api/finance', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Finance API error:', response.status, errorText);
          setError('Unable to load finances');
          setInvoices([]);
          return;
        }
        const data = await response.json();
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        console.error('Finance widget failed:', err);
        setError('Unable to load finances');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFinances();
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* Header - Matching your 'Telemetry' style */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono text-ink-muted uppercase tracking-widest">
          Cash Flow
        </h3>
        <span className="flex h-1.5 w-1.5 items-center justify-center">
             <span className="absolute inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        </span>
      </div>

      {/* Content Card */}
      <div className="flex flex-col gap-2">
        {loading ? (
          <LiquidPanel className="h-24 w-full animate-pulse !p-0" />
        ) : error ? (
          <div className="py-6 text-center text-xs text-ink-muted italic">
            {error}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-muted italic">
            No active invoices
          </div>
        ) : (
          invoices.map((inv) => (
            <LiquidPanel
              key={inv.id}
              hoverEffect
              className="group relative flex cursor-pointer items-center justify-between !p-3 transition-all liquid-panel-nested"
            >
              <div className="flex flex-col">
                <span className="font-serif text-sm text-ink group-hover:text-ink">
                  {inv.client_name || 'Client Payment'}
                </span>
                <span className="font-mono text-[10px] text-ink-muted">
                  {inv.invoice_number ? `INV-${inv.invoice_number.slice(0, 5)}` : 'INV-00000'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-medium text-ink">
                  ${inv.amount?.toLocaleString() ?? '0'}
                </span>
                <StatusDot status={inv.status || 'draft'} />
              </div>
            </LiquidPanel>
          ))
        )}
      </div>

      {/* Footer Action */}
      <Link href="/finance" className="block w-full">
        <button className="w-full rounded-lg border border-[var(--glass-border)] py-2 text-[10px] font-medium uppercase tracking-wider text-ink-muted transition-colors hover:bg-ink hover:text-[var(--background)]">
          View Ledger
        </button>
      </Link>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors = {
    paid: "bg-emerald-500",
    sent: "bg-amber-400",
    overdue: "bg-rose-400",
    draft: "bg-stone-300",
  };
  const color = colors[status as keyof typeof colors] || colors.draft;

  return <div className={cn('h-1.5 w-1.5 rounded-full', color)} />;
}