'use client';

import { Expense, getCategoryInfo } from '@/lib/db';

interface ExpenseCardProps {
    expense: Expense;
    onDelete?: (id: number) => void;
}

export default function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
    const cat = getCategoryInfo(expense.category);
    const formattedDate = new Date(expense.date).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
    });

    return (
        <div className="glass-card p-4 flex items-center gap-4 animate-fade-in group">
            {/* Category icon */}
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: `${cat.color}18` }}
            >
                {cat.emoji}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {expense.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span
                        className="category-badge text-[10px]"
                        style={{ background: `${cat.color}18`, color: cat.color }}
                    >
                        {cat.label}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {formattedDate}
                    </span>
                </div>
            </div>

            {/* Amount & person */}
            <div className="text-right shrink-0">
                <p className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
                    €{Number(expense.amount).toFixed(2)}
                </p>
                <p
                    className="text-xs font-semibold mt-0.5"
                    style={{ color: expense.person === 'mino' ? 'var(--color-mino)' : 'var(--color-ambra)' }}
                >
                    {expense.person === 'mino' ? 'Mino' : 'Ambra'}
                </p>
            </div>

            {/* Delete button */}
            {onDelete && (
                <button
                    onClick={() => onDelete(expense.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-400/10"
                    title="Elimina"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                </button>
            )}
        </div>
    );
}
