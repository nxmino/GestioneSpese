'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/aggiungi', label: 'Aggiungi', icon: '➕' },
    { href: '/spese', label: 'Spese', icon: '📋' },
    { href: '/riepilogo', label: 'Riepilogo', icon: '📊' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="bottom-nav">
            <div className="flex items-center justify-around px-2 py-2">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all duration-200"
                            style={{
                                color: isActive ? '#6c5ce7' : '#555577',
                                background: isActive ? 'rgba(108, 92, 231, 0.08)' : 'transparent',
                            }}
                        >
                            <span className="text-xl leading-none">{tab.icon}</span>
                            <span className="text-[11px] font-semibold tracking-wide">{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
