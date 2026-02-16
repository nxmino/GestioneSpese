'use client';

import { useState, useRef } from 'react';

interface ScanResult {
    amount: string;
    description: string;
}

interface ReceiptScannerProps {
    onResult: (result: ScanResult) => void;
    onClose: () => void;
}

function parseReceiptText(text: string): ScanResult {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Try to find total amount
    let amount = '';
    const totalPatterns = [
        /totale\s*[:\s€]*\s*([\d]+[.,]\d{2})/i,
        /tot(?:ale)?\s*[:\s€]*\s*([\d]+[.,]\d{2})/i,
        /total\s*[:\s€]*\s*([\d]+[.,]\d{2})/i,
        /dovuto\s*[:\s€]*\s*([\d]+[.,]\d{2})/i,
        /pagamento\s*[:\s€]*\s*([\d]+[.,]\d{2})/i,
        /€\s*([\d]+[.,]\d{2})/,
        /([\d]+[.,]\d{2})\s*€/,
    ];

    for (const pattern of totalPatterns) {
        for (let i = lines.length - 1; i >= 0; i--) {
            const match = lines[i].match(pattern);
            if (match) {
                amount = match[1].replace(',', '.');
                break;
            }
        }
        if (amount) break;
    }

    // If no total found, find the largest number
    if (!amount) {
        let maxAmount = 0;
        const numberPattern = /([\d]+[.,]\d{2})/g;
        for (const line of lines) {
            let match;
            while ((match = numberPattern.exec(line)) !== null) {
                const num = parseFloat(match[1].replace(',', '.'));
                if (num > maxAmount && num < 10000) {
                    maxAmount = num;
                }
            }
        }
        if (maxAmount > 0) {
            amount = maxAmount.toFixed(2);
        }
    }

    // Build description from first meaningful lines
    const skipPatterns = /^(data|ora|scontrino|ricevuta|n\.|nr|cf|p\.iva|tel|via|cap|cassa|operatore)/i;
    const descLines = lines
        .filter(l => !skipPatterns.test(l) && l.length > 2 && l.length < 80)
        .slice(0, 3);
    const description = descLines.join(' · ').substring(0, 200) || 'Scontrino scansionato';

    return { amount, description };
}

export default function ReceiptScanner({ onResult, onClose }: ReceiptScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const [rawText, setRawText] = useState('');
    const [result, setResult] = useState<ScanResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        setScanning(true);
        setProgress(0);

        try {
            const Tesseract = (await import('tesseract.js')).default;
            const worker = await Tesseract.createWorker('ita', undefined, {
                logger: (m: { progress: number }) => {
                    if (m.progress) setProgress(Math.round(m.progress * 100));
                },
            });

            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            setRawText(text);
            const parsed = parseReceiptText(text);
            setResult(parsed);
        } catch {
            setRawText('Errore durante la scansione');
        } finally {
            setScanning(false);
        }
    };

    const handleConfirm = () => {
        if (result) {
            onResult(result);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="glass-card w-full max-w-md max-h-[85vh] overflow-auto p-5 animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold">📷 Scansiona Scontrino</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Upload area */}
                {!preview && !scanning && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        <div className="text-5xl mb-3">📸</div>
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                            Tocca per scattare o caricare
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            JPG, PNG — max 10MB
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                    }}
                />

                {/* Preview */}
                {preview && (
                    <div className="mb-4 rounded-xl overflow-hidden">
                        <img src={preview} alt="Scontrino" className="w-full max-h-60 object-contain bg-black/30 rounded-xl" />
                    </div>
                )}

                {/* Scanning progress */}
                {scanning && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                Analisi in corso...
                            </span>
                            <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                                {progress}%
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-input)' }}>
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${progress}%`,
                                    background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-light))',
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Results */}
                {result && !scanning && (
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                                Importo trovato
                            </label>
                            <input
                                type="text"
                                value={result.amount}
                                onChange={(e) => setResult({ ...result, amount: e.target.value })}
                                className="input-field text-xl font-bold"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                                Descrizione
                            </label>
                            <input
                                type="text"
                                value={result.description}
                                onChange={(e) => setResult({ ...result, description: e.target.value })}
                                className="input-field"
                                placeholder="Descrizione spesa"
                            />
                        </div>

                        {/* Raw text toggle */}
                        {rawText && (
                            <details className="mt-2">
                                <summary className="text-xs cursor-pointer" style={{ color: 'var(--color-text-muted)' }}>
                                    Mostra testo estratto
                                </summary>
                                <pre className="mt-2 p-3 rounded-xl text-xs whitespace-pre-wrap break-words max-h-40 overflow-auto"
                                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' }}
                                >
                                    {rawText}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3 mt-4">
                            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-semibold text-sm border transition hover:bg-white/5"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                            >
                                Annulla
                            </button>
                            <button onClick={handleConfirm} className="flex-1 btn-primary">
                                ✓ Usa questi dati
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
