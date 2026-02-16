'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ExpenseCard from '@/components/ExpenseCard';
import { Expense } from '@/lib/db';

interface Stats {
    total: number;
    byPerson: Record<string, number>;
    byCategory: { category: string; total: number }[];
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recent, setRecent] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    const currentMonth = new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

    useEffect(() => {
        async function load() {
            try {
                const [statsRes, expensesRes] = await Promise.all([
                    fetch('/api/stats'),
                    fetch('/api/expenses?limit=5'),
                ]);
                const statsData = await statsRes.json();
                const expensesData = await expensesRes.json();
                setStats(statsData);
                setRecent(Array.isArray(expensesData) ? expensesData : []);
            } catch (err) {
                console.error('Error loading dashboard:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const minoTotal = stats?.byPerson?.mino || 0;
    const ambraTotal = stats?.byPerson?.ambra || 0;
    const total = stats?.total || 0;
    const minoPercent = total > 0 ? (minoTotal / total) * 100 : 50;

    if (loading) {
        return (
            <div className="px-5 pt-14">
                <div className="skeleton h-6 w-48 mb-8" />
                <div className="skeleton h-40 w-full mb-4 rounded-2xl" />
                <div className="skeleton h-24 w-full mb-4 rounded-2xl" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton h-20 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="px-5 pt-14 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {currentMonth}
                </p>
                <h1 className="text-2xl font-extrabold">Gestione Spese</h1>
            </div>

            {/* Total Card */}
            <div className="glass-card p-6 mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                    Totale del mese
                </p>
                <p className="text-4xl font-extrabold mb-5 tracking-tight">
                    €{total.toFixed(2)}
                </p>

                {/* Progress bar */}
                <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--color-bg-input)' }}>
                    <div
                        className="h-full transition-all duration-700 rounded-l-full"
                        style={{ width: `${minoPercent}%`, background: 'var(--color-mino)' }}
                    />
                    <div
                        className="h-full transition-all duration-700 rounded-r-full"
                        style={{ width: `${100 - minoPercent}%`, background: 'var(--color-ambra)' }}
                    />
                </div>

                {/* Person split */}
                <div className="flex justify-between mt-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-mino)' }} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-mino)' }}>Mino</span>
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>€{minoTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>€{ambraTotal.toFixed(2)}</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-ambra)' }}>Ambra</span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-ambra)' }} />
                    </div>
                </div>
            </div>

            {/* Quick add button */}
            <Link href="/aggiungi" className="btn-primary w-full py-4 text-base mb-6 block text-center rounded-2xl">
                ➕ Aggiungi Spesa
            </Link>

            {/* Recent */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold">Ultime spese</h2>
                    <Link href="/spese" className="text-xs font-semibold" style={{ color: 'var(--color-accent-light)' }}>
                        Vedi tutte →
                    </Link>
                </div>

                {recent.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <p className="text-3xl mb-2">💸</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            Nessuna spesa ancora
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            Aggiungi la tua prima spesa!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recent.map((expense) => (
                            <ExpenseCard key={expense.id} expense={expense} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
