'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/db';
import ReceiptScanner from '@/components/ReceiptScanner';

export default function AddExpensePage() {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('spesa');
    const [person, setPerson] = useState<'mino' | 'ambra'>('mino');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description) return;

        setSaving(true);

        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, description, category, person, date }),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/');
                    router.refresh();
                }, 800);
            }
        } catch (err) {
            console.error('Error saving expense:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleScanResult = (result: { amount: string; description: string }) => {
        setAmount(result.amount);
        setDescription(result.description);
        setShowScanner(false);
    };

    if (success) {
        return (
            <div className="px-5 pt-14 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-xl font-bold mb-2">Spesa salvata!</h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Reindirizzamento...</p>
            </div>
        );
    }

    return (
        <div className="px-5 pt-14 animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold mb-1">Aggiungi Spesa</h1>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Inserisci manualmente o scansiona lo scontrino
                </p>
            </div>

            {/* Scan button */}
            <button
                onClick={() => setShowScanner(true)}
                className="w-full glass-card p-4 flex items-center gap-4 mb-6 cursor-pointer text-left transition hover:border-[var(--color-accent)]"
            >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(108, 92, 231, 0.15)' }}>
                    📷
                </div>
                <div>
                    <p className="font-semibold text-sm">Scansiona scontrino</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Scatta una foto e i dati verranno estratti automaticamente
                    </p>
                </div>
            </button>

            {/* Manual form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Amount */}
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                        Importo (€)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="input-field text-2xl font-bold"
                        placeholder="0.00"
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                        Descrizione
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-field"
                        placeholder="Es. Spesa settimanale Esselunga"
                        required
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                        Categoria
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategory(cat.id)}
                                className="flex flex-col items-center gap-1 p-3 rounded-xl border transition-all"
                                style={{
                                    borderColor: category === cat.id ? cat.color : 'var(--color-border)',
                                    background: category === cat.id ? `${cat.color}15` : 'transparent',
                                }}
                            >
                                <span className="text-xl">{cat.emoji}</span>
                                <span className="text-[10px] font-semibold" style={{ color: category === cat.id ? cat.color : 'var(--color-text-secondary)' }}>
                                    {cat.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Person */}
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                        Chi ha pagato?
                    </label>
                    <div className="person-toggle">
                        <button
                            type="button"
                            onClick={() => setPerson('mino')}
                            className={person === 'mino' ? 'active-mino' : ''}
                        >
                            🧑 Mino
                        </button>
                        <button
                            type="button"
                            onClick={() => setPerson('ambra')}
                            className={person === 'ambra' ? 'active-ambra' : ''}
                        >
                            👩 Ambra
                        </button>
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                        Data
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="input-field"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={saving || !amount || !description}
                    className="btn-primary w-full py-4 text-base mt-2"
                >
                    {saving ? (
                        <span className="animate-pulse-soft">Salvataggio...</span>
                    ) : (
                        '💾 Salva Spesa'
                    )}
                </button>
            </form>

            {/* Receipt Scanner Modal */}
            {showScanner && (
                <ReceiptScanner
                    onResult={handleScanResult}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}
