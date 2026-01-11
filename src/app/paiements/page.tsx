'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
    CreditCard, Loader2, Search, Calendar,
    ArrowUpRight, Download, Filter, User,
    TrendingUp, Receipt, Wallet, UploadCloud, Coins, Banknote,
    ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Components & Utilities ---

const formatDateToDisplay = (dateStr: string) => {
    if (!dateStr) return 'JJ/MM/AAAA';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

const PremiumDatePicker = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());

    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const daysInMonth = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const days = [];

        // Offset for Monday start (0 is Sunday, 1 is Monday...)
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        for (let i = 0; i < offset; i++) days.push(null);

        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) days.push(new Date(year, month, i));

        return days;
    }, [viewDate]);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white/50 hover:bg-white border border-[#e6dace] rounded-xl px-3 py-2 transition-all min-w-[130px] group"
            >
                <Calendar size={14} className="text-[#c69f6e]" />
                <span className="text-[11px] font-black text-[#4a3426] tracking-tight truncate">
                    {formatDateToDisplay(value)}
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 mt-3 bg-white rounded-3xl shadow-2xl border border-[#e6dace] p-5 z-[110] w-72"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <button
                                    type="button"
                                    onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}
                                    className="p-1.5 hover:bg-[#fcfaf8] rounded-xl text-[#8c8279]"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-xs font-black text-[#4a3426] uppercase tracking-widest">
                                    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}
                                    className="p-1.5 hover:bg-[#fcfaf8] rounded-xl text-[#8c8279]"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                                    <div key={i} className="text-[9px] font-bold text-[#c69f6e] text-center">{d}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {daysInMonth.map((day, i) => {
                                    if (!day) return <div key={`empty-${i}`} />;
                                    const dStr = day.toISOString().split('T')[0];
                                    const isSelected = value === dStr;
                                    const isToday = new Date().toISOString().split('T')[0] === dStr;

                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                onChange(dStr);
                                                setIsOpen(false);
                                            }}
                                            className={`
                                                h-8 w-8 rounded-lg text-[10px] font-black transition-all flex items-center justify-center
                                                ${isSelected
                                                    ? 'bg-[#c69f6e] text-white shadow-lg shadow-[#c69f6e]/30'
                                                    : 'text-[#4a3426] hover:bg-[#fcfaf8] border border-transparent hover:border-[#e6dace]'
                                                }
                                                ${isToday && !isSelected ? 'text-[#c69f6e] !border-[#c69f6e]/30' : ''}
                                            `}
                                        >
                                            {day.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- End Helper Components ---

const GET_PAYMENT_DATA = gql`
  query GetPaymentData($month: String, $startDate: String, $endDate: String) {
    getPaidUsers(month: $month, startDate: $startDate, endDate: $endDate) {
      username
      amount
    }
    getPaymentStats(month: $month, startDate: $startDate, endDate: $endDate) {
      totalRecetteNette
      totalFacturesPayees
      totalTPE
      totalCheque
      totalCash
      totalBankDeposits
    }
    getBankDeposits(month: $month, startDate: $startDate, endDate: $endDate) {
      id
      amount
      date
    }
    getInvoices(month: $month, startDate: $startDate, endDate: $endDate) {
      id
      supplier_name
      amount
      date
      photo_url
      photo_cheque_url
      photo_verso_url
      payment_method
      paid_date
    }
  }
`;

const ADD_BANK_DEPOSIT = gql`
  mutation AddBankDeposit($amount: String!, $date: String!) {
    addBankDeposit(amount: $amount, date: $date) {
      id
    }
  }
`;

const ADD_PAID_INVOICE = gql`
  mutation AddPaidInvoice($supplier_name: String!, $amount: String!, $date: String!, $photo_url: String, $photo_cheque_url: String, $photo_verso_url: String, $payment_method: String!, $paid_date: String!) {
    addPaidInvoice(supplier_name: $supplier_name, amount: $amount, date: $date, photo_url: $photo_url, photo_cheque_url: $photo_cheque_url, photo_verso_url: $photo_verso_url, payment_method: $payment_method, paid_date: $paid_date) {
      id
    }
  }
`;

export default function PaiementsPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ role: 'admin' | 'caissier' } | null>(null);
    const [initializing, setInitializing] = useState(true);

    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Date Range State
    const [month, setMonth] = useState<string | null>(currentMonthStr);
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });
    const [activeFilter, setActiveFilter] = useState<'month' | 'week' | 'year' | 'custom'>('month');

    const [search, setSearch] = useState('');
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [pickerYear, setPickerYear] = useState(today.getFullYear());

    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // Forms State
    const [bankAmount, setBankAmount] = useState('');
    const [bankDate, setBankDate] = useState(today.toISOString().split('T')[0]);
    const [showBankForm, setShowBankForm] = useState(false);

    const [expName, setExpName] = useState('');
    const [expAmount, setExpAmount] = useState('');
    const [expDate, setExpDate] = useState(today.toISOString().split('T')[0]);
    const [expMethod, setExpMethod] = useState('Espèces');
    const [expPhoto, setExpPhoto] = useState('');
    const [expPhotoCheque, setExpPhotoCheque] = useState('');
    const [expPhotoVerso, setExpPhotoVerso] = useState('');
    const [showExpForm, setShowExpForm] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

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

    const { data, loading, refetch } = useQuery(GET_PAYMENT_DATA, {
        variables: {
            month: activeFilter === 'month' ? month : null,
            startDate: activeFilter !== 'month' ? dateRange.start : null,
            endDate: activeFilter !== 'month' ? dateRange.end : null
        }
    });

    const setThisWeek = () => {
        const now = new Date();
        const first = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1); // Monday

        const firstday = new Date(new Date().setDate(first)).toISOString().split('T')[0];
        const lastday = new Date().toISOString().split('T')[0];

        setDateRange({ start: firstday, end: lastday });
        setActiveFilter('week');
        setMonth(null);
    };

    const setThisYear = () => {
        const now = new Date();
        const firstday = `${now.getFullYear()}-01-01`;
        const lastday = new Date().toISOString().split('T')[0];

        setDateRange({ start: firstday, end: lastday });
        setActiveFilter('year');
        setMonth(null);
    };

    const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
        setDateRange(prev => ({ ...prev, [type]: val }));
        setActiveFilter('custom');
        setMonth(null);
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const [addBankDeposit, { loading: addingBank }] = useMutation(ADD_BANK_DEPOSIT);
    const [addPaidInvoice, { loading: addingExp }] = useMutation(ADD_PAID_INVOICE);

    const filteredUsers = useMemo(() => {
        if (!data?.getPaidUsers) return [];
        return data.getPaidUsers.filter((u: any) =>
            u.username.toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    const stats = data?.getPaymentStats || {
        totalRecetteNette: 0,
        totalFacturesPayees: 0,
        totalTPE: 0,
        totalCheque: 0,
        totalCash: 0,
        totalBankDeposits: 0
    };

    const handleBankSubmit = async () => {
        if (!bankAmount || !bankDate) return;
        try {
            await addBankDeposit({ variables: { amount: bankAmount, date: bankDate } });
            setBankAmount('');
            setShowBankForm(false);
            refetch();
        } catch (e) {
            console.error(e);
        }
    };

    const handleExpSubmit = async () => {
        if (!expName || !expAmount || !expDate) return;
        try {
            await addPaidInvoice({
                variables: {
                    supplier_name: expName,
                    amount: expAmount,
                    date: expDate,
                    photo_url: expPhoto,
                    photo_cheque_url: expPhotoCheque,
                    photo_verso_url: expPhotoVerso,
                    payment_method: expMethod,
                    paid_date: expDate
                }
            });
            setExpName('');
            setExpAmount('');
            setExpPhoto('');
            setExpPhotoCheque('');
            setExpPhotoVerso('');
            setShowExpForm(false);
            refetch();
        } catch (e) {
            console.error(e);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'invoice' | 'recto' | 'verso' = 'invoice') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'recto') setExpPhotoCheque(reader.result as string);
            else if (type === 'verso') setExpPhotoVerso(reader.result as string);
            else setExpPhoto(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    if (initializing || !user) return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
            <Loader2 className="animate-spin text-[#c69f6e]" size={40} />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#f8f5f2]">
            <Sidebar role={user.role} />

            <div className="flex-1 min-w-0 pb-24 lg:pb-0">
                <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e6dace] py-6 px-4 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-[#4a3426] tracking-tight">Finances & Trésorerie</h1>
                        <p className="text-[10px] md:text-xs text-[#8c8279] font-bold uppercase tracking-widest mt-1">Vision Globale & Flux Bancaires</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="flex bg-white rounded-2xl p-1 border border-[#e6dace] shadow-sm w-full md:w-auto">
                            <button
                                onClick={() => {
                                    setActiveFilter('month');
                                    setMonth(currentMonthStr);
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'month' ? 'bg-[#4a3426] text-white shadow-md' : 'text-[#8c8279] hover:bg-gray-50'}`}
                            >
                                Ce Mois
                            </button>
                            <button
                                onClick={setThisWeek}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'week' ? 'bg-[#4a3426] text-white shadow-md' : 'text-[#8c8279] hover:bg-gray-50'}`}
                            >
                                Cette Semaine
                            </button>
                            <button
                                onClick={setThisYear}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'year' ? 'bg-[#4a3426] text-white shadow-md' : 'text-[#8c8279] hover:bg-gray-50'}`}
                            >
                                Cette Année
                            </button>
                        </div>

                        <div className="flex items-center gap-3 bg-white rounded-3xl p-1.5 border border-[#e6dace] shadow-sm">
                            <PremiumDatePicker
                                label="Début"
                                value={dateRange.start}
                                onChange={(val) => handleCustomDateChange('start', val)}
                            />
                            <span className="text-[#c69f6e] font-black text-[12px] opacity-30">→</span>
                            <PremiumDatePicker
                                label="Fin"
                                value={dateRange.end}
                                onChange={(val) => handleCustomDateChange('end', val)}
                            />
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowMonthPicker(!showMonthPicker)}
                                className={`bg-white border border-[#e6dace] rounded-2xl h-11 px-6 flex items-center gap-3 hover:border-[#c69f6e] transition-all group w-full md:w-auto justify-between md:justify-start ${activeFilter === 'month' ? 'ring-2 ring-[#c69f6e]/20' : ''}`}
                            >
                                <Calendar size={18} className="text-[#c69f6e]" />
                                <span className="font-black text-[#4a3426] uppercase text-[11px] tracking-widest">
                                    {month ? `${months[parseInt(month.split('-')[1]) - 1]} ${month.split('-')[0]}` : 'Sélectionner Mois'}
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
                                            className="absolute top-full right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-[#e6dace] p-6 z-50 overflow-hidden"
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
                                                                setActiveFilter('month');
                                                                setShowMonthPicker(false);
                                                            }}
                                                            className={`h-10 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all
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
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-8">
                    {/* Stats Grid */}
                    {/* Main Stats Card - Recette Nette (Larger) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-600 p-10 md:p-14 rounded-[3.5rem] shadow-2xl relative overflow-hidden group text-white border-4 border-white/20"
                    >
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <div className="flex items-center gap-3 text-white/70 mb-4 uppercase text-xs font-black tracking-[0.3em]">
                                    <Wallet size={20} /> Recette Nette Globale
                                </div>
                                <h2 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter flex items-baseline gap-4">
                                    {stats.totalRecetteNette.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                    <span className="text-2xl md:text-4xl font-bold opacity-40">DT</span>
                                </h2>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center min-w-[200px]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Période Active</p>
                                <p className="text-lg font-black uppercase tracking-tight">
                                    {activeFilter === 'month' && month ? months[parseInt(month.split('-')[1]) - 1] : 'Période Sélect.'}
                                </p>
                                {activeFilter !== 'month' && (
                                    <p className="text-[10px] font-bold opacity-60 bg-white/10 px-3 py-1 rounded-full mt-2">
                                        {formatDateDisplay(dateRange.start)} au {formatDateDisplay(dateRange.end)}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="absolute -right-20 -bottom-20 opacity-10 group-hover:scale-110 transition-transform duration-700 text-white">
                            <Wallet size={400} />
                        </div>
                    </motion.div>

                    {/* Secondary Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Factures Payées', val: stats.totalFacturesPayees, icon: Receipt, color: 'bg-red-500' },
                            { label: 'Bancaire (TPE + Vers.)', val: stats.totalTPE + stats.totalBankDeposits, icon: TrendingUp, color: 'bg-blue-600' },
                            { label: 'Total Chèques', val: stats.totalCheque, icon: Banknote, color: 'bg-[#4a3426]' },
                            { label: 'Total Cash', val: stats.totalCash, icon: Coins, color: 'bg-[#c69f6e]' }
                        ].map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className={`${s.color} p-6 rounded-[2.5rem] shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-all text-white`}
                            >
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-white/70 mb-2 uppercase text-[9px] font-black tracking-widest">
                                        <s.icon size={12} /> {s.label}
                                    </div>
                                    <h3 className="text-2xl font-black truncate">
                                        {s.val.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                        <span className="text-[10px] font-bold opacity-50 ml-1">DT</span>
                                    </h3>
                                </div>
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500 text-white">
                                    <s.icon size={80} />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Bancaire Section */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-[2.5rem] luxury-shadow border border-[#e6dace]/50">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-[#4a3426] flex items-center gap-2">
                                        <div className="bg-[#4a3426] p-2 rounded-xl text-white">
                                            <TrendingUp size={18} />
                                        </div>
                                        Bancaire
                                    </h3>
                                    <button
                                        onClick={() => setShowBankForm(!showBankForm)}
                                        className="text-[10px] font-black uppercase tracking-widest bg-[#f4ece4] text-[#c69f6e] px-3 py-2 rounded-xl hover:bg-[#ebdccf] transition-all"
                                    >
                                        {showBankForm ? 'Annuler' : 'Verser à la banque'}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {showBankForm && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden mb-6"
                                        >
                                            <div className="space-y-3 p-4 bg-[#fcfaf8] rounded-3xl border border-[#e6dace]/50">
                                                <div className="grid grid-cols-2 gap-3 items-end">
                                                    <div>
                                                        <label className="text-[10px] font-black text-[#8c8279] uppercase ml-1">Montant (DT)</label>
                                                        <input
                                                            type="number"
                                                            value={bankAmount}
                                                            onChange={(e) => setBankAmount(e.target.value)}
                                                            className="w-full h-11 bg-white border border-[#e6dace] rounded-xl px-4 font-black text-lg outline-none focus:border-[#c69f6e]"
                                                            placeholder="0.000"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-[#8c8279] uppercase ml-1">Date</label>
                                                        <PremiumDatePicker
                                                            label="Date"
                                                            value={bankDate}
                                                            onChange={setBankDate}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleBankSubmit}
                                                    disabled={addingBank}
                                                    className="w-full h-11 bg-[#4a3426] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#4a3426]/20"
                                                >
                                                    {addingBank ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirmer le Versement'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-[#8c8279] uppercase tracking-widest px-2">Derniers versements</h4>
                                    {data?.getBankDeposits?.length > 0 ? (
                                        data.getBankDeposits.slice(0, 5).map((d: any) => (
                                            <div key={d.id} className="flex justify-between items-center p-4 bg-[#fcfaf8] rounded-2xl border border-transparent hover:border-[#e6dace] transition-all">
                                                <div>
                                                    <p className="text-sm font-black text-[#4a3426] text-[15px]">{parseFloat(d.amount).toFixed(3)} DT</p>
                                                    <p className="text-[10px] font-bold text-[#8c8279] uppercase tracking-tighter">{new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                                                </div>
                                                <div className="bg-green-100 p-2 rounded-xl text-green-600">
                                                    <TrendingUp size={16} />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center py-8 text-xs font-bold text-[#8c8279] italic">Aucun versement enregistré</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Middle: Salaries/Payments List */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Nouvelle Dépense Section */}
                            <div className="bg-white p-6 rounded-[2.5rem] luxury-shadow border border-[#e6dace]/50">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-[#4a3426] flex items-center gap-2">
                                        <div className="bg-red-500 p-2 rounded-xl text-white">
                                            <Receipt size={18} />
                                        </div>
                                        Nouvelle Dépense
                                    </h3>
                                    <button
                                        onClick={() => setShowExpForm(!showExpForm)}
                                        className="text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-500 px-3 py-2 rounded-xl hover:bg-red-100 transition-all"
                                    >
                                        {showExpForm ? 'Annuler' : 'Ajouter une dépense'}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {showExpForm && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-6 bg-red-50/30 rounded-3xl border border-red-100"
                                        >
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-black text-red-700/50 uppercase ml-1">Nom / Libellé</label>
                                                    <input
                                                        type="text"
                                                        value={expName}
                                                        onChange={(e) => setExpName(e.target.value)}
                                                        className="w-full h-11 bg-white border border-red-100 rounded-xl px-4 font-bold text-sm outline-none focus:border-red-400"
                                                        placeholder="Ex: Facture STEG..."
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 items-end">
                                                    <div>
                                                        <label className="text-[10px] font-black text-red-700/50 uppercase ml-1">Montant (DT)</label>
                                                        <input
                                                            type="number"
                                                            value={expAmount}
                                                            onChange={(e) => setExpAmount(e.target.value)}
                                                            className="w-full h-11 bg-white border border-red-100 rounded-xl px-4 font-black text-lg outline-none focus:border-red-400"
                                                            placeholder="0.000"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-red-700/50 uppercase ml-1">Date</label>
                                                        <PremiumDatePicker
                                                            label="Date"
                                                            value={expDate}
                                                            onChange={setExpDate}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-black text-red-700/50 uppercase ml-1">Mode de Paiement</label>
                                                    <select
                                                        value={expMethod}
                                                        onChange={(e) => setExpMethod(e.target.value)}
                                                        className="w-full h-11 bg-white border border-red-100 rounded-xl px-4 font-bold text-sm outline-none focus:border-red-400 appearance-none"
                                                    >
                                                        <option value="Espèces">💵 Espèces</option>
                                                        <option value="Chèque">✍️ Chèque</option>
                                                        <option value="TPE (Carte)">💳 TPE (Carte)</option>
                                                        <option value="Ticket Restaurant">🎫 T. Restaurant</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-[10px] font-black text-red-700/50 uppercase ml-1">Facture / Bon (Photo)</label>
                                                        <label className="flex items-center justify-center gap-2 h-11 w-full bg-white border border-red-100 rounded-xl cursor-pointer hover:bg-red-50 transition-all font-bold text-[10px] text-red-500 text-center px-1">
                                                            <UploadCloud size={14} />
                                                            {expPhoto ? 'Facture OK' : 'Joindre Facture'}
                                                            <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, 'invoice')} />
                                                        </label>
                                                    </div>

                                                    {expMethod === 'Chèque' && (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-[10px] font-black text-red-700/50 uppercase ml-1">Chèque (Recto)</label>
                                                                <label className="flex items-center justify-center gap-2 h-11 w-full bg-white border border-red-100 rounded-xl cursor-pointer hover:bg-red-50 transition-all font-bold text-[10px] text-red-500 text-center px-1">
                                                                    <UploadCloud size={14} />
                                                                    {expPhotoCheque ? 'Recto OK' : 'Joindre'}
                                                                    <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, 'recto')} />
                                                                </label>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black text-red-700/50 uppercase ml-1">Chèque (Verso)</label>
                                                                <label className="flex items-center justify-center gap-2 h-11 w-full bg-white border border-red-100 rounded-xl cursor-pointer hover:bg-red-50 transition-all font-bold text-[10px] text-red-500 text-center px-1">
                                                                    <UploadCloud size={14} />
                                                                    {expPhotoVerso ? 'Verso OK' : 'Joindre'}
                                                                    <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, 'verso')} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={handleExpSubmit}
                                                    disabled={addingExp}
                                                    className="w-full h-11 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 md:mt-auto"
                                                >
                                                    {addingExp ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Enregistrer la Dépense'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-6">
                                    {/* Dernières Dépenses */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-[#8c8279] uppercase tracking-widest px-2">Dernières dépenses réglées</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {data?.getInvoices?.slice(0, 4).map((inv: any) => (
                                                <div
                                                    key={inv.id}
                                                    onClick={() => setSelectedInvoice(inv)}
                                                    className="p-4 bg-[#fcfaf8] rounded-2xl border border-transparent hover:border-red-100 cursor-pointer transition-all flex justify-between items-center group"
                                                >
                                                    <div>
                                                        <p className="font-black text-[#4a3426] text-sm">{inv.supplier_name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold text-red-500">{parseFloat(inv.amount).toFixed(3)} DT</span>
                                                            <span className="text-[9px] font-bold text-[#8c8279] uppercase">{inv.payment_method}</span>
                                                        </div>
                                                    </div>
                                                    {(inv.photo_url || inv.photo_cheque_url || inv.photo_verso_url) && (
                                                        <div className="bg-red-50 p-2 rounded-xl text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all">
                                                            <ImageIcon size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-[#e6dace]/30 pt-6">
                                        <div className="flex justify-between items-center px-2 mb-4">
                                            <h3 className="text-xl font-bold text-[#4a3426] flex items-center gap-2">
                                                <User size={20} className="text-[#c69f6e]" /> Confirmations Salaires
                                            </h3>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Filtrer employé..."
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    className="bg-[#fcfaf8] border border-[#e6dace] rounded-xl h-10 pl-10 pr-4 font-bold text-[11px] outline-none focus:border-[#c69f6e]"
                                                />
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c69f6e]" size={14} />
                                            </div>
                                        </div>

                                        {loading ? (
                                            <div className="py-20 flex justify-center">
                                                <Loader2 className="animate-spin text-[#c69f6e]" size={30} />
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto rounded-[2rem] border border-[#e6dace]/30">
                                                <table className="w-full text-left">
                                                    <thead className="bg-[#fcfaf8] border-b border-[#e6dace]">
                                                        <tr>
                                                            <th className="px-8 py-5 text-xs font-black text-[#8c8279] uppercase tracking-widest">Employé</th>
                                                            <th className="px-8 py-5 text-xs font-black text-[#8c8279] uppercase tracking-widest text-right">Montant</th>
                                                            <th className="px-8 py-5 text-xs font-black text-[#8c8279] uppercase tracking-widest text-center">Statut</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredUsers.length > 0 ? (
                                                            filteredUsers.map((u: any, i: number) => (
                                                                <tr key={i} className="border-b border-[#fcfaf8] hover:bg-[#fdfbf7] transition-colors">
                                                                    <td className="px-8 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-[#f4ece4] flex items-center justify-center text-[#c69f6e] font-black uppercase text-[10px]">
                                                                                {u.username.substring(0, 2)}
                                                                            </div>
                                                                            <span className="font-black text-[#4a3426] text-sm">{u.username}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-8 py-4 text-right font-black text-[#4a3426] text-sm">
                                                                        {u.amount.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT
                                                                    </td>
                                                                    <td className="px-8 py-4 text-center">
                                                                        <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-tighter shadow-sm border border-green-100">
                                                                            Confirmé ✓
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={3} className="py-12 text-center text-[#8c8279] italic text-sm">Aucun paiement trouvé</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Modal Visionneuse Photo */}
                <AnimatePresence>
                    {selectedInvoice && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-[#4a3426]/90 backdrop-blur-sm"
                                onClick={() => setSelectedInvoice(null)}
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                className="relative bg-white w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl"
                            >
                                <div className="p-6 border-b border-[#e6dace] flex justify-between items-center bg-[#fcfaf8]">
                                    <div>
                                        <h3 className="text-xl font-black text-[#4a3426]">{selectedInvoice.supplier_name}</h3>
                                        <p className="text-xs font-bold text-[#8c8279] uppercase tracking-widest">
                                            {selectedInvoice.amount} DT • {selectedInvoice.payment_method}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedInvoice(null)}
                                        className="w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center text-[#4a3426] hover:bg-red-50 hover:text-red-500 transition-all font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                                    {/* Facture Section */}
                                    <div className="space-y-2 text-center">
                                        <p className="text-[10px] font-black text-[#8c8279] uppercase tracking-[0.2em]">Facture / Bon</p>
                                        {selectedInvoice.photo_url ? (
                                            <div className="rounded-2xl overflow-hidden border border-[#e6dace] shadow-lg">
                                                <img src={selectedInvoice.photo_url} alt="Facture" className="w-full h-auto" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center bg-[#fcfaf8] rounded-2xl h-48 text-[#8c8279] font-bold italic text-[10px] border-2 border-dashed border-[#e6dace]">
                                                Aucune facture réglée
                                            </div>
                                        )}
                                    </div>

                                    {/* Chèque Sections */}
                                    {selectedInvoice.payment_method === 'Chèque' && (
                                        <>
                                            <div className="space-y-2 text-center">
                                                <p className="text-[10px] font-black text-[#8c8279] uppercase tracking-[0.2em]">Chèque Recto</p>
                                                {selectedInvoice.photo_cheque_url ? (
                                                    <div className="rounded-2xl overflow-hidden border border-[#e6dace] shadow-lg">
                                                        <img src={selectedInvoice.photo_cheque_url} alt="Recto" className="w-full h-auto" />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center bg-[#fcfaf8] rounded-2xl h-48 text-[#8c8279] font-bold italic text-[10px] border-2 border-dashed border-[#e6dace]">
                                                        Aucune photo recto
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2 text-center">
                                                <p className="text-[10px] font-black text-[#8c8279] uppercase tracking-[0.2em]">Chèque Verso</p>
                                                {selectedInvoice.photo_verso_url ? (
                                                    <div className="rounded-2xl overflow-hidden border border-[#e6dace] shadow-lg">
                                                        <img src={selectedInvoice.photo_verso_url} alt="Verso" className="w-full h-auto" />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center bg-[#fcfaf8] rounded-2xl h-48 text-[#8c8279] font-bold italic text-[10px] border-2 border-dashed border-[#e6dace]">
                                                        Aucune photo verso
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
