import { useAuth } from '../state/auth.js';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../api.js';

// Typed API response helpers
interface CreatePeriodResponse {
  period: { id: string; startDate: string };
}
interface CreateCategoryResponse {
  category: { id: string; name: string };
}
interface BudgetSummaryCategory {
  categoryId: string;
  name: string;
  allocationMinorUnits: number;
  spentMinorUnits: number;
  remainingMinorUnits: number;
  currency: string;
}
interface BudgetSummary {
  periodId: string;
  groupId: string;
  startDate: string;
  type: 'MONTH';
  categories: BudgetSummaryCategory[];
  totals: { allocated: number; spent: number; remaining: number; currency: string };
}
interface BudgetSummaryResponse {
  summary: BudgetSummary;
}

interface LinkState {
  step: 'idle' | 'launching' | 'linked' | 'error';
  itemId?: string;
  error?: string;
}

function LinkFlow(): JSX.Element {
  const [state, setState] = useState<LinkState>(() => ({ step: 'idle' }));
  async function launch(): Promise<void> {
    setState({ step: 'launching' });
    try {
      // Placeholder: Normally we'd request a link token from backend then open aggregator widget.
      // Simulate async delay & success.
      await new Promise((r) => setTimeout(r, 500));
      // Simulate obtaining public token then exchanging to get itemId; using mock value.
      const itemId = 'item_mock_123';
      setState({ step: 'linked', itemId });
    } catch (e: unknown) {
      setState({ step: 'error', error: e instanceof Error ? e.message : 'Link failed' });
    }
  }
  return (
    <section style={{ marginTop: '2rem' }}>
      <h2>Bank Link</h2>
      {state.step === 'idle' && (
        <button
          type="button"
          onClick={() => {
            launch().catch(() => {
              /* ignore */
            });
          }}
        >
          Link an Account
        </button>
      )}
      {state.step === 'launching' && <p>Opening link flow…</p>}
      {state.step === 'linked' && (
        <p style={{ color: 'green' }}>Linked successfully (mock). Item ID: {state.itemId}</p>
      )}
      {state.step === 'error' && <p style={{ color: 'red' }}>Error: {state.error}</p>}
    </section>
  );
}

export function Dashboard(): JSX.Element {
  // logout function safe (no this usage)
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { user, logout } = useAuth();
  return (
    <main style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Dashboard</h1>
      <p>
        Logged in as <strong>{user?.email}</strong>
      </p>
      <button
        type="button"
        onClick={() => {
          logout();
        }}
      >
        Logout
      </button>
      <LinkFlow />
      <BudgetDashboard />
      <TransactionsList />
    </main>
  );
}

interface Txn {
  id: string;
  postedAt: string;
  description: string;
  amount: number;
  currency: string;
  category?: string[] | null;
}

// Budget Dashboard (T-035)
// (interfaces moved to top)

function isBudgetSummaryResponse(v: unknown): v is BudgetSummaryResponse {
  return typeof v === 'object' && v !== null && 'summary' in v;
}

function useBudgetSummary(groupId: string, periodStart: string, accessToken: string | null) {
  const [data, setData] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For now we assume period already created; attempt to lazily create if not (best-effort)
      // Create category + period if absent via side-effect minimal logic skipped to keep scope small.
      // Fetch latest summary by picking a synthetic periodId pattern (unknown until creation) so we first list creation flow below.
      // Simpler: ensure period exists by POST then reuse returned id cached in closure.
      let periodId = sessionStorage.getItem('demoPeriodId');
      if (!periodId) {
        const perRes = await apiFetch(
          '/budget/periods',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, startDate: periodStart }),
          },
          accessToken ?? undefined,
        );
        if (perRes.ok) {
          const j: unknown = await perRes.json();
          const body = j as CreatePeriodResponse;
          periodId = body.period.id;
          sessionStorage.setItem('demoPeriodId', periodId);
        }
      }
      if (!periodId) throw new Error('No period');
      const summaryPath = `/budget/periods/${periodId}/summary?groupId=${groupId}`;
      let res = await apiFetch(summaryPath, {}, accessToken ?? undefined);
      const json: unknown = await res.json();
      if (!res.ok || !isBudgetSummaryResponse(json)) throw new Error('Failed');
      let summary: BudgetSummary = json.summary;
      if (summary.categories.length === 0 && !sessionStorage.getItem('demoBudgetSeeded')) {
        sessionStorage.setItem('demoBudgetSeeded', '1');
        const catRes = await apiFetch(
          '/budget/categories',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, name: 'Demo' }),
          },
          accessToken ?? undefined,
        );
        if (catRes.ok) {
          const catJson: unknown = await catRes.json();
          const catBody = catJson as CreateCategoryResponse;
          const categoryId = catBody.category.id;
          await apiFetch(
            '/budget/allocations',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ periodId, categoryId, amount: 50_00, currency: 'USD' }),
            },
            accessToken ?? undefined,
          );
          res = await apiFetch(summaryPath, {}, accessToken ?? undefined);
          const seeded: unknown = await res.json();
          if (res.ok && isBudgetSummaryResponse(seeded)) summary = seeded.summary;
        }
      }
      setData(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setLoading(false);
    }
  }, [groupId, periodStart, accessToken]);
  useEffect(() => {
    refresh().catch(() => {
      /* intentionally ignored */
    });
  }, [refresh]);
  return { data, loading, error, refresh };
}

const barColors = {
  normal: '#2d8f52',
  warning: '#d4a017',
  over: '#c0392b',
};

function CategoryProgress({ cat }: { cat: BudgetSummaryCategory }): JSX.Element {
  const pct =
    cat.allocationMinorUnits === 0 ? 0 : (cat.spentMinorUnits / cat.allocationMinorUnits) * 100;
  let color = barColors.normal;
  if (pct >= 90 && pct < 100) color = barColors.warning;
  else if (pct >= 100) color = barColors.over;
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
        <span>{cat.name}</span>
        <span>
          {(cat.spentMinorUnits / 100).toFixed(2)} / {(cat.allocationMinorUnits / 100).toFixed(2)}{' '}
          {cat.currency}
        </span>
      </div>
      <div style={{ background: '#eee', borderRadius: 4, overflow: 'hidden', height: 8 }}>
        <div
          style={{
            width: `${String(Math.min(pct, 100))}%`,
            background: color,
            height: '100%',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      {pct > 100 && (
        <div style={{ color: barColors.over, fontSize: '0.7rem' }}>
          Over by {((cat.spentMinorUnits - cat.allocationMinorUnits) / 100).toFixed(2)}{' '}
          {cat.currency}
        </div>
      )}
    </div>
  );
}

function BudgetDashboard(): JSX.Element {
  const groupId = 'grp_demo';
  const periodStart = new Date().toISOString().slice(0, 7) + '-01';
  const { accessToken } = useAuth();
  const { data, loading, error, refresh } = useBudgetSummary(groupId, periodStart, accessToken);
  const totalPct = useMemo(
    () =>
      data
        ? data.totals.allocated === 0
          ? 0
          : (data.totals.spent / data.totals.allocated) * 100
        : 0,
    [data],
  );
  let totalColor = barColors.normal;
  if (totalPct >= 90 && totalPct < 100) totalColor = barColors.warning;
  else if (totalPct >= 100) totalColor = barColors.over;
  return (
    <section style={{ marginTop: '2rem' }}>
      <h2>Budget</h2>
      <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
        Period starting {periodStart}
      </div>
      {loading && <p>Loading budget…</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data && (
        <div>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <strong>Total</strong>
              <span>
                {(data.totals.spent / 100).toFixed(2)} / {(data.totals.allocated / 100).toFixed(2)}{' '}
                {data.totals.currency}
              </span>
            </div>
            <div style={{ background: '#eee', borderRadius: 4, overflow: 'hidden', height: 10 }}>
              <div
                style={{
                  width: `${String(Math.min(totalPct, 100))}%`,
                  background: totalColor,
                  height: '100%',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            {totalPct > 100 && (
              <div style={{ color: barColors.over, fontSize: '0.7rem' }}>
                Over by {((data.totals.spent - data.totals.allocated) / 100).toFixed(2)}{' '}
                {data.totals.currency}
              </div>
            )}
          </div>
          <div>
            {data.categories.length === 0 && (
              <p style={{ fontSize: '0.8rem' }}>No allocations yet.</p>
            )}
            {data.categories.map((c) => (
              <CategoryProgress key={c.categoryId} cat={c} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              refresh().catch(() => {
                /* intentionally ignored */
              });
            }}
            style={{ marginTop: '0.5rem' }}
          >
            Refresh
          </button>
        </div>
      )}
    </section>
  );
}

function TransactionsList(): JSX.Element {
  const [items, setItems] = useState<Txn[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const { accessToken } = useAuth();

  async function loadMore(): Promise<void> {
    if (loading || reachedEnd) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ accountId: 'acc_mock_1', limit: '10' });
      if (cursor) qs.set('cursor', cursor);
      const res = await apiFetch(`/transactions?${qs.toString()}`, {}, accessToken ?? undefined);
      const json: unknown = await res.json();
      if (!res.ok || typeof json !== 'object' || json === null) throw new Error('Failed');
      const body = json as { items?: Txn[]; nextCursor?: string };
      const newItems = Array.isArray(body.items) ? body.items : [];
      setItems((prev) => [...prev, ...newItems]);
      if (body.nextCursor) setCursor(body.nextCursor);
      else setReachedEnd(true);
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false);
    }
  }

  async function saveCategory(id: string): Promise<void> {
    if (!editValue.trim()) {
      setEditingId(null);
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch(
        `/transactions/${id}/category?accountId=acc_mock_1`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: editValue.trim() }),
        },
        accessToken ?? undefined,
      );
      const json: unknown = await res.json();
      if (!res.ok || typeof json !== 'object' || json === null) throw new Error('Failed');
      const updated = (json as { transaction?: Txn }).transaction;
      if (updated) {
        setItems((prev) =>
          prev.map((t) => (t.id === id ? { ...t, category: updated.category } : t)),
        );
      }
      setEditingId(null);
    } catch {
      /* intentionally ignored */
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadMore().catch(() => {
      /* intentionally ignored */
    });
  }, []);

  return (
    <section style={{ marginTop: '2rem' }}>
      <h2>Transactions</h2>
      {items.length === 0 && !loading && <p>No transactions loaded yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((t) => {
          const isEditing = editingId === t.id;
          return (
            <li key={t.id} style={{ borderBottom: '1px solid #ddd', padding: '0.5rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span>{t.postedAt}</span>
                <span>
                  {(t.amount / 100).toFixed(2)} {t.currency}
                </span>
              </div>
              <div style={{ fontWeight: 500 }}>{t.description}</div>
              <div style={{ fontSize: '0.85rem', color: '#555' }}>
                Category:{' '}
                {!isEditing && (
                  <span>
                    {t.category?.[0] ?? 'Uncategorized'}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(t.id);
                        setEditValue(t.category?.[0] ?? '');
                      }}
                      style={{ fontSize: '0.7rem' }}
                    >
                      Edit
                    </button>
                  </span>
                )}
                {isEditing && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveCategory(t.id).catch(() => {
                        /* intentionally ignored */
                      });
                    }}
                    style={{ display: 'inline-flex', gap: '0.25rem' }}
                  >
                    <input
                      value={editValue}
                      disabled={saving}
                      onChange={(e) => {
                        setEditValue(e.target.value);
                      }}
                      placeholder="Category"
                      style={{ fontSize: '0.7rem' }}
                    />
                    <button
                      type="submit"
                      disabled={saving || !editValue.trim()}
                      style={{ fontSize: '0.7rem' }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                      }}
                      disabled={saving}
                      style={{ fontSize: '0.7rem' }}
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {!reachedEnd && (
        <div>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              loadMore().catch(() => {
                /* intentionally ignored */
              });
            }}
          >
            {loading ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}
      {reachedEnd && <p style={{ fontStyle: 'italic' }}>End of list</p>}
    </section>
  );
}
