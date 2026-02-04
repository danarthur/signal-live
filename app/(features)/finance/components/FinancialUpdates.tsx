'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeDollarSign, ArrowUpRight } from 'lucide-react';

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
    async function fetchFinances() {
      try {
        const response = await fetch('/api/finance', { cache: 'no-store' });
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
        console.error('Finance widget failed:', err);
        setError('Unable to load finances');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFinances();
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* Header - Matching your 'Telemetry' style */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono text-[#A8A29E] uppercase tracking-widest">
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
          <div className="h-24 w-full animate-pulse rounded-xl bg-white/20" />
        ) : error ? (
          <div className="py-6 text-center text-xs text-[#8C8781] italic">
            {error}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#8C8781] italic">
            No active invoices
          </div>
        ) : (
          invoices.map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative flex cursor-pointer items-center justify-between rounded-xl border border-white/20 bg-white/40 p-3 transition-all hover:bg-white/60 hover:shadow-sm"
            >
              <div className="flex flex-col">
                <span className="font-serif text-sm text-[#2C2824] group-hover:text-[#050505]">
                  {inv.client_name || 'Client Payment'}
                </span>
                <span className="font-mono text-[10px] text-[#A8A29E]">
                  {inv.invoice_number ? `INV-${inv.invoice_number.slice(0, 5)}` : 'INV-00000'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-medium text-[#4A453E]">
                  ${inv.amount?.toLocaleString() ?? '0'}
                </span>
                <StatusDot status={inv.status || 'draft'} />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer Action */}
      <button className="w-full rounded-lg border border-[#D6D3CD]/50 py-2 text-[10px] font-medium uppercase tracking-wider text-[#8C8781] transition-colors hover:bg-[#4A453E] hover:text-[#F9F7F2]">
        View Ledger
      </button>
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

  return <div className={`h-1.5 w-1.5 rounded-full ${color}`} />;
}