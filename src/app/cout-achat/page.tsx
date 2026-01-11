'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
    LayoutDashboard, Loader2, Calendar,
    Wallet, TrendingUp, TrendingDown, CreditCard, Banknote, Coins, Receipt, Calculator,
    Plus, Zap, Sparkles, Search, ChevronDown, X, Eye, Truck, Download, Clock, Filter, RotateCcw,
    ShoppingBag, AlertCircle, CheckCircle2, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

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

const GET_CHIFFRES_DATA = gql`
  query GetCoutAchatData($startDate: String!, $endDate: String!) {
    getChiffresByRange(startDate: $startDate, endDate: $endDate) {
      diponce
      diponce_divers
      diponce_journalier
      diponce_admin
    }
    getInvoices(startDate: $startDate, endDate: $endDate) {
      id
      supplier_name
      amount
      date
      status
      payment_method
      paid_date
    }
  }
`;

export default function CoutAchatPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ role: 'admin' | 'caissier' } | null>(null);
    const [initializing, setInitializing] = useState(true);

    const today = new Date();
    const startOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const endOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [startDate, setStartDate] = useState(startOfMonth);
    const [endDate, setEndDate] = useState(endOfMonth);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        paid: true,
        unpaid: true
    });

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

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

    const { data, loading } = useQuery(GET_CHIFFRES_DATA, {
        variables: { startDate, endDate },
        skip: !startDate || !endDate
    });

    const aggregates = useMemo(() => {
        if (!data) return null;

        const base = data.getChiffresByRange.reduce((acc: any, curr: any) => {
            return {
                allExpenses: [...acc.allExpenses, ...JSON.parse(curr.diponce || '[]')],
                allDivers: [...acc.allDivers, ...JSON.parse(curr.diponce_divers || '[]')],
                allJournalier: [...acc.allJournalier, ...JSON.parse(curr.diponce_journalier || '[]')],
                allAdmin: [...acc.allAdmin, ...JSON.parse(curr.diponce_admin || '[]')],
            };
        }, {
            allExpenses: [], allDivers: [], allJournalier: [], allAdmin: []
        });

        // Get paid and unpaid invoices directly from getInvoices
        const invoices = data.getInvoices || [];
        const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid');
        const unpaidInvoices = invoices.filter((inv: any) => inv.status === 'pending');

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
            journalier: filterByName(aggregateGroup(base.allJournalier, 'designation', 'amount')),
            fournisseurs: filterByName(aggregateGroup(base.allExpenses, 'supplier', 'amount')),
            divers: filterByName(aggregateGroup(base.allDivers, 'designation', 'amount')),
            admin: filterByName(aggregateGroup(base.allAdmin, 'designation', 'amount')),
            paidInvoices: filterByName(aggregateGroup(paidInvoices, 'supplier_name', 'amount')),
            unpaidInvoices: filterByName(aggregateGroup(unpaidInvoices, 'supplier_name', 'amount')),
            totalPaid: paidInvoices.reduce((a: number, b: any) => a + parseFloat(b.amount), 0),
            totalUnpaid: unpaidInvoices.reduce((a: number, b: any) => a + parseFloat(b.amount), 0)
        };
    }, [data, searchQuery]);

    if (initializing || !user) return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
            <Loader2 className="animate-spin text-[#c69f6e]" size={40} />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#fdfbf7]">
            <Sidebar role={user.role} />

            <div className="flex-1 min-w-0">
                <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#e6dace] py-4 md:py-6 px-4 md:px-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 transition-all z-40">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-[#4a3426] tracking-tight uppercase leading-tight">Coût d'achat & Dépenses</h1>
                        <p className="text-[10px] md:text-xs text-[#8c8279] font-bold uppercase tracking-widest mt-1">Analyse détaillée du {new Date(startDate).toLocaleDateString('fr-FR')} au {new Date(endDate).toLocaleDateString('fr-FR')}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
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

                        <div className="flex items-center gap-2 bg-[#f9f7f5]/80 p-2 rounded-3xl border border-[#e6dace]/50 shadow-sm">
                            <PremiumDatePicker label="DÉBUT" value={startDate} onChange={setStartDate} />
                            <div className="text-[#e6dace] font-black text-[10px] opacity-60">À</div>
                            <PremiumDatePicker label="FIN" value={endDate} onChange={setEndDate} align="right" />
                            <button
                                onClick={() => { setStartDate(startOfMonth); setEndDate(endOfMonth); }}
                                className="w-10 h-10 rounded-2xl bg-white border border-[#e6dace] flex items-center justify-center text-[#c69f6e] hover:bg-[#c69f6e] hover:text-white transition-all shadow-sm"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-4 md:p-8 space-y-8 pb-24">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-[#c69f6e]">
                            <Loader2 className="animate-spin" size={32} />
                            <span className="text-xs font-black uppercase tracking-widest opacity-60">Chargement des données...</span>
                        </div>
                    ) : aggregates && (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                <div className="bg-[#4a3426] p-6 rounded-[2.5rem] text-white shadow-xl shadow-[#4a3426]/20 flex flex-col justify-between min-h-[160px]">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><CheckCircle2 size={24} /></div>
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Payé</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black tracking-tighter">{aggregates.totalPaid.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}</div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">Factures de facturation</p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2.5rem] border border-red-100 flex flex-col justify-between min-h-[160px] shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center"><AlertCircle size={24} /></div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-red-300">Total Impayé</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black tracking-tighter text-red-500">{aggregates.totalUnpaid.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}</div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-300 mt-1">Factures en attente</p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2.5rem] border border-[#e6dace]/50 flex flex-col justify-between min-h-[160px] shadow-sm lg:col-span-2">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 rounded-2xl bg-[#c69f6e]/10 text-[#c69f6e] flex items-center justify-center"><ShoppingBag size={24} /></div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-[#8c8279]">Consommation Totale</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black tracking-tighter text-[#4a3426]">{(aggregates.totalPaid + aggregates.journalier.reduce((a: number, b: any) => a + b.amount, 0) + aggregates.fournisseurs.reduce((a: number, b: any) => a + b.amount, 0) + aggregates.divers.reduce((a: number, b: any) => a + b.amount, 0) + aggregates.admin.reduce((a: number, b: any) => a + b.amount, 0)).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}</div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8c8279] mt-1 text-right">Payé + Dépenses directes</p>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 1. Factures Payées */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button onClick={() => toggleSection('paid')} className="flex justify-between items-center w-full text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#2d6a4f]/10 flex items-center justify-center text-[#2d6a4f] text-sm"><CheckCircle2 /></div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Factures Payées</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Règlements effectués</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 py-2 rounded-xl text-xs font-black text-[#2d6a4f]">
                                                {aggregates.totalPaid.toFixed(3)} DT
                                            </div>
                                            <motion.div animate={{ rotate: expandedSections['paid'] ? 180 : 0 }} className="text-[#c69f6e]"><ChevronDown size={20} /></motion.div>
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {expandedSections['paid'] && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50 text-xs">
                                                    {aggregates.paidInvoices.length > 0 ? aggregates.paidInvoices.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-[#fcfaf8] rounded-xl border border-[#e6dace]/30">
                                                            <span className="font-bold text-[#4a3426] opacity-70">{a.name}</span>
                                                            <span className="font-black text-[#2d6a4f]">{a.amount.toFixed(3)}</span>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40">Aucun paiement</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 2. Factures Non Payées */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button onClick={() => toggleSection('unpaid')} className="flex justify-between items-center w-full text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 text-sm"><AlertCircle /></div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Factures Non Payées</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">En attente de paiement</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 py-2 rounded-xl text-xs font-black text-red-500">
                                                {aggregates.totalUnpaid.toFixed(3)} DT
                                            </div>
                                            <motion.div animate={{ rotate: expandedSections['unpaid'] ? 180 : 0 }} className="text-[#c69f6e]"><ChevronDown size={20} /></motion.div>
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {expandedSections['unpaid'] && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50 text-xs">
                                                    {aggregates.unpaidInvoices.length > 0 ? aggregates.unpaidInvoices.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-red-50/30 rounded-xl border border-red-100">
                                                            <span className="font-bold text-[#4a3426] opacity-70">{a.name}</span>
                                                            <span className="font-black text-red-500">{a.amount.toFixed(3)}</span>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40">Toutes les factures sont payées</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 3. Dépenses Journalières */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button onClick={() => toggleSection('journalier')} className="flex justify-between items-center w-full text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#c69f6e]/10 flex items-center justify-center text-[#c69f6e] text-sm"><Clock /></div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Dépenses Journalieres</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Quotidien & Fonctionnement</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 py-2 rounded-xl text-xs font-black text-[#4a3426]">
                                                {aggregates.journalier.reduce((a: number, b: any) => a + b.amount, 0).toFixed(3)} DT
                                            </div>
                                            <motion.div animate={{ rotate: expandedSections['journalier'] ? 180 : 0 }} className="text-[#c69f6e]"><ChevronDown size={20} /></motion.div>
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {expandedSections['journalier'] && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50 text-xs">
                                                    {aggregates.journalier.length > 0 ? aggregates.journalier.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-[#fcfaf8] rounded-xl border border-[#e6dace]/30">
                                                            <span className="font-bold text-[#4a3426] opacity-70">{a.name}</span>
                                                            <span className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</span>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40">Aucune donnée</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 4. Dépenses Fournisseurs (Directes) */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button onClick={() => toggleSection('fournisseurs')} className="flex justify-between items-center w-full text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#4a3426]/10 flex items-center justify-center text-[#4a3426] text-sm"><Truck /></div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Dépenses Fournisseurs</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Achats directs (Chiffre)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 py-2 rounded-xl text-xs font-black text-[#4a3426]">
                                                {aggregates.fournisseurs.reduce((a: number, b: any) => a + b.amount, 0).toFixed(3)} DT
                                            </div>
                                            <motion.div animate={{ rotate: expandedSections['fournisseurs'] ? 180 : 0 }} className="text-[#c69f6e]"><ChevronDown size={20} /></motion.div>
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {expandedSections['fournisseurs'] && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50 text-xs">
                                                    {aggregates.fournisseurs.length > 0 ? aggregates.fournisseurs.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-[#fcfaf8] rounded-xl border border-[#e6dace]/30">
                                                            <span className="font-bold text-[#4a3426] opacity-70">{a.name}</span>
                                                            <span className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</span>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40">Aucune donnée</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 5. Dépenses Diverses */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button onClick={() => toggleSection('divers')} className="flex justify-between items-center w-full text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#c69f6e]/10 flex items-center justify-center text-[#c69f6e] text-sm"><Sparkles /></div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Dépenses Diverses</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Frais exceptionnels</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 py-2 rounded-xl text-xs font-black text-[#4a3426]">
                                                {aggregates.divers.reduce((a: number, b: any) => a + b.amount, 0).toFixed(3)} DT
                                            </div>
                                            <motion.div animate={{ rotate: expandedSections['divers'] ? 180 : 0 }} className="text-[#c69f6e]"><ChevronDown size={20} /></motion.div>
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {expandedSections['divers'] && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50 text-xs">
                                                    {aggregates.divers.length > 0 ? aggregates.divers.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-[#fcfaf8] rounded-xl border border-[#e6dace]/30">
                                                            <span className="font-bold text-[#4a3426] opacity-70">{a.name}</span>
                                                            <span className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</span>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40">Aucune donnée</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 6. Dépenses Administratif */}
                                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col">
                                    <button onClick={() => toggleSection('admin')} className="flex justify-between items-center w-full text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#4a3426]/10 flex items-center justify-center text-[#4a3426] text-sm"><FileText /></div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Administratif</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Loyers & Charges fixes</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-3 py-2 rounded-xl text-xs font-black text-[#4a3426]">
                                                {aggregates.admin.reduce((a: number, b: any) => a + b.amount, 0).toFixed(3)} DT
                                            </div>
                                            <motion.div animate={{ rotate: expandedSections['admin'] ? 180 : 0 }} className="text-[#c69f6e]"><ChevronDown size={20} /></motion.div>
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {expandedSections['admin'] && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="pt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-dashed border-[#e6dace]/50 text-xs">
                                                    {aggregates.admin.length > 0 ? aggregates.admin.map((a: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center p-3 bg-[#fcfaf8] rounded-xl border border-[#e6dace]/30">
                                                            <span className="font-bold text-[#4a3426] opacity-70">{a.name}</span>
                                                            <span className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</span>
                                                        </div>
                                                    )) : <div className="py-10 text-center italic text-[#8c8279] opacity-40">Aucune donnée</div>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

function ChevronLeft({ size, className }: { size: number, className?: string }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6" /></svg>;
}

function ChevronRight({ size, className }: { size: number, className?: string }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>;
}
