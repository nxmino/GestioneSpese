'use client';

import { useState, useEffect, useCallback } from 'react';
import ExpenseCard from '@/components/ExpenseCard';
import { Expense, CATEGORIES } from '@/lib/db';

export default function SpesePage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [personFilter, setPersonFilter] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [monthFilter, setMonthFilter] = useState<string>(
        new Date().toISOString().slice(0, 7)
    );

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (personFilter) params.set('person', personFilter);
            if (categoryFilter) params.set('category', categoryFilter);
            if (monthFilter) params.set('month', monthFilter);

            const res = await fetch(`/api/expenses?${params.toString()}`);
            const data = await res.json();
            setExpenses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, [personFilter, categoryFilter, monthFilter]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleDelete = async (id: number) => {
        if (!confirm('Eliminare questa spesa?')) return;
        try {
            await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    // Group by date
    const grouped = expenses.reduce<Record<string, Expense[]>>((acc, exp) => {
        const dateKey = new Date(exp.date).toLocaleDateString('it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(exp);
        return acc;
    }, {});

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return (
        <div className="px-5 pt-14 animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold mb-1">Spese</h1>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {expenses.length} spese · €{total.toFixed(2)}
                </p>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 mb-5 space-y-3">
                {/* Month */}
                <input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="input-field text-sm"
                />

                <div className="flex gap-2">
                    {/* Person filter */}
                    <select
                        value={personFilter}
                        onChange={(e) => setPersonFilter(e.target.value)}
                        className="input-field text-sm flex-1"
                    >
                        <option value="">Tutti</option>
                        <option value="mino">🧑 Mino</option>
                        <option value="ambra">👩 Ambra</option>
                    </select>

                    {/* Category filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="input-field text-sm flex-1"
                    >
                        <option value="">Tutte le cat.</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Expense list grouped by date */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton h-20 rounded-2xl" />
                    ))}
                </div>
            ) : expenses.length === 0 ? (
                <div className="glass-card p-8 text-center">
                    <p className="text-3xl mb-2">🔍</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        Nessuna spesa trovata
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Prova a cambiare i filtri
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {Object.entries(grouped).map(([dateLabel, dayExpenses]) => (
                        <div key={dateLabel}>
                            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
                                {dateLabel}
                            </h3>
                            <div className="space-y-2">
                                {dayExpenses.map(expense => (
                                    <ExpenseCard
                                        key={expense.id}
                                        expense={expense}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
