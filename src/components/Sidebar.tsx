'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PieChart as PieChartIcon, Truck, LogOut, CreditCard } from 'lucide-react';

interface SidebarProps {
    role: 'admin' | 'caissier';
}

export default function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Journalier', icon: LayoutDashboard, href: '/' },
        { name: 'Facturation', icon: CreditCard, href: '/facturation' },
        { name: 'Fournisseurs', icon: Truck, href: '/fournisseurs' },
    ];

    if (role === 'admin') {
        navItems.unshift({ name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' });
        navItems.push({ name: 'Statistiques', icon: PieChartIcon, href: '/statistiques' });
        navItems.push({ name: 'Paiements', icon: CreditCard, href: '/paiements' });
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex sticky top-0 h-screen w-64 bg-white border-r border-[#e6dace] flex-col justify-between py-8 px-4 z-40 transition-all duration-300">
                <div>
                    <div className="flex flex-col items-start mb-12 px-2">
                        <div className="relative w-12 h-12 mb-4">
                            <Image src="/logo.jpeg" alt="Logo" fill className="rounded-full shadow-md border-2 border-white object-cover" />
                        </div>
                        <div>
                            <h1 className="font-bold text-[#4a3426] text-lg">Business Bey</h1>
                            <p className="text-[10px] uppercase tracking-widest text-[#8c8279]">
                                {role === 'admin' ? 'Administration' : 'Gestion Caisse'}
                            </p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${isActive ? 'bg-[#4a3426] text-white shadow-lg' : 'text-[#8c8279] hover:bg-[#fcf8f4]'}`}
                                >
                                    <item.icon size={20} />
                                    <span className="font-bold text-sm">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <button
                    onClick={() => {
                        localStorage.removeItem('bb_user');
                        window.location.href = '/';
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all mt-auto group"
                >
                    <div className="group-hover:rotate-12 transition-transform">
                        <LogOut size={20} />
                    </div>
                    <span className="font-bold text-sm">Déconnexion</span>
                </button>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-[#e6dace] py-2 flex items-center z-[60] shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.05)] overflow-x-auto scrollbar-hide px-4 gap-2 no-scrollbar">
                <div className="flex items-center gap-1 min-w-max mx-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 p-3 min-w-[70px] rounded-2xl transition-all ${isActive ? 'text-[#4a3426] bg-[#fcf8f4]' : 'text-[#a89284]'}`}
                            >
                                <item.icon size={20} className={isActive ? 'scale-110' : ''} />
                                <span className="text-[10px] font-black uppercase tracking-tighter">{item.name}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => {
                            localStorage.removeItem('bb_user');
                            window.location.href = '/';
                        }}
                        className="flex flex-col items-center gap-1 p-3 min-w-[70px] text-red-400"
                    >
                        <LogOut size={20} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Exit</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
