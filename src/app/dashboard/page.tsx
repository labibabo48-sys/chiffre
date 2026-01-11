'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
    LayoutDashboard, Loader2, Calendar,
    Wallet, TrendingUp, TrendingDown, CreditCard, Banknote, Coins, Receipt, Calculator,
    Plus, Zap, Sparkles, Search, ChevronLeft, ChevronRight, X, Eye, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [pickerYear, setPickerYear] = useState(today.getFullYear());
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [viewingData, setViewingData] = useState<any>(null);

    // Search filters for each category
    const [searchQuery, setSearchQuery] = useState('');

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
        const [year, monthNum] = month.split('-').map(Number);
        const start = `${year}-${String(monthNum).padStart(2, '0')}-01`;
        const endDay = new Date(year, monthNum, 0).getDate();
        const end = `${year}-${String(monthNum).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
        return { start, end };
    }, [month]);

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
            };
        }, {
            recette_de_caisse: 0, total_diponce: 0, recette_net: 0,
            tpe: 0, cheque_bancaire: 0, espaces: 0, tickets_restaurant: 0,
            extra: 0, primes: 0,
            allExpenses: [], allAvances: [], allDoublages: [], allExtras: [], allPrimes: [],
            allDivers: []
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
            groupedDivers: filterByName(aggregateGroup(base.allDivers, 'designation', 'amount')),
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
                <header className={`sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#e6dace] py-4 md:py-6 px-4 md:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${showMonthPicker ? 'z-[100]' : 'z-30'}`}>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-[#4a3426] tracking-tight uppercase leading-tight">Dashboard Mensuel</h1>
                        <p className="text-[10px] md:text-xs text-[#8c8279] font-bold uppercase tracking-widest mt-1">Cumulé du {monthDisplay}</p>
                    </div>

                    <div className="flex items-center gap-4 relative w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c69f6e]/50" size={16} />
                            <input
                                type="text"
                                placeholder="Rechercher partout..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 md:h-12 pl-10 pr-4 bg-[#fcfaf8] border border-[#e6dace] rounded-2xl text-xs font-bold text-[#4a3426] outline-none focus:border-[#c69f6e] transition-all"
                            />
                        </div>

                        <button
                            onClick={() => setShowMonthPicker(!showMonthPicker)}
                            className="bg-[#fcfaf8] border border-[#e6dace] rounded-2xl h-11 md:h-12 px-4 md:px-6 flex items-center gap-3 hover:border-[#c69f6e] transition-all group w-full sm:w-auto justify-center sm:justify-start"
                        >
                            <Calendar size={16} className="text-[#c69f6e]" />
                            <span className="font-black text-[#4a3426] uppercase text-[10px] md:text-[11px] tracking-widest">
                                {months[parseInt(month.split('-')[1]) - 1]} {month.split('-')[0]}
                            </span>
                        </button>

                        <AnimatePresence>
                            {showMonthPicker && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute top-full right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-[#e6dace] p-6 z-50 overflow-hidden"
                                    >
                                        <div className="flex justify-between items-center mb-6 px-2">
                                            <button
                                                onClick={() => setPickerYear(v => v - 1)}
                                                className="p-2 hover:bg-[#fcfaf8] rounded-xl text-[#8c8279] transition-colors"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <span className="text-xl font-black text-[#4a3426] tracking-tighter">{pickerYear}</span>
                                            <button
                                                onClick={() => setPickerYear(v => v + 1)}
                                                className="p-2 hover:bg-[#fcfaf8] rounded-xl text-[#8c8279] transition-colors"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            {months.map((m, i) => {
                                                const currentMonth = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                                                const isActive = month === currentMonth;
                                                return (
                                                    <button
                                                        key={m}
                                                        onClick={() => {
                                                            setMonth(currentMonth);
                                                            setShowMonthPicker(false);
                                                        }}
                                                        className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
                                                            ${isActive
                                                                ? 'bg-[#c69f6e] text-white shadow-lg shadow-[#c69f6e]/20'
                                                                : 'text-[#8c8279] hover:bg-[#fcfaf8] hover:text-[#4a3426] border border-transparent hover:border-[#e6dace]'
                                                            }
                                                        `}
                                                    >
                                                        {m.substring(0, 3)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
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
                                            {monthDisplay}
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
                                {/* 1.1 Dépenses Journalier (Divers) */}
                                <div className="bg-white rounded-[2.5rem] p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col min-h-[400px]">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#c69f6e]/10 flex items-center justify-center text-[#c69f6e]">
                                                <Sparkles size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Dépenses Journalier</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Désignations Diverses</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-4 py-2 rounded-xl">
                                            <span className="text-sm font-black text-[#4a3426]">
                                                {aggregates.groupedDivers.reduce((a, b) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                        {aggregates.groupedDivers.length > 0 ? aggregates.groupedDivers.map((a, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-[#fcfaf8] rounded-xl border border-[#e6dace]/30 group hover:bg-white hover:border-[#c69f6e]/30 transition-all">
                                                <span className="font-bold text-[#4a3426] text-sm opacity-70 group-hover:opacity-100 transition-opacity truncate max-w-[60%]">{a.name}</span>
                                                <span className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</span>
                                            </div>
                                        )) : <div className="h-full flex items-center justify-center italic text-[#8c8279] opacity-40 text-sm">Aucune donnée</div>}
                                    </div>
                                </div>

                                {/* 1.2 Dépenses Courantes (Fournisseurs) */}
                                <div className="bg-white rounded-[2.5rem] p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col min-h-[400px]">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#4a3426]/10 flex items-center justify-center text-[#4a3426]">
                                                <Truck size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Fournisseurs</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Dépenses & Charges</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-4 py-2 rounded-xl">
                                            <span className="text-sm font-black text-[#4a3426]">
                                                {aggregates.groupedExpenses.reduce((a, b) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                        {aggregates.groupedExpenses.length > 0 ? aggregates.groupedExpenses.map((a, i) => (
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
                                        )) : <div className="h-full flex items-center justify-center italic text-[#8c8279] opacity-40 text-sm">Aucune donnée</div>}
                                    </div>
                                </div>

                                {/* 2.1 Accompte */}
                                <div className="bg-white rounded-[2.5rem] p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col min-h-[400px]">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#a89284]/10 flex items-center justify-center text-[#a89284]">
                                                <Calculator size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Accompte</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Avances sur salaires</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-4 py-2 rounded-xl">
                                            <span className="text-sm font-black text-[#4a3426]">
                                                {aggregates.groupedAvances.reduce((a, b) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                        {aggregates.groupedAvances.map((a, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-[#f9f6f2] rounded-xl border border-transparent">
                                                <span className="font-medium text-[#4a3426] text-sm opacity-70">{a.name}</span>
                                                <b className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</b>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 2.2 Doublage */}
                                <div className="bg-white rounded-[2.5rem] p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col min-h-[400px]">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#4a3426]/10 flex items-center justify-center text-[#4a3426]">
                                                <TrendingUp size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Doublage</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Heures supplémentaires</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-4 py-2 rounded-xl">
                                            <span className="text-sm font-black text-[#4a3426]">
                                                {aggregates.groupedDoublages.reduce((a, b) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                        {aggregates.groupedDoublages.map((a, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-[#f9f6f2] rounded-xl border border-transparent">
                                                <span className="font-medium text-[#4a3426] text-sm opacity-70">{a.name}</span>
                                                <b className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</b>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 2.3 Extra */}
                                <div className="bg-white rounded-[2.5rem] p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col min-h-[400px]">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#c69f6e]/10 flex items-center justify-center text-[#c69f6e]">
                                                <Zap size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Extra</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Main d'œuvre occasionnelle</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-4 py-2 rounded-xl">
                                            <span className="text-sm font-black text-[#4a3426]">
                                                {aggregates.groupedExtras.reduce((a, b) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                        {aggregates.groupedExtras.map((a, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-[#f9f6f2] rounded-xl border border-transparent">
                                                <span className="font-medium text-[#4a3426] text-sm opacity-70">{a.name}</span>
                                                <b className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</b>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 2.4 Primes */}
                                <div className="bg-white rounded-[2.5rem] p-8 luxury-shadow border border-[#e6dace]/50 flex flex-col min-h-[400px]">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#2d6a4f]/10 flex items-center justify-center text-[#2d6a4f]">
                                                <Sparkles size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#4a3426] text-xs uppercase tracking-widest">Primes</h4>
                                                <p className="text-[8px] font-bold text-[#8c8279] uppercase tracking-[0.2em] mt-0.5">Récompenses & Bonus</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#fdfbf7] border border-[#e6dace]/40 px-4 py-2 rounded-xl">
                                            <span className="text-sm font-black text-[#4a3426]">
                                                {aggregates.groupedPrimes.reduce((a, b) => a + b.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#c69f6e] ml-1">DT</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                        {aggregates.groupedPrimes.map((a, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-[f9f6f2] rounded-xl border border-transparent">
                                                <span className="font-medium text-[#4a3426] text-sm opacity-70">{a.name}</span>
                                                <b className="font-black text-[#4a3426]">{a.amount.toFixed(3)}</b>
                                            </div>
                                        ))}
                                    </div>
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
                                        {invoiceData?.getInvoices?.filter((inv: any) => inv.status === 'paid').map((inv: any) => (
                                            <motion.div
                                                key={inv.id}
                                                whileHover={{ y: -5 }}
                                                className="bg-white rounded-[2rem] border border-[#e6dace]/50 p-6 relative group overflow-hidden shadow-sm hover:shadow-xl transition-all"
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#c69f6e]/5 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] font-black uppercase text-[#8c8279] tracking-widest flex items-center gap-2">
                                                                <Calendar size={12} className="text-[#c69f6e]" />
                                                                {new Date(inv.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                            </div>
                                                            <div className="px-2 py-1 rounded-lg text-[8px] font-black uppercase inline-flex items-center gap-1 bg-green-50 text-green-600 border border-green-100">
                                                                <div className="w-1 h-1 rounded-full bg-green-600"></div>
                                                                Règlement effectué
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-black text-[#4a3426] tracking-tighter leading-none">
                                                                {parseFloat(inv.amount).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                            </div>
                                                            <div className="text-[9px] font-black text-[#c69f6e] uppercase tracking-widest mt-1">DT</div>
                                                        </div>
                                                    </div>

                                                    {(inv.photo_url || inv.photo_cheque_url || inv.photo_verso_url) ? (
                                                        <button
                                                            onClick={() => setViewingData(inv)}
                                                            className="w-full h-12 bg-[#4a3426] hover:bg-[#c69f6e] text-white rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#4a3426]/10 hover:shadow-[#c69f6e]/20"
                                                        >
                                                            <Eye size={16} />
                                                            <span>Justificatifs</span>
                                                        </button>
                                                    ) : (
                                                        <div className="w-full h-12 bg-[#f9f7f5] rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#8c8279] border border-dashed border-[#e6dace]">
                                                            <span>Aucun visuel</span>
                                                        </div>
                                                    )}
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
                                {viewingData.photo_url && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c69f6e] ml-2">Facture / Reçu</p>
                                        <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-xl bg-gray-50">
                                            <img src={viewingData.photo_url} className="w-full h-auto object-contain" alt="Facture" />
                                        </div>
                                    </div>
                                )}
                                {viewingData.photo_cheque_url && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c69f6e] ml-2">Photo Chèque (Recto)</p>
                                        <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-xl bg-gray-50">
                                            <img src={viewingData.photo_cheque_url} className="w-full h-auto object-contain" alt="Chèque Recto" />
                                        </div>
                                    </div>
                                )}
                                {viewingData.photo_verso_url && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c69f6e] ml-2">Photo Chèque (Verso)</p>
                                        <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-xl bg-gray-50">
                                            <img src={viewingData.photo_verso_url} className="w-full h-auto object-contain" alt="Chèque Verso" />
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
