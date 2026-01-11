'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
    LayoutDashboard, Loader2, Calendar,
    Wallet, TrendingUp, TrendingDown, CreditCard, Banknote, Coins, Receipt, Calculator,
    Plus, Zap, Sparkles, Search, ChevronLeft, ChevronRight, ChevronDown, X, Eye, Truck, Download, Clock, Filter, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useRef } from 'react';

// --- Premium Date Picker Component ---
const PremiumDatePicker = ({ value, onChange, label, align = 'left' }: { value: string, onChange: (val: string) => void, label: string, align?: 'left' | 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const daysInMonth = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const days = [];
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        for (let i = 0; i < offset; i++) days.push(null);
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) days.push(new Date(year, month, i));
        return days;
    }, [viewDate]);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const openUp = window.innerHeight - rect.bottom < 350;
            setCoords({
                top: openUp ? rect.top - 340 : rect.bottom + 12,
                left: align === 'right' ? rect.right - 320 : rect.left
            });
        }
    }, [isOpen, align]);

    const CalendarPopup = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999]">
                    <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ top: coords.top, left: coords.left }}
                        className="fixed bg-white rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] border border-[#e6dace] p-6 w-[320px]"
                    >
                        <div className="flex justify-between items-center mb-6 px-1">
                            <button type="button" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2.5 hover:bg-[#fcfaf8] rounded-2xl text-[#c69f6e] transition-colors"><ChevronLeft size={20} /></button>
                            <span className="text-sm font-black text-[#4a3426] uppercase tracking-[0.1em] text-center flex-1">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                            <button type="button" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2.5 hover:bg-[#fcfaf8] rounded-2xl text-[#c69f6e] transition-colors"><ChevronRight size={20} /></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-3 text-center">
                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i} className="text-[10px] font-black text-[#bba282] uppercase tracking-widest opacity-40">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {daysInMonth.map((day, i) => {
                                if (!day) return <div key={`empty-${i}`} />;
                                const y = day.getFullYear();
                                const m = String(day.getMonth() + 1).padStart(2, '0');
                                const d = String(day.getDate()).padStart(2, '0');
                                const dStr = `${y}-${m}-${d}`;
                                const isSelected = value === dStr;
                                return (
                                    <button key={i} type="button"
                                        onClick={() => { onChange(dStr); setIsOpen(false); }}
                                        className={`h-10 w-10 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center relative
                                            ${isSelected ? `bg-[#c69f6e] text-white shadow-lg shadow-[#c69f6e]/30` : `text-[#4a3426] hover:bg-[#fcfaf8] border border-transparent hover:border-[#e6dace]`}`}
                                    >
                                        {day.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    const formatDateToDisplay = (dateStr: string) => {
        if (!dateStr) return 'JJ/MM/AAAA';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 bg-white hover:bg-[#fcfaf8] border border-[#e6dace] rounded-2xl px-4 py-1.5 h-12 transition-all w-full md:w-44 group shadow-sm hover:border-[#c69f6e]`}
            >
                <div className={`w-8 h-8 rounded-xl bg-[#c69f6e]/10 flex items-center justify-center text-[#c69f6e]`}>
                    <Calendar size={14} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#bba282] opacity-60 leading-none mb-1">{label}</span>
                    <span className="text-[11px] font-black text-[#4a3426] tracking-tight truncate leading-none">
                        {formatDateToDisplay(value)}
                    </span>
                </div>
            </button>
            {typeof document !== 'undefined' && createPortal(CalendarPopup, document.body)}
        </div>
    );
};

const GET_CHIFFRES_MONTHLY = gql`
  query GetChiffresRange($startDate: String!, $endDate: String!) {
    getChiffresByRange(startDate: $startDate, endDate: $endDate) {
      recette_de_caisse
      total_diponce
      diponce
      recette_net
      tpe
      cheque_bancaire
      espaces
      tickets_restaurant
      extra
      primes
      avances_details { username montant }
      doublages_details { username montant }
      extras_details { username montant }
      primes_details { username montant }
      diponce_divers
      diponce_journalier
      diponce_admin
    }
  }
`;

const GET_INVOICES = gql`
    query GetInvoices($supplierName: String, $startDate: String, $endDate: String) {
    getInvoices(supplierName: $supplierName, startDate: $startDate, endDate: $endDate) {
      id
      supplier_name
      amount
      date
      photo_url
      photos
      photo_cheque_url
      photo_verso_url
      status
      payment_method
      paid_date
    }
  }
`;

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ role: 'admin' | 'caissier' } | null>(null);
    const [initializing, setInitializing] = useState(true);

    // Default to current month
    const today = new Date();
    const [pickerYear, setPickerYear] = useState(today.getFullYear());
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [viewingData, setViewingData] = useState<any>(null);

    // Filter dates
    const startOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const endOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [startDate, setStartDate] = useState(startOfMonth);
    const [endDate, setEndDate] = useState(endOfMonth);

    // Search filters for each category
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    useEffect(() => {
        const savedUser = localStorage.getItem('bb_user');
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed.role !== 'admin') {
                router.push('/');
            } else {
                setUser(parsed);
            }
        } else {
            router.push('/');
        }
        setInitializing(false);
    }, [router]);

    const dateRange = useMemo(() => {
        return { start: startDate, end: endDate };
    }, [startDate, endDate]);

    const { data, loading } = useQuery(GET_CHIFFRES_MONTHLY, {
        variables: { startDate: dateRange.start, endDate: dateRange.end },
        skip: !dateRange.start
    });

    const aggregates = useMemo(() => {
        if (!data?.getChiffresByRange) return null;

        const base = data.getChiffresByRange.reduce((acc: any, curr: any) => {
            return {
                recette_de_caisse: acc.recette_de_caisse + parseFloat(curr.recette_de_caisse || '0'),
                total_diponce: acc.total_diponce + parseFloat(curr.total_diponce || '0'),
                recette_net: acc.recette_net + parseFloat(curr.recette_net || '0'),
                tpe: acc.tpe + parseFloat(curr.tpe || '0'),
                cheque_bancaire: acc.cheque_bancaire + parseFloat(curr.cheque_bancaire || '0'),
                espaces: acc.espaces + parseFloat(curr.espaces || '0'),
                tickets_restaurant: acc.tickets_restaurant + parseFloat(curr.tickets_restaurant || '0'),
                extra: acc.extra + parseFloat(curr.extra || '0'),
                primes: acc.primes + parseFloat(curr.primes || '0'),

                // Accumulate details
                allExpenses: [...acc.allExpenses, ...JSON.parse(curr.diponce || '[]')],
                allAvances: [...acc.allAvances, ...curr.avances_details],
                allDoublages: [...acc.allDoublages, ...curr.doublages_details],
                allExtras: [...acc.allExtras, ...curr.extras_details],
                allPrimes: [...acc.allPrimes, ...curr.primes_details],
                allDivers: [...acc.allDivers, ...JSON.parse(curr.diponce_divers || '[]')],
                allJournalier: [...acc.allJournalier, ...JSON.parse(curr.diponce_journalier || '[]')],
                allAdmin: [...acc.allAdmin, ...JSON.parse(curr.diponce_admin || '[]')],
            };
        }, {
            recette_de_caisse: 0, total_diponce: 0, recette_net: 0,
            tpe: 0, cheque_bancaire: 0, espaces: 0, tickets_restaurant: 0,
            extra: 0, primes: 0,
            allExpenses: [], allAvances: [], allDoublages: [], allExtras: [], allPrimes: [],
            allDivers: [], allJournalier: [], allAdmin: []
        });

        // Grouping function
        const aggregateGroup = (list: any[], nameKey: string, amountKey: string) => {
            const map = new Map();
            list.forEach(item => {
                const name = item[nameKey];
                if (!name) return;
                const amt = parseFloat(item[amountKey] || '0');
                map.set(name, (map.get(name) || 0) + amt);
            });
            return Array.from(map.entries())
                .map(([name, amount]) => ({ name, amount }))
                .filter(x => x.amount > 0)
                .sort((a, b) => b.amount - a.amount);
        };

        const filterByName = (list: any[]) => {
            if (!searchQuery) return list;
            return list.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        };

        return {
            ...base,
            groupedExpenses: filterByName(aggregateGroup(base.allExpenses, 'supplier', 'amount')),
            groupedJournalier: filterByName(aggregateGroup(base.allJournalier, 'designation', 'amount')),
            groupedDivers: filterByName(aggregateGroup(base.allDivers, 'designation', 'amount')),
            groupedAdmin: filterByName(aggregateGroup(base.allAdmin, 'designation', 'amount')),
            groupedAvances: filterByName(aggregateGroup(base.allAvances, 'username', 'montant')),
            groupedDoublages: filterByName(aggregateGroup(base.allDoublages, 'username', 'montant')),
            groupedExtras: filterByName(aggregateGroup(base.allExtras, 'username', 'montant')),
            groupedPrimes: filterByName(aggregateGroup(base.allPrimes, 'username', 'montant')),
        };
    }, [data, searchQuery]);

    // Query for selected supplier invoices
    const { data: invoiceData, loading: loadingInvoices } = useQuery(GET_INVOICES, {
        variables: {
            supplierName: selectedSupplier || undefined,
            startDate: dateRange.start,
            endDate: dateRange.end
        },
        skip: !selectedSupplier
    });

    if (initializing || !user) return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
            <Loader2 className="animate-spin text-[#c69f6e]" size={40} />
        </div>
    );

    const monthDisplay = new Date(dateRange.start).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return (
        <div className="flex min-h-screen bg-[#fdfbf7]">
            <Sidebar role={user.role} />

            <div className="flex-1 min-w-0">
                <header className={`sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#e6dace] py-4 md:py-6 px-4 md:px-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 transition-all z-40`}>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-[#4a3426] tracking-tight uppercase leading-tight">Dashboard Analytique</h1>
                        <p className="text-[10px] md:text-xs text-[#8c8279] font-bold uppercase tracking-widest mt-1">Données du {new Date(startDate).toLocaleDateString('fr-FR')} au {new Date(endDate).toLocaleDateString('fr-FR')}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
                        {/* Search Input */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c69f6e]/50" size={16} />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 md:h-12 pl-10 pr-4 bg-[#fcfaf8] border border-[#e6dace] rounded-2xl text-xs font-bold text-[#4a3426] outline-none focus:border-[#c69f6e] transition-all"
                            />
                        </div>

                        {/* PÉRIODE SELECTION - Standard Start/End Date Pickers */}
                        <div className="flex items-center gap-2 bg-[#f9f7f5]/80 p-2 rounded-3xl border border-[#e6dace]/50 shadow-sm">
                            <div className="hidden lg:block px-3">
                                <span className="text-[10px] font-black text-[#c69f6e] uppercase tracking-[0.2em]">Période</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <PremiumDatePicker label="DÉBUT" value={startDate} onChange={setStartDate} />
                                <div className="text-[#e6dace] font-black text-[10px] opacity-60">À</div>
                                <PremiumDatePicker label="FIN" value={endDate} onChange={setEndDate} align="right" />
                            </div>

                            <button
                                onClick={() => {
                                    setStartDate(startOfMonth);
                                    setEndDate(endOfMonth);
                                }}
                                className="w-10 h-10 rounded-2xl bg-white border border-[#e6dace] flex items-center justify-center text-[#c69f6e] hover:bg-[#c69f6e] hover:text-white transition-all shadow-sm group"
                                title="Réinitialiser (Ce mois)"
                            >
                                <RotateCcw size={16} className="group-active:rotate-180 transition-transform" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-4 md:px-6 mt-6 md:mt-8 pb-20">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-[#c69f6e]" size={50} />
                            <p className="font-bold text-[#8c8279] animate-pulse">Calcul des statistiques du mois...</p>
                        </div>
                    ) : aggregates ? (
                        <div className="space-y-12">
                            {/* 1. Recette De Caisse (Hero) */}
                            <section className="bg-[#f0faf5] rounded-[2.5rem] p-6 md:p-10 lg:p-12 luxury-shadow border border-[#d1fae5] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                                <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-16 lg:gap-20 relative z-10 w-full max-w-5xl mx-auto">
                                    <div className="text-center md:text-left flex flex-col gap-1">
                                        <div className="text-[#2d6a4f] text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-40">Performance du mois</div>
                                        <div className="text-3xl md:text-4xl lg:text-5xl font-black text-[#2d6a4f] leading-none tracking-tighter capitalize">
                                            Période Sélectionnée
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center md:items-end w-full">
                                        <div className="bg-white/40 md:bg-transparent p-6 md:p-0 rounded-[2rem] border border-white md:border-transparent w-full md:w-auto">
                                            <div className="flex items-center justify-center md:justify-end gap-2 mb-2 text-[#8c8279]">
                                                <Wallet size={16} className="text-[#2d6a4f]" strokeWidth={2.5} />
                                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#4a3426]">Recette Caisse Cumulée</span>
                                            </div>
                                            <div className="flex items-baseline justify-center md:justify-end gap-2 flex-wrap">
                                                <div className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-[#4a3426] tracking-tighter">
                                                    {aggregates.recette_de_caisse.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                </div>
                                                <span className="text-base sm:text-lg md:text-2xl font-black text-[#c69f6e] opacity-60">DT</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 2. Unified Grid for All Expense Categories */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 1.1 Dépenses Journalier */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button
                                        onClick={() => toggleSection('journalier')}
                                        className="flex justify-between items-center w-full text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#c69f6e]/10 flex items-center justify-center text-[#c69f6e]">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Dépenses Journalier</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Quotidien & Fonctionnement</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 md:px-4 py-2 rounded-xl">
                                                <span className="text-[13px] md:text-sm font-black text-[#4a3426]">
                                                    {aggregates.groupedJournalier.reduce((a: number, b: any) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                </span>
                                                <span className="text-[9px] md:text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedSections['journalier'] ? 180 : 0 }}
                                                className="text-[#c69f6e]"
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections['journalier'] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50">
                                                    {aggregates.groupedJournalier.length > 0 ? aggregates.groupedJournalier.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-[#fcfaf8] rounded-xl border border-[#e6dace]/30 group hover:bg-white hover:border-[#c69f6e]/30 transition-all">
                                                            <span className="font-bold text-[#4a3426] text-sm opacity-70 group-hover:opacity-100 transition-opacity truncate max-w-[60%]">{a.name}</span>
                                                            <span className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</span>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40 text-xs">Aucune donnée</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 1.2 Dépenses Fournisseur */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button
                                        onClick={() => toggleSection('fournisseurs')}
                                        className="flex justify-between items-center w-full text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#4a3426]/10 flex items-center justify-center text-[#4a3426]">
                                                <Truck size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Dépenses Fournisseurs</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Marchandises & Services</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 md:px-4 py-2 rounded-xl">
                                                <span className="text-[13px] md:text-sm font-black text-[#4a3426]">
                                                    {aggregates.groupedExpenses.reduce((a: number, b: any) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                </span>
                                                <span className="text-[9px] md:text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedSections['fournisseurs'] ? 180 : 0 }}
                                                className="text-[#4a3426]"
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections['fournisseurs'] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50">
                                                    {aggregates.groupedExpenses.length > 0 ? aggregates.groupedExpenses.map((a: any, i: number) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setSelectedSupplier(a.name)}
                                                            className="w-full flex justify-between items-center p-3 bg-[#fcfaf8] rounded-xl border border-[#e6dace]/30 group hover:bg-[#4a3426] transition-all"
                                                        >
                                                            <span className="font-bold text-[#4a3426] text-sm group-hover:text-white transition-colors truncate max-w-[60%]">{a.name}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-[#4a3426] group-hover:text-white transition-colors">{a.amount.toFixed(3)}</span>
                                                                <Eye size={12} className="text-[#c69f6e] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                        </button>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40 text-xs">Aucune donnée</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 1.3 Dépenses Divers */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button
                                        onClick={() => toggleSection('divers')}
                                        className="flex justify-between items-center w-full text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#c69f6e]/10 flex items-center justify-center text-[#c69f6e]">
                                                <Sparkles size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Dépenses Divers</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Frais Exceptionnels</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 md:px-4 py-2 rounded-xl">
                                                <span className="text-[13px] md:text-sm font-black text-[#4a3426]">
                                                    {aggregates.groupedDivers.reduce((a: number, b: any) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                </span>
                                                <span className="text-[9px] md:text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedSections['divers'] ? 180 : 0 }}
                                                className="text-[#c69f6e]"
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections['divers'] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50">
                                                    {aggregates.groupedDivers.length > 0 ? aggregates.groupedDivers.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-[#fcfaf8] rounded-xl border border-[#e6dace]/30 group hover:bg-white hover:border-[#c69f6e]/30 transition-all">
                                                            <span className="font-bold text-[#4a3426] text-sm opacity-70 group-hover:opacity-100 transition-opacity truncate max-w-[60%]">{a.name}</span>
                                                            <span className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</span>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40 text-xs">Aucune donnée</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 1.4 Dépenses Administratif */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button
                                        onClick={() => toggleSection('administratif')}
                                        className="flex justify-between items-center w-full text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#4a3426]/10 flex items-center justify-center text-[#4a3426]">
                                                <LayoutDashboard size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Dépenses Administratif</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Loyers, Factures & Bur.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 md:px-4 py-2 rounded-xl">
                                                <span className="text-[13px] md:text-sm font-black text-[#4a3426]">
                                                    {aggregates.groupedAdmin.reduce((a: number, b: any) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                </span>
                                                <span className="text-[9px] md:text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedSections['administratif'] ? 180 : 0 }}
                                                className="text-[#4a3426]"
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections['administratif'] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50">
                                                    {aggregates.groupedAdmin.length > 0 ? aggregates.groupedAdmin.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-[#fcfaf8] rounded-xl border border-[#e6dace]/30 group hover:bg-white hover:border-[#c69f6e]/30 transition-all">
                                                            <span className="font-bold text-[#4a3426] text-sm opacity-70 group-hover:opacity-100 transition-opacity truncate max-w-[60%]">{a.name}</span>
                                                            <span className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</span>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40 text-xs">Aucune donnée</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 2.1 Accompte */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button
                                        onClick={() => toggleSection('accompte')}
                                        className="flex justify-between items-center w-full text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#a89284]/10 flex items-center justify-center text-[#a89284]">
                                                <Calculator size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Accompte</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Avances sur salaires</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 md:px-4 py-2 rounded-xl">
                                                <span className="text-[13px] md:text-sm font-black text-[#4a3426]">
                                                    {aggregates.groupedAvances.reduce((a: number, b: any) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                </span>
                                                <span className="text-[9px] md:text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedSections['accompte'] ? 180 : 0 }}
                                                className="text-[#a89284]"
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections['accompte'] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50">
                                                    {aggregates.groupedAvances.length > 0 ? aggregates.groupedAvances.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-[#f9f6f2] rounded-xl border border-transparent">
                                                            <span className="font-medium text-[#4a3426] text-sm opacity-70">{a.name}</span>
                                                            <b className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</b>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40 text-xs">Aucune donnée</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 2.2 Doublage */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button
                                        onClick={() => toggleSection('doublage')}
                                        className="flex justify-between items-center w-full text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#4a3426]/10 flex items-center justify-center text-[#4a3426]">
                                                <TrendingUp size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Doublage</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Heures supplémentaires</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 md:px-4 py-2 rounded-xl">
                                                <span className="text-[13px] md:text-sm font-black text-[#4a3426]">
                                                    {aggregates.groupedDoublages.reduce((a: number, b: any) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                </span>
                                                <span className="text-[9px] md:text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedSections['doublage'] ? 180 : 0 }}
                                                className="text-[#4a3426]"
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections['doublage'] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50">
                                                    {aggregates.groupedDoublages.length > 0 ? aggregates.groupedDoublages.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-[#f9f6f2] rounded-xl border border-transparent">
                                                            <span className="font-medium text-[#4a3426] text-sm opacity-70">{a.name}</span>
                                                            <b className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</b>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40 text-xs">Aucune donnée</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 2.3 Extra */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button
                                        onClick={() => toggleSection('extra')}
                                        className="flex justify-between items-center w-full text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#c69f6e]/10 flex items-center justify-center text-[#c69f6e]">
                                                <Zap size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Extra</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Main d'œuvre occasionnelle</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 md:px-4 py-2 rounded-xl">
                                                <span className="text-[13px] md:text-sm font-black text-[#4a3426]">
                                                    {aggregates.groupedExtras.reduce((a: number, b: any) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                </span>
                                                <span className="text-[9px] md:text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedSections['extra'] ? 180 : 0 }}
                                                className="text-[#c69f6e]"
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections['extra'] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50">
                                                    {aggregates.groupedExtras.length > 0 ? aggregates.groupedExtras.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-[#f9f6f2] rounded-xl border border-transparent">
                                                            <span className="font-medium text-[#4a3426] text-sm opacity-70">{a.name}</span>
                                                            <b className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</b>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40 text-xs">Aucune donnée</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 2.4 Primes */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button
                                        onClick={() => toggleSection('primes')}
                                        className="flex justify-between items-center w-full text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#2d6a4f]/10 flex items-center justify-center text-[#2d6a4f]">
                                                <Sparkles size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Primes</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Récompenses & Bonus</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 md:px-4 py-2 rounded-xl">
                                                <span className="text-[13px] md:text-sm font-black text-[#4a3426]">
                                                    {aggregates.groupedPrimes.reduce((a: number, b: any) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                </span>
                                                <span className="text-[9px] md:text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedSections['primes'] ? 180 : 0 }}
                                                className="text-[#2d6a4f]"
                                            >
                                                <ChevronDown size={20} />
                                            </motion.div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedSections['primes'] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50">
                                                    {aggregates.groupedPrimes.length > 0 ? aggregates.groupedPrimes.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-[#f9f6f2] rounded-xl border border-transparent">
                                                            <span className="font-medium text-[#4a3426] text-sm opacity-70">{a.name}</span>
                                                            <b className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</b>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40 text-xs">Aucune donnée</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* 4. TOTALS & RÉPARTITION SUMMARY BOX */}
                            <div className="bg-[#1b4332] rounded-[2.5rem] luxury-shadow relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                                <div className="p-10 md:p-12 border-b border-white/10 relative z-10 flex flex-col gap-12 items-start">
                                    <div className="space-y-1 w-full text-white">
                                        <div className="flex items-center gap-2 opacity-70 mb-2">
                                            <Calculator size={18} />
                                            <span className="text-sm font-black uppercase tracking-[0.2em]">Total Dépenses Mensuel</span>
                                        </div>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter">{aggregates.total_diponce.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}</span>
                                            <span className="text-lg md:text-2xl md:text-3xl font-black opacity-30 uppercase">DT</span>
                                        </div>
                                        <div className="text-xs opacity-40 mt-1 font-medium">
                                            Cumulé sur le mois selectionné
                                        </div>
                                    </div>
                                    <div className="w-full pt-8 border-t border-white/10">
                                        <div className="flex items-center gap-2 opacity-70 mb-3 text-white">
                                            <TrendingUp size={20} />
                                            <span className="text-sm font-black uppercase tracking-[0.2em]">Recette Nette Estimée</span>
                                        </div>
                                        <div className="flex items-baseline gap-4 mt-2">
                                            <span className={`text-4xl sm:text-6xl md:text-9xl lg:text-[10rem] font-black tracking-tighter leading-none transition-all duration-500 ${aggregates.recette_net >= 0 ? 'text-[#c69f6e]' : 'text-red-400'}`}>
                                                {aggregates.recette_net.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                            </span>
                                            <span className="text-xl md:text-3xl md:text-4xl font-black opacity-20 text-white uppercase shrink-0">DT</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 relative z-10">
                                    <h3 className="font-bold text-white mb-6 flex items-center gap-2 uppercase text-[10px] tracking-wider opacity-60">
                                        <Receipt size={14} /> Répartition Mensuelle Finale
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { label: 'TPE (Carte)', icon: CreditCard, val: aggregates.tpe },
                                            { label: 'Espèces', icon: Coins, val: aggregates.espaces },
                                            { label: 'Chèque', icon: Banknote, val: aggregates.cheque_bancaire },
                                            { label: 'T. Restaurant', icon: Receipt, val: aggregates.tickets_restaurant }
                                        ].map((m, i) => (
                                            <div key={i} className="bg-white/10 rounded-2xl p-6 border border-white/10">
                                                <div className="flex flex-col mb-4">
                                                    <div className="p-2 rounded-xl bg-white/10 text-white/60 w-fit mb-2"><m.icon size={20} /></div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{m.label}</span>
                                                </div>
                                                <div className="flex items-baseline gap-2 text-white mt-1">
                                                    <div className="text-2xl md:text-3xl font-black tracking-tighter truncate">
                                                        {m.val.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                    </div>
                                                    <div className="text-[10px] font-black opacity-20 uppercase shrink-0">DT</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-40 text-center text-[#8c8279]">
                            <Calculator size={50} className="mx-auto mb-4 opacity-10" />
                            <p className="font-bold">Aucune donnée disponible pour cette période.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Invoices Modal */}
            <AnimatePresence>
                {selectedSupplier && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-[#1a110a]/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
                        onClick={() => setSelectedSupplier(null)}
                    >
                        {/* High-End Fixed Close Button (Top Right of Screen) */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelectedSupplier(null)}
                            className="fixed top-6 right-6 md:top-10 md:right-10 z-[120] w-14 h-14 flex items-center justify-center group active:scale-95"
                        >
                            <div className="absolute inset-0 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full border border-white/10 transition-colors shadow-2xl"></div>
                            <X size={32} className="text-white/40 group-hover:text-white transition-colors relative z-10" />
                        </motion.button>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col relative"
                        >
                            <div className="p-10 md:p-14 bg-[#4a3426] text-white relative flex justify-between items-center shrink-0 overflow-hidden">
                                {/* Decorative Background Elements */}
                                <div className="absolute top-0 right-0 w-80 h-80 bg-[#c69f6e]/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/20 rounded-full blur-[80px] -ml-30 -mb-30 pointer-events-none"></div>

                                <div className="relative z-10 flex-1">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/10 p-4 rounded-[2rem] backdrop-blur-md border border-white/10 shadow-inner">
                                                <Receipt size={36} className="text-[#c69f6e]" />
                                            </div>
                                            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none max-w-[15ch] md:max-w-none">
                                                {selectedSupplier}
                                            </h2>
                                        </div>

                                        <div className="hidden md:block h-10 w-px bg-white/10"></div>

                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c69f6e]/80 mb-1">Total Mensuel</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black tracking-tighter text-white">
                                                    {aggregates?.groupedExpenses?.find((e: any) => e.name === selectedSupplier)?.amount.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                </span>
                                                <span className="text-sm font-bold text-[#c69f6e]">DT</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#c69f6e] animate-pulse"></div>
                                        <p className="text-[11px] text-white/50 font-bold uppercase tracking-[0.2em]">{monthDisplay}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-[#fdfbf7]">
                                {loadingInvoices ? (
                                    <div className="py-20 flex flex-col items-center gap-4">
                                        <Loader2 className="animate-spin text-[#c69f6e]" size={40} />
                                        <p className="font-bold text-[#8c8279] animate-pulse">Chargement des factures...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {(aggregates?.allExpenses || [])
                                            .filter((e: any) => e.supplier === selectedSupplier && e.paymentMethod !== 'Prélèvement')
                                            .map((inv: any, idx: number) => (
                                                <motion.div
                                                    key={`${inv.invoiceId || 'manual'}-${idx}`}
                                                    whileHover={{ y: -5 }}
                                                    className="bg-white rounded-[2rem] border border-[#e6dace]/50 p-6 relative group overflow-hidden shadow-sm hover:shadow-xl transition-all"
                                                >
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#c69f6e]/5 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                    <div className="relative z-10">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="space-y-1">
                                                                <div className="text-[10px] font-black uppercase text-[#8c8279] tracking-widest flex items-center gap-2">
                                                                    <Calendar size={12} className="text-[#c69f6e]" />
                                                                    {inv.date ? new Date(inv.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'Sans Date'}
                                                                </div>
                                                                <div className="px-2 py-1 rounded-lg text-[8px] font-black uppercase inline-flex items-center gap-1 bg-green-50 text-green-600 border border-green-100">
                                                                    <div className="w-1 h-1 rounded-full bg-green-600"></div>
                                                                    Règlement effectué
                                                                </div>
                                                                <div className="mt-1 text-[8px] font-black text-[#8c8279] uppercase tracking-widest bg-[#f9f7f5] px-2 py-0.5 rounded border border-[#e6dace]/30 w-fit">
                                                                    {inv.paymentMethod}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-2xl font-black text-[#4a3426] tracking-tighter leading-none">
                                                                    {parseFloat(inv.amount).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                                </div>
                                                                <div className="text-[9px] font-black text-[#c69f6e] uppercase tracking-widest mt-1">DT</div>
                                                            </div>
                                                        </div>

                                                        {(() => {
                                                            const hasLegacy = !!(inv.photo_url && inv.photo_url.length > 5);
                                                            const hasCheque = !!((inv.photo_cheque || inv.photo_cheque_url || '').length > 5 || (inv.photo_verso || inv.photo_verso_url || '').length > 5);
                                                            const hasGallery = Array.isArray(inv.invoices) && inv.invoices.length > 0;
                                                            const hasNewPhotos = !!(inv.photos && inv.photos !== '[]' && inv.photos.length > 5);

                                                            if (hasLegacy || hasCheque || hasGallery || hasNewPhotos) {
                                                                return (
                                                                    <button
                                                                        onClick={() => {
                                                                            // Normalize for viewer
                                                                            const normalized = {
                                                                                ...inv,
                                                                                photos: Array.isArray(inv.invoices) ? JSON.stringify(inv.invoices) : (inv.photos || '[]'),
                                                                                photo_cheque_url: inv.photo_cheque || inv.photo_cheque_url,
                                                                                photo_verso_url: inv.photo_verso || inv.photo_verso_url
                                                                            };
                                                                            setViewingData(normalized);
                                                                        }}
                                                                        className="w-full h-12 bg-[#4a3426] hover:bg-[#c69f6e] text-white rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#4a3426]/10 hover:shadow-[#c69f6e]/20"
                                                                    >
                                                                        <Eye size={16} />
                                                                        <span>Justificatifs</span>
                                                                    </button>
                                                                );
                                                            }

                                                            return (
                                                                <div className="w-full h-12 bg-[#f9f7f5] rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#8c8279] border border-dashed border-[#e6dace]">
                                                                    <span>Aucun visuel</span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Viewing Data Modal (Photos) */}
            <AnimatePresence>
                {viewingData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4"
                        onClick={() => setViewingData(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[3rem] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => setViewingData(null)} className="absolute top-8 right-8 p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"><X size={24} /></button>
                            <h3 className="text-2xl font-black mb-8 text-[#4a3426] flex items-center gap-3 uppercase tracking-tighter"><Receipt size={28} className="text-[#c69f6e]" /> Justificatifs de Paiement</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {(() => {
                                    let gallery: string[] = [];
                                    try {
                                        const rawPhotos = viewingData.photos;
                                        // Handle various falsy or stringified null cases
                                        if (rawPhotos && rawPhotos !== 'null' && rawPhotos !== '[]') {
                                            const parsed = typeof rawPhotos === 'string' ? JSON.parse(rawPhotos) : rawPhotos;
                                            gallery = Array.isArray(parsed) ? parsed : [];
                                        }
                                    } catch (e) {
                                        gallery = [];
                                    }

                                    // Collect all unique photos
                                    const allPhotos = [...gallery];
                                    if (viewingData.photo_url && viewingData.photo_url.length > 5 && !allPhotos.includes(viewingData.photo_url)) {
                                        allPhotos.unshift(viewingData.photo_url);
                                    }

                                    if (allPhotos.length === 0 && !viewingData.photo_cheque_url && !viewingData.photo_verso_url) {
                                        return (
                                            <div className="col-span-full py-20 text-center text-[#8c8279] opacity-50 italic font-medium">
                                                Aucun document attaché à cette facture.
                                            </div>
                                        );
                                    }

                                    return allPhotos.map((photo, pIdx) => (
                                        <div key={pIdx} className="space-y-4">
                                            <div className="flex justify-between items-center px-2">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c69f6e]">Document {allPhotos.length > 1 ? pIdx + 1 : ''}</p>
                                                <a
                                                    href={photo}
                                                    download={`document-${pIdx + 1}.png`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-[9px] font-black text-[#c69f6e] uppercase tracking-widest hover:text-[#4a3426] transition-colors bg-[#f9f7f5] px-3 py-1.5 rounded-lg border border-[#e6dace]/30 shadow-sm"
                                                >
                                                    <Download size={12} /> Télécharger
                                                </a>
                                            </div>
                                            <div className="rounded-[2rem] overflow-hidden border border-gray-100 shadow-xl bg-gray-50 aspect-[3/4] md:aspect-auto md:min-h-[400px]">
                                                <img src={photo} className="w-full h-full object-contain" alt={`Document ${pIdx + 1}`} />
                                            </div>
                                        </div>
                                    ));
                                })()}
                                {viewingData.photo_cheque_url && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c69f6e]">Chèque (Recto)</p>
                                            <a
                                                href={viewingData.photo_cheque_url}
                                                download="cheque-recto.png"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-[9px] font-black text-[#c69f6e] uppercase tracking-widest hover:text-[#4a3426] transition-colors bg-[#f9f7f5] px-3 py-1.5 rounded-lg border border-[#e6dace]/30 shadow-sm"
                                            >
                                                <Download size={12} /> Télécharger
                                            </a>
                                        </div>
                                        <div className="rounded-[2rem] overflow-hidden border border-gray-100 shadow-xl bg-gray-50 aspect-video">
                                            <img src={viewingData.photo_cheque_url} className="w-full h-full object-contain" alt="Chèque Recto" />
                                        </div>
                                    </div>
                                )}
                                {viewingData.photo_verso_url && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c69f6e]">Chèque (Verso)</p>
                                            <a
                                                href={viewingData.photo_verso_url}
                                                download="cheque-verso.png"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-[9px] font-black text-[#c69f6e] uppercase tracking-widest hover:text-[#4a3426] transition-colors bg-[#f9f7f5] px-3 py-1.5 rounded-lg border border-[#e6dace]/30 shadow-sm"
                                            >
                                                <Download size={12} /> Télécharger
                                            </a>
                                        </div>
                                        <div className="rounded-[2rem] overflow-hidden border border-gray-100 shadow-xl bg-gray-50 aspect-video">
                                            <img src={viewingData.photo_verso_url} className="w-full h-full object-contain" alt="Chèque Verso" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
