'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
    Wallet, TrendingDown, TrendingUp, Calendar, ChevronLeft, ChevronRight,
    BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon,
    ArrowUpRight, ArrowDownRight, LayoutDashboard, Filter, Download,
    Loader2, Users, Receipt, CreditCard, Banknote, Coins
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart, Line, LineChart
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const GET_STATS = gql`
  query GetStats($startDate: String!, $endDate: String!) {
    getChiffresByRange(startDate: $startDate, endDate: $endDate) {
      id
      date
      recette_de_caisse
      total_diponce
      diponce
      recette_net
      tpe
      cheque_bancaire
      espaces
      tickets_restaurant
    }
  }
`;

const GET_SALARIES = gql`
  query GetSalaries($startDate: String!, $endDate: String!) {
    getMonthlySalaries(startDate: $startDate, endDate: $endDate) {
      month
      total
    }
  }
`;

const COLORS = ['#c69f6e', '#8c8279', '#4a3426', '#d4c5b0'];

export default function StatistiquesPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ role: 'admin' | 'caissier' } | null>(null);
    const [initializing, setInitializing] = useState(true);

    // Filter States
    const ty = today.getFullYear();
    const tm = String(today.getMonth() + 1).padStart(2, '0');
    const td = String(today.getDate()).padStart(2, '0');
    const todayStr = `${ty}-${tm}-${td}`;

    // Filter States
    const [startDate, setStartDate] = useState(`${ty}-${tm}-01`);
    const [endDate, setEndDate] = useState(todayStr);
    const [aggregation, setAggregation] = useState<'day' | 'month'>('day');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('Tous');

    const [pickingDate, setPickingDate] = useState<'start' | 'end' | null>(null);
    const [viewDate, setViewDate] = useState(new Date());

    const generateCalendarDays = (date: string | Date | number) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = d.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const formatDateDisplay = (dateString: string) => {
        if (!dateString) return '';
        const [y, m, d] = dateString.split('-');
        return `${d}/${m}/${y}`;
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

    const { data, loading, error } = useQuery(GET_STATS, {
        variables: { startDate, endDate },
        skip: !startDate || !endDate
    });

    const { data: salaryData } = useQuery(GET_SALARIES, {
        variables: { startDate, endDate },
        skip: !startDate || !endDate
    });

    const statsData = useMemo(() => {
        if (!data?.getChiffresByRange) return [];

        const raw = data.getChiffresByRange;
        if (aggregation === 'day') {
            return raw.map((d: any) => ({
                name: new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                fullDate: d.date,
                recette: parseFloat(d.recette_de_caisse) || 0,
                depenses: parseFloat(d.total_diponce) || 0,
                net: parseFloat(d.recette_net) || 0,
                tpe: parseFloat(d.tpe) || 0,
                cheque: parseFloat(d.cheque_bancaire) || 0,
                especes: parseFloat(d.espaces) || 0,
                tickets: parseFloat(d.tickets_restaurant) || 0,
            }));
        } else {
            // Aggregate by month
            const months: Record<string, any> = {};
            raw.forEach((d: any) => {
                const m = d.date.substring(0, 7); // YYYY-MM
                if (!months[m]) {
                    months[m] = {
                        name: new Date(d.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                        recette: 0, depenses: 0, net: 0, tpe: 0, cheque: 0, especes: 0, tickets: 0, count: 0
                    };
                }
                months[m].recette += parseFloat(d.recette_de_caisse) || 0;
                months[m].depenses += parseFloat(d.total_diponce) || 0;
                months[m].net += parseFloat(d.recette_net) || 0;
                months[m].tpe += parseFloat(d.tpe) || 0;
                months[m].cheque += parseFloat(d.cheque_bancaire) || 0;
                months[m].especes += parseFloat(d.espaces) || 0;
                months[m].tickets += parseFloat(d.tickets_restaurant) || 0;
                months[m].count += 1;
            });
            return Object.values(months);
        }
    }, [data, aggregation]);

    const totals = useMemo(() => {
        return statsData.reduce((acc: any, curr: any) => ({
            recette: acc.recette + curr.recette,
            depenses: acc.depenses + curr.depenses,
            net: acc.net + curr.net,
            tpe: acc.tpe + curr.tpe,
            cheque: acc.cheque + curr.cheque,
            especes: acc.especes + curr.especes,
            tickets: acc.tickets + curr.tickets,
        }), { recette: 0, depenses: 0, net: 0, tpe: 0, cheque: 0, especes: 0, tickets: 0 });
    }, [statsData]);

    const supplierData = useMemo(() => {
        if (!data?.getChiffresByRange) return [];
        const res: Record<string, number> = {};
        data.getChiffresByRange.forEach((d: any) => {
            const expenses = JSON.parse(d.diponce || '[]');
            expenses.forEach((e: any) => {
                if (e.supplier) {
                    res[e.supplier] = (res[e.supplier] || 0) + (parseFloat(e.amount) || 0);
                }
            });
        });
        return Object.entries(res).map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [data]);

    const intelligentInsights = useMemo(() => {
        if (statsData.length === 0) return null;
        const bestPeriod = [...statsData].sort((a, b) => b.recette - a.recette)[0];
        const worstPeriod = [...statsData].sort((a, b) => a.recette - b.recette)[0];
        const avgNet = totals.net / statsData.length;
        const totalProfitMargin = (totals.net / (totals.recette || 1)) * 100;
        return { bestPeriod, worstPeriod, avgNet, totalProfitMargin };
    }, [statsData, totals]);

    const aggregatedExpensesDetailed = useMemo(() => {
        if (!data?.getChiffresByRange) return { data: [], suppliers: [] };
        let raw = data.getChiffresByRange;

        // Apply Supplier Filter
        if (selectedSupplier !== 'Tous') {
            raw = raw.map((d: any) => {
                const exps = JSON.parse(d.diponce || '[]');
                const filteredExps = exps.filter((e: any) => e.supplier === selectedSupplier);
                return { ...d, diponce: JSON.stringify(filteredExps) };
            });
        }

        const supplierTotals: Record<string, number> = {};
        raw.forEach((d: any) => {
            const exps = JSON.parse(d.diponce || '[]');
            exps.forEach((e: any) => {
                if (!e.supplier) return;
                supplierTotals[e.supplier] = (supplierTotals[e.supplier] || 0) + (parseFloat(e.amount) || 0);
            });
        });

        // Top 10 Suppliers
        const topSuppliers = Object.entries(supplierTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(s => s[0]);

        const aggregated: Record<string, any> = {};
        raw.forEach((d: any) => {
            const key = aggregation === 'day' ? d.date : d.date.substring(0, 7);
            if (!aggregated[key]) {
                aggregated[key] = {
                    name: aggregation === 'day'
                        ? new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                        : new Date(d.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                    Autres: 0,
                };
                topSuppliers.forEach(s => aggregated[key][s] = 0);
            }
            const exps = JSON.parse(d.diponce || '[]');
            exps.forEach((e: any) => {
                const amt = parseFloat(e.amount) || 0;
                if (topSuppliers.includes(e.supplier)) {
                    aggregated[key][e.supplier] += amt;
                } else {
                    aggregated[key].Autres += amt;
                }
            });
        });
        return { data: Object.values(aggregated), suppliers: topSuppliers };
    }, [data, aggregation, selectedSupplier]);

    const supplierColors = [
        '#c69f6e', '#2d6a4f', '#ef4444', '#3b82f6', '#8b5cf6',
        '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#8c8279'
    ];

    const allAvailableSuppliers = useMemo(() => {
        if (!data?.getChiffresByRange) return [];
        const s = new Set<string>();
        data.getChiffresByRange.forEach((d: any) => {
            const exps = JSON.parse(d.diponce || '[]');
            exps.forEach((e: any) => e.supplier && s.add(e.supplier));
        });
        return Array.from(s).sort();
    }, [data]);

    if (initializing || !user) return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
            <Loader2 className="animate-spin text-[#c69f6e]" size={40} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f5f2] text-[#2d241e] font-sans flex">
            <Sidebar role="admin" />

            <div className="flex-1 min-w-0 pb-24 lg:pb-0">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e6dace] py-4 md:py-6 px-4 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-[#4a3426] tracking-tight">Analytique Bey</h1>
                        <p className="text-[10px] md:text-xs text-[#8c8279] font-bold uppercase tracking-widest mt-1">Intelligence & Performance</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {intelligentInsights && (
                            <div className="hidden lg:flex items-center gap-4 mr-4 px-4 py-2 bg-[#2d6a4f]/5 rounded-2xl border border-[#2d6a4f]/10">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-[#2d6a4f] uppercase tracking-tighter">Marge Moyenne</span>
                                    <span className="text-sm font-black text-[#2d6a4f]">{intelligentInsights.totalProfitMargin.toFixed(1)}%</span>
                                </div>
                                <div className="w-px h-6 bg-[#2d6a4f]/20"></div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-[#c69f6e] uppercase tracking-tighter">Meilleure Période</span>
                                    <span className="text-sm font-black text-[#4a3426]">{intelligentInsights.bestPeriod.name}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 bg-[#f4ece4] p-1.5 rounded-2xl border border-[#e6dace]">
                            <button
                                onClick={() => { setPickingDate('start'); setViewDate(new Date(startDate)); }}
                                className="bg-transparent text-sm font-bold text-[#4a3426] p-1 px-3 hover:text-[#c69f6e] transition-colors"
                            >
                                {formatDateDisplay(startDate)}
                            </button>
                            <ChevronRight size={14} className="text-[#c69f6e]" />
                            <button
                                onClick={() => { setPickingDate('end'); setViewDate(new Date(endDate)); }}
                                className="bg-transparent text-sm font-bold text-[#4a3426] p-1 px-3 hover:text-[#c69f6e] transition-colors"
                            >
                                {formatDateDisplay(endDate)}
                            </button>
                        </div>

                        <div className="flex bg-[#f4ece4] p-1 rounded-xl">
                            <button
                                onClick={() => setAggregation('day')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${aggregation === 'day' ? 'bg-[#4a3426] text-white shadow-md' : 'text-[#8c8279]'}`}
                            >
                                Journalier
                            </button>
                            <button
                                onClick={() => setAggregation('month')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${aggregation === 'month' ? 'bg-[#4a3426] text-white shadow-md' : 'text-[#8c8279]'}`}
                            >
                                Mensuel
                            </button>
                        </div>

                        <div className="relative">
                            <select
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.target.value)}
                                className="bg-[#f4ece4] border border-[#e6dace] rounded-xl h-10 px-4 text-xs font-bold text-[#4a3426] outline-none appearance-none cursor-pointer pr-10"
                            >
                                <option value="Tous">Tous les Fournisseurs</option>
                                {allAvailableSuppliers.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <Filter size={14} />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-8 mt-8 space-y-8">
                    {/* Top KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Recette Totale', val: totals.recette, icon: Wallet, color: 'text-green-700', bg: 'bg-green-50' },
                            { label: 'Dépenses Totales', val: totals.depenses, icon: TrendingDown, color: 'text-red-700', bg: 'bg-red-50' },
                            { label: 'Recette Nette', val: totals.net, icon: TrendingUp, color: 'text-blue-700', bg: 'bg-blue-50' },
                            { label: 'Moyenne Recette', val: totals.recette / (statsData.length || 1), icon: BarChart3, color: 'text-[#c69f6e]', bg: 'bg-[#f4ece4]' }
                        ].map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                className="bg-white p-6 rounded-3xl luxury-shadow border border-[#e6dace]/50 group hover:border-[#c69f6e]/50 transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
                                        <s.icon size={20} />
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                        <ArrowUpRight size={12} />
                                        12%
                                    </div>
                                </div>
                                <p className="text-[#8c8279] text-[10px] items-center font-bold uppercase tracking-widest mb-1">{s.label}</p>
                                <h3 className={`text-2xl font-black text-[#4a3426]`}>
                                    {s.val.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} <span className="text-xs font-bold opacity-40">DT</span>
                                </h3>
                            </motion.div>
                        ))}
                    </div>

                    {/* Main Analytics Chart */}
                    <div className="bg-white p-8 rounded-[2.5rem] luxury-shadow border border-[#e6dace]/50 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                            <div>
                                <h3 className="text-xl font-bold text-[#4a3426] flex items-center gap-2">
                                    <LineChartIcon className="text-[#c69f6e]" /> Evolution du CA & Rentabilité
                                </h3>
                                <p className="text-xs text-[#8c8279] mt-1">Analyse détaillée du flux de trésorerie sur la période sélectionnée</p>
                            </div>
                            <button className="flex items-center gap-2 text-xs font-bold text-[#c69f6e] hover:text-[#4a3426] transition-colors">
                                <Download size={16} /> Exporter Rapport
                            </button>
                        </div>

                        <div className="h-[450px] w-full">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="animate-spin text-[#c69f6e]" size={40} />
                                    <p className="text-sm font-bold text-[#8c8279]">Chargement de l'intelligence...</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={statsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRecette" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#c69f6e" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#c69f6e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e6dd" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8c8279', fontSize: 11 }} dy={10} interval={aggregation === 'day' ? (statsData.length > 15 ? 2 : 0) : 0} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8c8279', fontSize: 11 }} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }}
                                            cursor={{ stroke: '#c69f6e', strokeWidth: 2, strokeDasharray: '5 5' }}
                                        />
                                        <Legend verticalAlign="top" height={60} iconType="circle" wrapperStyle={{ paddingBottom: '20px', textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold' }} />

                                        <Bar dataKey="recette" name="Recette Totale" fill="#c69f6e" radius={[10, 10, 0, 0]} barSize={aggregation === 'day' ? 20 : 40} />
                                        <Area type="monotone" dataKey="depenses" name="Dépenses" stroke="#e63946" strokeWidth={2} fillOpacity={0} strokeDasharray="3 3" />
                                        <Line type="monotone" dataKey="net" name="Bénéfice Net" stroke="#2d6a4f" strokeWidth={4} dot={{ r: 4, fill: '#2d6a4f', strokeWidth: 2, stroke: '#fff' }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Multi-charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Suppliers Breakdown */}
                        <div className="bg-white p-8 rounded-[2.5rem] luxury-shadow border border-[#e6dace]/50">
                            <h3 className="text-xl font-bold text-[#4a3426] mb-8 flex items-center gap-2">
                                <LayoutDashboard className="text-[#c69f6e]" /> Top Dépenses Fournisseurs
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={supplierData} layout="vertical" margin={{ left: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0e6dd" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fill: '#4a3426', fontSize: 11, fontWeight: 700 }} />
                                        <RechartsTooltip cursor={{ fill: '#f8f5f2', radius: 10 }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="value" name="Dépenses (DT)" fill="#4a3426" radius={[0, 10, 10, 0]} barSize={20}>
                                            {supplierData.map((_, index) => (
                                                <Cell key={index} fill={index === 0 ? '#c69f6e' : '#4a3426'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Payment Methods Breakdown */}
                        <div className="bg-white p-8 rounded-[2.5rem] luxury-shadow border border-[#e6dace]/50">
                            <h3 className="text-xl font-bold text-[#4a3426] mb-8 flex items-center gap-2">
                                <PieChartIcon className="text-[#c69f6e]" /> Répartition des Encaissements
                            </h3>
                            <div className="h-[300px] w-full flex items-center justify-center relative">
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                    <span className="text-sm font-bold text-[#8c8279] uppercase tracking-tighter">Total</span>
                                    <span className="text-3xl font-black text-[#4a3426]">{totals.recette.toLocaleString()}</span>
                                    <span className="text-xs font-bold text-[#c69f6e]">DT</span>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Espèces', value: totals.especes },
                                                { name: 'Ticket Restau', value: totals.tickets },
                                                { name: 'Chèque', value: totals.cheque },
                                                { name: 'TPE (Carte)', value: totals.tpe },
                                            ]}
                                            innerRadius={85}
                                            outerRadius={110}
                                            paddingAngle={8}
                                            dataKey="value"
                                            cornerRadius={12}
                                        >
                                            {COLORS.map((color, index) => (
                                                <Cell key={index} fill={color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#4a3426', paddingTop: '20px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Charges & Payment Types Chart */}
                    <div className="bg-white p-8 rounded-[2.5rem] luxury-shadow border border-[#e6dace]/50">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-[#4a3426] flex items-center gap-2">
                                <TrendingDown className="text-red-500" /> Analyse des Dépenses & Charges
                            </h3>
                            <p className="text-xs text-[#8c8279] mt-1">Évolution {aggregation === 'day' ? 'journalière' : 'mensuelle'} des charges par fournisseur</p>
                        </div>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={aggregatedExpensesDetailed.data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e6dd" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8c8279', fontSize: 11 }} interval={aggregation === 'day' ? (aggregatedExpensesDetailed.data.length > 15 ? 2 : 0) : 0} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8c8279', fontSize: 11 }} />
                                    <RechartsTooltip
                                        formatter={(val: any) => `${parseFloat(val).toFixed(3)} DT`}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend iconType="circle" />
                                    {aggregatedExpensesDetailed.suppliers.map((s, idx) => (
                                        <Bar key={s} dataKey={s} stackId="a" fill={supplierColors[idx % supplierColors.length]} barSize={aggregation === 'day' ? 20 : 40} />
                                    ))}
                                    <Bar dataKey="Autres" stackId="a" name="Autres Fournisseurs" fill={supplierColors[5]} radius={[5, 5, 0, 0]} barSize={aggregation === 'day' ? 20 : 40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Salary Evolution Chart */}
                    <div className="bg-white p-8 rounded-[2.5rem] luxury-shadow border border-[#e6dace]/50">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-[#4a3426] flex items-center gap-2">
                                <Users className="text-[#c69f6e]" /> Evolution des Salaires
                            </h3>
                            <p className="text-xs text-[#8c8279] mt-1">Somme mensuelle des salaires payés (confirmés)</p>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salaryData?.getMonthlySalaries || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e6dd" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8c8279', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8c8279', fontSize: 11 }} />
                                    <RechartsTooltip
                                        formatter={(val: any) => `${parseFloat(val).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT`}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        name="Total Salaires"
                                        stroke="#2d6a4f"
                                        strokeWidth={4}
                                        dot={{ r: 6, fill: '#2d6a4f', strokeWidth: 3, stroke: '#fff' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Detailed Data Table */}
                    <div className="bg-white rounded-[2.5rem] luxury-shadow border border-[#e6dace]/50 overflow-hidden">
                        <div className="p-8 border-b border-[#e6dace]">
                            <h3 className="text-xl font-bold text-[#4a3426]">Tableau de Données Détaillé</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#fcfaf8] border-b border-[#e6dace]">
                                    <tr>
                                        <th className="px-8 py-5 text-xs font-black text-[#8c8279] uppercase tracking-widest">Période</th>
                                        <th className="px-8 py-5 text-xs font-black text-[#8c8279] uppercase tracking-widest text-right">Recette</th>
                                        <th className="px-8 py-5 text-xs font-black text-[#8c8279] uppercase tracking-widest text-right">Dépenses</th>
                                        <th className="px-8 py-5 text-xs font-black text-[#8c8279] uppercase tracking-widest text-right">Net</th>
                                        <th className="px-8 py-5 text-xs font-black text-[#8c8279] uppercase tracking-widest text-right">Espèces</th>
                                        <th className="px-8 py-5 text-xs font-black text-[#8c8279] uppercase tracking-widest text-right">T. Restau</th>
                                        <th className="px-8 py-5 text-xs font-black text-[#8c8279] uppercase tracking-widest text-right">TPE (Carte)</th>
                                        <th className="px-8 py-5 text-xs font-black text-[#8c8279] uppercase tracking-widest text-right">Chèque</th>
                                        <th className="px-8 py-5 text-xs font-black text-[#8c8279] uppercase tracking-widest text-right text-[#c69f6e]">Rentabilité</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statsData.map((d: any, i: number) => {
                                        const margin = (d.net / (d.recette || 1)) * 100;
                                        return (
                                            <tr key={i} className="border-b border-[#f4ece4] hover:bg-[#fcfaf8] transition-colors">
                                                <td className="px-8 py-5 font-bold text-[#4a3426]">{d.name}</td>
                                                <td className="px-8 py-5 font-bold text-right">{d.recette.toLocaleString()}</td>
                                                <td className="px-8 py-5 font-bold text-right text-red-500">{d.depenses.toLocaleString()}</td>
                                                <td className="px-8 py-5 font-black text-right text-green-700">{d.net.toLocaleString()}</td>
                                                <td className="px-8 py-5 font-bold text-right opacity-60">{d.especes.toLocaleString()}</td>
                                                <td className="px-8 py-5 font-bold text-right opacity-60">{d.tickets.toLocaleString()}</td>
                                                <td className="px-8 py-5 font-bold text-right opacity-60">{d.tpe.toLocaleString()}</td>
                                                <td className="px-8 py-5 font-bold text-right opacity-60">{d.cheque.toLocaleString()}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${margin > 50 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {margin.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div >

            {/* Modern Calendar Modal */}
            <AnimatePresence>
                {
                    pickingDate && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-[2px] flex items-center justify-center" onClick={() => setPickingDate(null)}>
                            <motion.div initial={{ scale: 0.9, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: -20 }} className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-[#c69f6e]/20 w-96 luxury-shadow" onClick={e => e.stopPropagation()}>
                                <div className="text-center mb-6">
                                    <span className="text-[10px] font-black text-[#c69f6e] uppercase tracking-widest">Choisir une Date</span>
                                    <h3 className="text-sm font-bold text-[#8c8279] mt-1">{pickingDate === 'start' ? 'Date de Début' : 'Date de Fin'}</h3>
                                </div>

                                <div className="flex items-center justify-between mb-8">
                                    <button onClick={() => changeMonth(-1)} className="p-2.5 hover:bg-[#f4ece4] rounded-2xl text-[#4a3426] transition-colors"><ChevronLeft size={20} /></button>
                                    <h3 className="text-lg font-black text-[#4a3426] capitalize">{viewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
                                    <button onClick={() => changeMonth(1)} className="p-2.5 hover:bg-[#f4ece4] rounded-2xl text-[#4a3426] transition-colors"><ChevronRight size={20} /></button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-center mb-4">
                                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d, i) => (
                                        <span key={i} className="text-[10px] font-black text-[#bba282] uppercase">{d}</span>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-2">
                                    {generateCalendarDays(viewDate).map((day, i) => {
                                        if (!day) return <div key={i}></div>;

                                        const y = viewDate.getFullYear();
                                        const m = String(viewDate.getMonth() + 1).padStart(2, '0');
                                        const d = String(day).padStart(2, '0');
                                        const currentD = `${y}-${m}-${d}`;

                                        const isSelected = (pickingDate === 'start' ? startDate : endDate) === currentD;

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    if (pickingDate === 'start') setStartDate(currentD);
                                                    else setEndDate(currentD);
                                                    setPickingDate(null);
                                                }}
                                                className={`h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${isSelected ? 'gold-gradient text-white shadow-lg' : 'text-[#4a3426] hover:bg-[#f4ece4] hover:text-[#c69f6e]'}`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 pt-6 border-t border-[#f4ece4] flex justify-center">
                                    <button onClick={() => setPickingDate(null)} className="text-xs font-black text-[#8c8279] uppercase tracking-widest hover:text-[#4a3426] transition-colors">Annuler</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}
