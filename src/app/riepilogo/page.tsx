'use client';

import { useState, useEffect } from 'react';
import { getCategoryInfo } from '@/lib/db';

interface Stats {
    total: number;
    byPerson: Record<string, number>;
    byCategory: { category: string; total: number }[];
    monthly: { month: string; total: number }[];
}

export default function RiepilogoPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const params = selectedMonth ? `?month=${selectedMonth}` : '';
                const res = await fetch(`/api/stats${params}`);
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [selectedMonth]);

    if (loading) {
        return (
            <div className="px-5 pt-14">
                <div className="skeleton h-6 w-32 mb-8" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton h-32 w-full mb-4 rounded-2xl" />
                ))}
            </div>
        );
    }

    const total = stats?.total || 0;
    const minoTotal = stats?.byPerson?.mino || 0;
    const ambraTotal = stats?.byPerson?.ambra || 0;
    const maxCategoryTotal = Math.max(...(stats?.byCategory?.map(c => c.total) || [1]));
    const maxMonthlyTotal = Math.max(...(stats?.monthly?.map(m => m.total) || [1]));

    // Who owes who
    const diff = minoTotal - ambraTotal;
    const half = total / 2;
    const minoOwes = half - minoTotal;

    return (
        <div className="px-5 pt-14 animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold mb-1">Riepilogo</h1>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Statistiche e bilancio
                </p>
            </div>

            {/* Month filter */}
            <div className="mb-5">
                <select
                    value={selectedMonth}
                    onChange={(e) => { setSelectedMonth(e.target.value); setLoading(true); }}
                    className="input-field text-sm"
                >
                    <option value="">Mese corrente</option>
                    {stats?.monthly?.map(m => (
                        <option key={m.month} value={m.month}>
                            {new Date(m.month + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                        </option>
                    ))}
                </select>
            </div>

            {/* Total card */}
            <div className="glass-card p-5 mb-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Totale
                </p>
                <p className="text-4xl font-extrabold tracking-tight">€{total.toFixed(2)}</p>
            </div>

            {/* Balance card */}
            <div className="glass-card p-5 mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    Bilancio
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(0, 206, 201, 0.08)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-mino)' }}>🧑 Mino</p>
                        <p className="text-xl font-bold">€{minoTotal.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(253, 121, 168, 0.08)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-ambra)' }}>👩 Ambra</p>
                        <p className="text-xl font-bold">€{ambraTotal.toFixed(2)}</p>
                    </div>
                </div>

                {total > 0 && (
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(108, 92, 231, 0.08)' }}>
                        {Math.abs(diff) < 0.01 ? (
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                                ✅ Siete pari!
                            </p>
                        ) : minoOwes > 0 ? (
                            <p className="text-sm font-semibold">
                                <span style={{ color: 'var(--color-mino)' }}>Mino</span>
                                <span style={{ color: 'var(--color-text-secondary)' }}> deve </span>
                                <span className="font-bold" style={{ color: 'var(--color-warning)' }}>€{minoOwes.toFixed(2)}</span>
                                <span style={{ color: 'var(--color-text-secondary)' }}> ad </span>
                                <span style={{ color: 'var(--color-ambra)' }}>Ambra</span>
                            </p>
                        ) : (
                            <p className="text-sm font-semibold">
                                <span style={{ color: 'var(--color-ambra)' }}>Ambra</span>
                                <span style={{ color: 'var(--color-text-secondary)' }}> deve </span>
                                <span className="font-bold" style={{ color: 'var(--color-warning)' }}>€{Math.abs(minoOwes).toFixed(2)}</span>
                                <span style={{ color: 'var(--color-text-secondary)' }}> a </span>
                                <span style={{ color: 'var(--color-mino)' }}>Mino</span>
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* By category */}
            <div className="glass-card p-5 mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    Per categoria
                </p>
                {stats?.byCategory && stats.byCategory.length > 0 ? (
                    <div className="space-y-3">
                        {stats.byCategory.map(({ category, total: catTotal }) => {
                            const cat = getCategoryInfo(category);
                            const percent = maxCategoryTotal > 0 ? (catTotal / maxCategoryTotal) * 100 : 0;
                            return (
                                <div key={category}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{cat.emoji}</span>
                                            <span className="text-sm font-medium">{cat.label}</span>
                                        </div>
                                        <span className="text-sm font-bold">€{catTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-input)' }}>
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${percent}%`, background: cat.color }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>Nessun dato</p>
                )}
            </div>

            {/* Monthly trend */}
            <div className="glass-card p-5 mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    Andamento mensile
                </p>
                {stats?.monthly && stats.monthly.length > 0 ? (
                    <div className="space-y-3">
                        {stats.monthly.slice(0, 6).map(({ month, total: monthTotal }) => {
                            const percent = maxMonthlyTotal > 0 ? (monthTotal / maxMonthlyTotal) * 100 : 0;
                            const label = new Date(month + '-01').toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
                            return (
                                <div key={month} className="flex items-center gap-3">
                                    <span className="text-xs font-medium w-14 shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                                        {label}
                                    </span>
                                    <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: 'var(--color-bg-input)' }}>
                                        <div
                                            className="h-full rounded-lg flex items-center px-2 transition-all duration-700"
                                            style={{
                                                width: `${Math.max(percent, 8)}%`,
                                                background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-light))',
                                            }}
                                        >
                                            <span className="text-[10px] font-bold text-white whitespace-nowrap">
                                                €{monthTotal.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>Nessun dato</p>
                )}
            </div>
        </div>
    );
}
