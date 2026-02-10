'use client';

import React, { useEffect, useState, useCallback, useTransition, useRef } from 'react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, Minus, X, Search, FileText, Send, GripVertical, Mail } from 'lucide-react';
import { LiquidPanel } from '@/shared/ui/liquid-panel';
import { upsertProposal, publishProposal } from '../api/proposal-actions';
import type { ProposalWithItems, ProposalBuilderLineItem } from '../model/types';
import { PACKAGE_SUGGESTIONS } from '../model/types';
import type { Package } from '@/types/supabase';
import { cn } from '@/shared/lib/utils';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

const CATALOG_DROPPABLE = 'catalog';
const RECEIPT_DROPPABLE = 'receipt';

export interface ProposalBuilderProps {
  /** Event id (unified events table). */
  eventId: string;
  workspaceId: string;
  initialProposal?: ProposalWithItems | null;
  /** Client email to pre-fill "Send to" when proposal is sent (e.g. from event or CRM) */
  clientEmail?: string | null;
  onSaved?: (proposalId: string, total: number) => void;
  className?: string;
}

function mapProposalItemsToLineItems(initialProposal: ProposalWithItems | null | undefined): ProposalBuilderLineItem[] {
  if (!initialProposal?.items?.length) return [];
  return initialProposal.items.map((item) => ({
    id: item.id,
    packageId: item.package_id ?? null,
    name: item.name,
    description: item.description ?? null,
    quantity: item.quantity,
    unitPrice: Number(item.unit_price),
  }));
}

export function ProposalBuilder({
  eventId,
  workspaceId,
  initialProposal,
  clientEmail,
  onSaved,
  className,
}: ProposalBuilderProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [lineItems, setLineItems] = useState<ProposalBuilderLineItem[]>(() =>
    mapProposalItemsToLineItems(initialProposal)
  );
  const [search, setSearch] = useState('');
  const [proposalId, setProposalId] = useState<string | null>(initialProposal?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [sendToEmail, setSendToEmail] = useState<string>(clientEmail ?? '');
  const [sendError, setSendError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // Pre-fill "Send to" when client email is available
  useEffect(() => {
    if (clientEmail?.trim() && !sendToEmail.trim()) setSendToEmail(clientEmail.trim());
  }, [clientEmail]);
  const [isPending, startTransition] = useTransition();
  const [dndEnabled, setDndEnabled] = useState(false);
  const [packagesLoaded, setPackagesLoaded] = useState(false);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const circuitBreakerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPackages = useCallback(() => {
    if (!workspaceId) {
      setPackages([]);
      setPackagesLoaded(true);
      setPackagesError(null);
      setHasLoadedOnce(true);
      return () => {};
    }
    setPackagesLoaded(false);
    setPackagesError(null);
    let cancelled = false;
    const abortController = new AbortController();
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      abortController.abort();
    }, 5000);
    const url = `/api/packages?workspaceId=${encodeURIComponent(workspaceId)}&_t=${Date.now()}`;
    fetch(url, { signal: abortController.signal, cache: 'no-store' })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            throw new Error(res.status === 400 ? 'workspaceId required' : text || `HTTP ${res.status}`);
          });
        }
        return res.json();
      })
      .then((body: { packages?: Package[]; error?: string }) => {
        if (cancelled) return;
        setPackages(body.packages ?? []);
        setPackagesLoaded(true);
        setPackagesError(body.error ?? null);
        setHasLoadedOnce(true);
        if (body.error) console.warn('[ProposalBuilder] packages API:', body.error);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.name === 'AbortError') {
          setPackagesError('Load timed out. Check your connection.');
        } else {
          console.warn('[ProposalBuilder] packages fetch failed:', err);
          setPackages([]);
          setPackagesError(err?.message ?? 'Failed to load packages.');
        }
        setPackagesLoaded(true);
        setHasLoadedOnce(true);
      })
      .finally(() => {
        setPackagesLoaded(true);
        setHasLoadedOnce(true);
        cancelled = true;
        window.clearTimeout(timeout);
      });
    return () => {
      cancelled = true;
      abortController.abort();
      window.clearTimeout(timeout);
    };
  }, [workspaceId]);

  useEffect(() => {
    const cleanup = loadPackages();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [loadPackages]);

  // Circuit breaker: always fire once 2.5s after mount so we never stay stuck on loading
  useEffect(() => {
    circuitBreakerRef.current = window.setTimeout(() => {
      setHasLoadedOnce(true);
      setPackagesLoaded(true);
      setPackagesError((e) => e || 'Loading took too long. Try again.');
    }, 2500);
    return () => {
      if (circuitBreakerRef.current) {
        window.clearTimeout(circuitBreakerRef.current);
        circuitBreakerRef.current = null;
      }
    };
  }, []);

  // When user returns to the tab and catalog is still loading, retry
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (!packagesLoaded && workspaceId) {
        retryTimeout = window.setTimeout(() => loadPackages(), 300);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (retryTimeout) window.clearTimeout(retryTimeout);
    };
  }, [packagesLoaded, workspaceId, loadPackages]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setDndEnabled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const filteredPackages = search.trim()
    ? packages.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
      )
    : packages;

  const total = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const addItem = useCallback((pkg: Package, quantity = 1) => {
    const qty = Math.max(1, Math.round(quantity));
    setLineItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.packageId === pkg.id || item.name === pkg.name
      );
      if (existingIndex >= 0) {
        return prev.map((item, i) =>
          i === existingIndex ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      const newItem: ProposalBuilderLineItem = {
        packageId: pkg.id,
        name: pkg.name,
        description: pkg.description ?? null,
        quantity: qty,
        unitPrice: Number(pkg.price),
      };
      return [...prev, newItem];
    });

    const match = PACKAGE_SUGGESTIONS.find(
      (s) => s.whenAdded.toLowerCase() === pkg.name.toLowerCase()
    );
    if (match) setSuggestion(match.suggest);
    else setSuggestion(null);
  }, []);

  const addSuggestion = useCallback(() => {
    if (!suggestion) return;
    const pkg = packages.find((p) => p.name.toLowerCase() === suggestion.toLowerCase());
    if (pkg) {
      addItem(pkg);
      setSuggestion(null);
    }
  }, [suggestion, packages, addItem]);

  const removeItem = useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
    setSuggestion(null);
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    const parsed = Number(quantity);
    const q = Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : 1;
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: q } : item))
    );
  }, []);

  const handleSaveDraft = useCallback(() => {
    setSaving(true);
    startTransition(async () => {
      const input = lineItems.map((item) => ({
        packageId: item.packageId ?? null,
        name: item.name,
        description: item.description ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
      const result = await upsertProposal(eventId, input);
      setSaving(false);
      if (result.proposalId) {
        setProposalId(result.proposalId);
        onSaved?.(result.proposalId, result.total);
      }
    });
  }, [eventId, lineItems, onSaved]);

  const handleSend = useCallback(() => {
    setSendError(null);
    setSending(true);
    startTransition(async () => {
      try {
        const input = lineItems.map((item) => ({
          packageId: item.packageId ?? null,
          name: item.name,
          description: item.description ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));
        const upsert = await upsertProposal(eventId, input);
        if (!upsert.proposalId) {
          setSendError(upsert.error ?? 'Failed to save proposal.');
          return;
        }
        setProposalId(upsert.proposalId);
        const pub = await publishProposal(upsert.proposalId);
        if (pub.publicUrl) {
          setSentUrl(pub.publicUrl);
          setSendError(null);
        } else {
          setSendError(pub.error ?? 'Failed to publish proposal.');
        }
        onSaved?.(upsert.proposalId, upsert.total);
      } finally {
        setSending(false);
      }
    });
  }, [eventId, lineItems, onSaved]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const { source, destination } = result;
      if (source.droppableId === CATALOG_DROPPABLE && destination.droppableId === RECEIPT_DROPPABLE) {
        const packageId = result.draggableId.startsWith('catalog-')
          ? result.draggableId.slice('catalog-'.length)
          : result.draggableId;
        const pkg = packages.find((p) => p.id === packageId);
        if (pkg) addItem(pkg);
      }
    },
    [packages, addItem]
  );

  const catalogContent = (
    <>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-3 shrink-0">
        Catalog
      </h2>
      <div className="relative mb-4 shrink-0">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search packages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/50 text-ink placeholder:text-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          aria-label="Search packages"
        />
      </div>
      {dndEnabled ? (
        <Droppable
          droppableId={CATALOG_DROPPABLE}
          getContainerForClone={
            typeof document !== 'undefined' ? () => document.body : undefined
          }
          renderClone={
            typeof document !== 'undefined'
              ? (provided, snapshot, rubric) => {
                  const id = String(rubric.draggableId).replace(/^catalog-/, '');
                  const pkg = packages.find((p) => p.id === id);
                  const name = pkg?.name ?? 'Package';
                  const price = pkg ? Number(pkg.price) : 0;
                  const imageUrl = pkg?.image_url;
                  const category = pkg?.category;
                  return (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={cn(
                        'flex items-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] liquid-levitation-strong min-h-[72px] w-[min(320px,90vw)] list-none',
                        snapshot.isDragging && 'opacity-95'
                      )}
                    >
                      <div className="shrink-0 p-2 text-ink-muted">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      {imageUrl ? (
                        <div className="w-14 h-14 shrink-0 bg-ink/5">
                          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 shrink-0 bg-ink/5 flex items-center justify-center text-ink-muted text-lg font-light">
                          {category?.[0] ?? '•'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 py-2.5 pr-2">
                        <p className="font-medium text-ink truncate text-sm">{name}</p>
                        <p className="text-sm font-semibold text-ink mt-1">
                          ${price.toLocaleString()}
                        </p>
                      </div>
                    </li>
                  );
                }
              : undefined
          }
        >
          {(provided) => (
            <ul
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 overflow-auto flex flex-col gap-3 pr-1 -mr-1 min-h-[120px] list-none"
            >
              {filteredPackages.length === 0 ? (
                <li className="text-sm text-ink-muted py-4 text-center">
                  {!hasLoadedOnce || !packagesLoaded ? (
                    'Loading…'
                  ) : packagesError ? (
                    <span className="block">
                      {packagesError}
                      <button
                        type="button"
                        onClick={() => loadPackages()}
                        className="mt-2 text-ink hover:underline block mx-auto"
                      >
                        Retry
                      </button>
                    </span>
                  ) : packages.length === 0 ? (
                    'No packages yet. Add some in your product library.'
                  ) : (
                    'No packages match your search.'
                  )}
                </li>
              ) : (
                filteredPackages.map((pkg, index) => (
                  <Draggable key={pkg.id} draggableId={`catalog-${pkg.id}`} index={index}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          'flex items-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/40 overflow-hidden hover:border-[var(--glass-border-hover)] transition-colors min-h-[72px]',
                          snapshot.isDragging && 'opacity-50'
                        )}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="flex flex-1 items-center gap-4 min-w-0 cursor-grab active:cursor-grabbing touch-none select-none py-1"
                          style={{ touchAction: 'none' }}
                        >
                          <div className="shrink-0 p-2 text-ink-muted">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          {pkg.image_url ? (
                            <div className="w-14 h-14 shrink-0 bg-ink/5">
                              <img
                                src={pkg.image_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 shrink-0 bg-ink/5 flex items-center justify-center text-ink-muted text-lg font-light">
                              {pkg.category?.[0] ?? '•'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0 py-2.5 pr-2">
                            <p className="font-medium text-ink truncate text-sm">{pkg.name}</p>
                            {pkg.description && (
                              <p className="text-xs text-ink-muted truncate mt-0.5">{pkg.description}</p>
                            )}
                            <p className="text-sm font-semibold text-ink mt-1">
                              ${Number(pkg.price).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => addItem(pkg)}
                          className="shrink-0 p-2.5 rounded-lg text-ink-muted hover:text-ink hover:bg-[var(--glass-bg-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                          aria-label={`Add ${pkg.name} to proposal`}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      ) : (
        <ul className="flex-1 overflow-auto space-y-3 pr-1 -mr-1 min-h-[120px]">
          {filteredPackages.length === 0 ? (
              <li className="text-sm text-ink-muted py-4 text-center">
                {!hasLoadedOnce || !packagesLoaded ? (
                  'Loading…'
                ) : packagesError ? (
                  <span className="block">
                    {packagesError}
                    <button
                      type="button"
                      onClick={() => loadPackages()}
                      className="mt-2 text-ink hover:underline block mx-auto"
                    >
                      Retry
                    </button>
                  </span>
                ) : packages.length === 0 ? (
                  'No packages yet. Add some in your product library.'
                ) : (
                  'No packages match your search.'
                )}
            </li>
          ) : (
            filteredPackages.map((pkg) => (
              <motion.li
                key={pkg.id}
                layout
                transition={spring}
                className="flex items-center gap-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/40 overflow-hidden hover:border-[var(--glass-border-hover)] transition-colors"
              >
                {pkg.image_url ? (
                  <div className="w-14 h-14 shrink-0 bg-ink/5">
                    <img src={pkg.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 shrink-0 bg-ink/5 flex items-center justify-center text-ink-muted text-lg font-light">
                    {pkg.category?.[0] ?? '•'}
                  </div>
                )}
                <div className="flex-1 min-w-0 py-2.5 pr-2">
                  <p className="font-medium text-ink truncate text-sm">{pkg.name}</p>
                  {pkg.description && (
                    <p className="text-xs text-ink-muted truncate mt-0.5">{pkg.description}</p>
                  )}
                  <p className="text-sm font-semibold text-ink mt-1">
                    ${Number(pkg.price).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addItem(pkg)}
                  className="shrink-0 p-2.5 rounded-lg text-ink-muted hover:text-ink hover:bg-[var(--glass-bg-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  aria-label={`Add ${pkg.name} to proposal`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </motion.li>
            ))
          )}
        </ul>
      )}
      {suggestion && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 pt-3 border-t border-[var(--glass-border)] shrink-0"
        >
          <p className="text-xs text-ink-muted mb-1.5">Suggested add-on</p>
          <button
            type="button"
            onClick={addSuggestion}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200 text-sm font-medium hover:bg-amber-500/25 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add {suggestion}
          </button>
        </motion.div>
      )}
    </>
  );

  const receiptRowClass =
    'grid grid-cols-[1fr_auto_auto_auto] gap-3 sm:gap-4 items-center py-3 px-4 rounded-xl bg-[var(--glass-bg)]/50 border border-[var(--glass-border)] min-w-0';
  const receiptHeaderClass =
    'grid grid-cols-[1fr_auto_auto_auto] gap-3 sm:gap-4 items-center py-2 px-4 mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted border-b border-[var(--glass-border)]';
  const qtyStepperClass =
    'flex flex-col items-center shrink-0 w-10 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]';
  const qtyBtnClass =
    'p-1 w-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-[var(--glass-bg-hover)] disabled:opacity-40 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-inset';
  const qtyInputClass =
    'w-full py-0.5 px-0 text-center text-sm font-medium tabular-nums bg-transparent border-0 text-ink focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  const receiptListContent = dndEnabled ? (
    <Droppable droppableId={RECEIPT_DROPPABLE}>
      {(provided, snapshot) => (
        <div className="flex-1 overflow-auto min-h-[160px] min-w-0 transition-colors rounded-xl">
          {lineItems.length > 0 && (
            <div className={receiptHeaderClass}>
              <span>Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right w-14 shrink-0">Total</span>
              <span className="w-9 shrink-0" aria-hidden />
            </div>
          )}
          <ul
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'space-y-3 mt-1',
              snapshot.isDraggingOver && 'bg-[var(--glass-bg)]/60 border-2 border-dashed border-[var(--glass-border-hover)] rounded-xl min-h-[120px]'
            )}
          >
            {lineItems.length === 0 ? (
              <li className="text-sm text-ink-muted py-10 text-center rounded-xl border border-dashed border-[var(--glass-border)]">
                Drop items from the catalog here, or use + to add
              </li>
            ) : (
              lineItems.map((item, index) => (
                <motion.li
                  key={item.id ?? `row-${index}`}
                  layout
                  transition={spring}
                  className={receiptRowClass}
                >
                  <div className="min-w-0 pr-2 overflow-hidden">
                    <p className="font-medium text-ink truncate text-sm leading-snug">{item.name}</p>
                    <p className="text-xs text-ink-muted tabular-nums mt-0.5">
                      ${item.unitPrice.toLocaleString()} each
                    </p>
                  </div>
                  <div className={qtyStepperClass}>
                    <button
                      type="button"
                      onClick={(e) => {
                        updateQuantity(index, item.quantity + 1);
                        (e.currentTarget as HTMLButtonElement).blur();
                      }}
                      className={qtyBtnClass}
                      aria-label={`Increase quantity for ${item.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, e.target.valueAsNumber)}
                      className={qtyInputClass}
                      aria-label={`Quantity for ${item.name}`}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        updateQuantity(index, item.quantity - 1);
                        (e.currentTarget as HTMLButtonElement).blur();
                      }}
                      disabled={item.quantity <= 1}
                      className={qtyBtnClass}
                      aria-label={`Decrease quantity for ${item.name}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-ink tabular-nums w-14 shrink-0 text-right">
                    ${(item.quantity * item.unitPrice).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1.5 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] w-9 h-9 flex items-center justify-center shrink-0"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.li>
              ))
            )}
            {provided.placeholder}
          </ul>
        </div>
      )}
    </Droppable>
  ) : (
    <div className="flex-1 overflow-auto min-h-[160px] min-w-0">
      {lineItems.length > 0 && (
        <div className={receiptHeaderClass}>
          <span>Item</span>
          <span className="text-center">Qty</span>
          <span className="text-right w-14 shrink-0">Total</span>
          <span className="w-9 shrink-0" aria-hidden />
        </div>
      )}
      <ul className="space-y-3 mt-1">
        {lineItems.length === 0 ? (
          <li className="text-sm text-ink-muted py-10 text-center rounded-xl border border-dashed border-[var(--glass-border)]">
            Add items from the catalog
          </li>
        ) : (
          lineItems.map((item, index) => (
            <motion.li
              key={item.id ?? `row-${index}`}
              layout
              transition={spring}
              className={receiptRowClass}
            >
              <div className="min-w-0 pr-2 overflow-hidden">
                <p className="font-medium text-ink truncate text-sm leading-snug">{item.name}</p>
                <p className="text-xs text-ink-muted tabular-nums mt-0.5">
                  ${item.unitPrice.toLocaleString()} each
                </p>
              </div>
              <div className={qtyStepperClass}>
                <button
                  type="button"
                  onClick={(e) => {
                    updateQuantity(index, item.quantity + 1);
                    (e.currentTarget as HTMLButtonElement).blur();
                  }}
                  className={qtyBtnClass}
                  aria-label={`Increase quantity for ${item.name}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(index, e.target.valueAsNumber)}
                  className={qtyInputClass}
                  aria-label={`Quantity for ${item.name}`}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    updateQuantity(index, item.quantity - 1);
                    (e.currentTarget as HTMLButtonElement).blur();
                  }}
                  disabled={item.quantity <= 1}
                  className={qtyBtnClass}
                  aria-label={`Decrease quantity for ${item.name}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-sm font-semibold text-ink tabular-nums w-14 shrink-0 text-right">
                ${(item.quantity * item.unitPrice).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] w-9 h-9 flex items-center justify-center shrink-0"
                aria-label={`Remove ${item.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );

  return (
    <div className={cn('flex flex-col gap-4', className)} style={{ overflow: 'visible' }}>
      {dndEnabled ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 w-full" style={{ overflow: 'visible' }}>
            {/* Left: Catalog — overflow-visible so drag clone isn't clipped */}
            <div className="min-w-0 flex flex-col overflow-visible">
              <LiquidPanel className="flex flex-col p-6 min-h-[320px] flex-1 min-w-0 overflow-visible">
                {catalogContent}
              </LiquidPanel>
            </div>

            {/* Right: Receipt */}
            <div className="min-w-0 flex flex-col overflow-visible">
              <LiquidPanel className="flex flex-col p-6 sm:p-8 min-h-[320px] flex-1 min-w-0 overflow-visible">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-5 shrink-0">
                  Receipt
                </h2>
                <div className="flex-1 min-h-0 flex flex-col min-w-0">
                  {receiptListContent}
                </div>

                {/* Footer: Total + actions */}
                <div className="shrink-0 pt-6 mt-6 border-t border-[var(--glass-border)]">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                      Total
                    </span>
                    <span className="text-xl font-semibold text-ink tabular-nums">
                      ${total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={lineItems.length === 0 || saving || isPending}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--glass-border)] text-ink font-medium text-sm hover:bg-[var(--glass-bg-hover)] disabled:opacity-50 disabled:pointer-events-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    >
                      <FileText className="w-4 h-4" />
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={lineItems.length === 0 || sending || isPending}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-canvas font-medium text-sm hover:bg-walnut disabled:opacity-50 disabled:pointer-events-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                  {sendError && (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
                      {sendError}
                    </p>
                  )}
                  {sentUrl && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        Proposal sent. Share link:{' '}
                        <a
                          href={sentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          {sentUrl}
                        </a>
                      </p>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="send-to-email-mobile" className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                          Email link to
                        </label>
                        <input
                          id="send-to-email-mobile"
                          type="email"
                          value={sendToEmail}
                          onChange={(e) => setSendToEmail(e.target.value)}
                          placeholder="client@example.com"
                          className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/50 px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const to = sendToEmail.trim();
                            if (!to) return;
                            const subject = encodeURIComponent('Your proposal');
                            const body = encodeURIComponent(`View your proposal: ${sentUrl}`);
                            window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
                          }}
                          disabled={!sendToEmail.trim()}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--glass-border)] text-ink font-medium text-sm hover:bg-[var(--glass-bg-hover)] disabled:opacity-50 disabled:pointer-events-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        >
                          <Mail className="w-4 h-4" />
                          Open in email
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </LiquidPanel>
            </div>
          </div>
        </DragDropContext>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 w-full overflow-visible">
          <div className="min-w-0 flex flex-col overflow-visible">
            <LiquidPanel className="flex flex-col p-6 min-h-[320px] flex-1 min-w-0 overflow-visible">
              {catalogContent}
            </LiquidPanel>
          </div>
          <div className="min-w-0 flex flex-col overflow-visible">
            <LiquidPanel className="flex flex-col p-6 sm:p-8 min-h-[320px] flex-1 min-w-0 overflow-visible">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-5 shrink-0">
                Receipt
              </h2>
              <div className="flex-1 min-h-0 flex flex-col min-w-0">
                {receiptListContent}
              </div>
              <div className="shrink-0 pt-6 mt-6 border-t border-[var(--glass-border)]">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                    Total
                  </span>
                  <span className="text-xl font-semibold text-ink tabular-nums">
                    ${total.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={lineItems.length === 0 || saving || isPending}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--glass-border)] text-ink font-medium text-sm hover:bg-[var(--glass-bg-hover)] disabled:opacity-50 disabled:pointer-events-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    <FileText className="w-4 h-4" />
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={lineItems.length === 0 || sending || isPending}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-canvas font-medium text-sm hover:bg-walnut disabled:opacity-50 disabled:pointer-events-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
                {sendError && (
                  <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
                    {sendError}
                  </p>
                )}
                {sentUrl && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      Proposal sent. Share link:{' '}
                      <a
                        href={sentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium"
                      >
                        {sentUrl}
                      </a>
                    </p>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="send-to-email" className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                        Email link to
                      </label>
                      <input
                        id="send-to-email"
                        type="email"
                        value={sendToEmail}
                        onChange={(e) => setSendToEmail(e.target.value)}
                        placeholder="client@example.com"
                        className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/50 px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const to = sendToEmail.trim();
                          if (!to) return;
                          const subject = encodeURIComponent('Your proposal');
                          const body = encodeURIComponent(`View your proposal: ${sentUrl}`);
                          window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
                        }}
                        disabled={!sendToEmail.trim()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--glass-border)] text-ink font-medium text-sm hover:bg-[var(--glass-bg-hover)] disabled:opacity-50 disabled:pointer-events-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      >
                        <Mail className="w-4 h-4" />
                        Open in email
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </LiquidPanel>
          </div>
        </div>
      )}
    </div>
  );
}
