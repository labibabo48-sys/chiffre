'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
    Loader2, Search, Calendar, Plus,
    CreditCard, Banknote, Coins, Receipt,
    Trash2, UploadCloud, CheckCircle2,
    Clock, Filter, X, Eye, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Components & Utilities ---

const formatDateToDisplay = (dateStr: string) => {
    if (!dateStr) return 'JJ/MM/AAAA';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

const PremiumDatePicker = ({ value, onChange, label, colorMode = 'brown' }: { value: string, onChange: (val: string) => void, label: string, colorMode?: 'brown' | 'green' | 'red' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());

    const theme = {
        brown: { text: 'text-[#c69f6e]', bg: 'bg-[#c69f6e]', shadow: 'shadow-[#c69f6e]/30', border: 'border-[#c69f6e]/30', hover: 'hover:border-[#c69f6e]' },
        green: { text: 'text-[#2d6a4f]', bg: 'bg-[#2d6a4f]', shadow: 'shadow-[#2d6a4f]/30', border: 'border-[#2d6a4f]/30', hover: 'hover:border-[#2d6a4f]' },
        red: { text: 'text-red-500', bg: 'bg-red-500', shadow: 'shadow-red-500/30', border: 'border-red-500/30', hover: 'hover:border-red-500' }
    }[colorMode];

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

    // Use a ref to check if the picker is near the bottom of the screen
    const [openUp, setOpenUp] = useState(false);
    const containerRef = (node: HTMLDivElement | null) => {
        if (node) {
            const rect = node.getBoundingClientRect();
            setOpenUp(window.innerHeight - rect.bottom < 350);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 bg-white hover:bg-white border border-[#e6dace] rounded-2xl px-4 py-2 h-14 transition-all w-full group shadow-sm ${theme.hover}`}
            >
                <div className={`p-2 rounded-xl ${theme.bg} bg-opacity-10 ${theme.text}`}>
                    <Calendar size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#bba282] opacity-60 leading-none mb-1">{label}</span>
                    <span className="text-sm font-black text-[#4a3426] tracking-tight truncate leading-none">
                        {formatDateToDisplay(value)}
                    </span>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: openUp ? -10 : 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: openUp ? -10 : 10, scale: 0.95 }}
                            className={`absolute ${openUp ? 'bottom-full mb-3' : 'top-full mt-3'} left-0 bg-white rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] border border-[#e6dace] p-6 z-[110] w-[320px]`}
                        >
                            <div className="flex justify-between items-center mb-6 px-1">
                                <button type="button" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2.5 hover:bg-[#fcfaf8] rounded-2xl text-[#c69f6e] transition-colors"><ChevronLeft size={20} /></button>
                                <span className="text-sm font-black text-[#4a3426] uppercase tracking-[0.1em]">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                                <button type="button" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2.5 hover:bg-[#fcfaf8] rounded-2xl text-[#c69f6e] transition-colors"><ChevronRight size={20} /></button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-3">
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i} className="text-[10px] font-black text-[#bba282] text-center uppercase tracking-widest opacity-40">{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {daysInMonth.map((day, i) => {
                                    if (!day) return <div key={`empty-${i}`} />;

                                    const y = day.getFullYear();
                                    const m = String(day.getMonth() + 1).padStart(2, '0');
                                    const d = String(day.getDate()).padStart(2, '0');
                                    const dStr = `${y}-${m}-${d}`;

                                    const isSelected = value === dStr;
                                    const now = new Date();
                                    const isToday = now.getFullYear() === day.getFullYear() &&
                                        now.getMonth() === day.getMonth() &&
                                        now.getDate() === day.getDate();

                                    return (
                                        <button key={i} type="button"
                                            onClick={() => {
                                                onChange(dStr);
                                                setIsOpen(false);
                                            }}
                                            className={`h-10 w-10 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center
                                                ${isSelected ? `${theme.bg} text-white shadow-lg ${theme.shadow}` : `text-[#4a3426] hover:bg-[#fcfaf8] border border-transparent hover:border-[#e6dace]`}
                                                ${isToday && !isSelected ? `${theme.text} bg-opacity-10 ${theme.bg}` : ''}`}
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

const ChevronLeft = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6" /></svg>
);

const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>
);

// --- End Helpers ---

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
    getSuppliers {
      id
      name
    }
  }
`;

const ADD_INVOICE = gql`
  mutation AddInvoice($supplier_name: String!, $amount: String!, $date: String!, $photo_url: String) {
    addInvoice(supplier_name: $supplier_name, amount: $amount, date: $date, photo_url: $photo_url) {
      id
      status
    }
  }
`;

const PAY_INVOICE = gql`
  mutation PayInvoice($id: Int!, $payment_method: String!, $paid_date: String!, $photo_cheque_url: String, $photo_verso_url: String) {
    payInvoice(id: $id, payment_method: $payment_method, paid_date: $paid_date, photo_cheque_url: $photo_cheque_url, photo_verso_url: $photo_verso_url) {
      id
      status
      paid_date
    }
  }
`;

const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: Int!) {
    deleteInvoice(id: $id)
  }
`;

export default function FacturationPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ role: 'admin' | 'caissier', full_name: string } | null>(null);
    const [initializing, setInitializing] = useState(true);

    // Filters
    const [searchSupplier, setSearchSupplier] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState<any>(null);
    const [viewingData, setViewingData] = useState<any>(null);

    const today = new Date();
    const ty = today.getFullYear();
    const tm = String(today.getMonth() + 1).padStart(2, '0');
    const td = String(today.getDate()).padStart(2, '0');
    const todayStr = `${ty}-${tm}-${td}`;

    // Form state
    const [newInvoice, setNewInvoice] = useState({
        supplier_name: '',
        amount: '',
        date: todayStr,
        photo_url: ''
    });
    const [paymentDetails, setPaymentDetails] = useState({
        method: 'Espèces',
        date: todayStr,
        photo_cheque_url: '',
        photo_verso_url: ''
    });

    const { data, loading, refetch } = useQuery(GET_INVOICES, {
        variables: {
            supplierName: searchSupplier || undefined,
            startDate: filterStartDate || undefined,
            endDate: filterEndDate || undefined
        }
    });

    const stats = useMemo(() => {
        if (!data?.getInvoices) return { paid: 0, unpaid: 0, countPaid: 0, countUnpaid: 0 };
        return data.getInvoices.reduce((acc: any, inv: any) => {
            const amt = parseFloat(inv.amount || '0');
            if (inv.status === 'paid') {
                acc.paid += amt;
                acc.countPaid += 1;
            } else {
                acc.unpaid += amt;
                acc.countUnpaid += 1;
            }
            return acc;
        }, { paid: 0, unpaid: 0, countPaid: 0, countUnpaid: 0 });
    }, [data]);

    const filteredInvoices = useMemo(() => {
        if (!data?.getInvoices) return [];
        return data.getInvoices.filter((inv: any) => {
            if (statusFilter === 'all') return true;
            return inv.status === statusFilter;
        });
    }, [data, statusFilter]);

    const [addInvoice] = useMutation(ADD_INVOICE);
    const [payInvoice] = useMutation(PAY_INVOICE);
    const [deleteInvoice] = useMutation(DELETE_INVOICE);

    useEffect(() => {
        const savedUser = localStorage.getItem('bb_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        } else {
            router.push('/');
        }

        // Handle supplier filter from URL
        const params = new URLSearchParams(window.location.search);
        const supplier = params.get('supplier');
        if (supplier) setSearchSupplier(decodeURIComponent(supplier));

        setInitializing(false);
    }, [router]);

    const handleAddInvoice = async () => {
        if (!newInvoice.supplier_name || !newInvoice.amount || !newInvoice.date) return;
        try {
            await addInvoice({
                variables: {
                    ...newInvoice,
                    amount: newInvoice.amount.toString()
                }
            });
            setShowAddModal(false);
            setNewInvoice({
                supplier_name: '',
                amount: '',
                date: todayStr,
                photo_url: ''
            });
            refetch();
        } catch (e) {
            console.error(e);
        }
    };

    const handlePayInvoice = async () => {
        if (!showPayModal) return;
        try {
            await payInvoice({
                variables: {
                    id: showPayModal.id,
                    payment_method: paymentDetails.method,
                    paid_date: paymentDetails.date,
                    photo_cheque_url: paymentDetails.photo_cheque_url || null,
                    photo_verso_url: paymentDetails.photo_verso_url || null
                }
            });
            setShowPayModal(null);
            setPaymentDetails({
                method: 'Espèces',
                date: todayStr,
                photo_cheque_url: '',
                photo_verso_url: ''
            });
            refetch();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bas sûr de vouloir supprimer cette facture ?')) return;
        try {
            await deleteInvoice({ variables: { id } });
            refetch();
        } catch (e) {
            console.error(e);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'invoice' | 'recto' | 'verso' = 'invoice') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const res = reader.result as string;
            if (field === 'invoice') setNewInvoice({ ...newInvoice, photo_url: res });
            else if (field === 'recto') setPaymentDetails({ ...paymentDetails, photo_cheque_url: res });
            else if (field === 'verso') setPaymentDetails({ ...paymentDetails, photo_verso_url: res });
        };
        reader.readAsDataURL(file);
    };

    if (initializing || !user) return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
            <Loader2 className="animate-spin text-[#c69f6e]" size={40} />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#fdfbf7]">
            <Sidebar role={user.role} />

            <div className="flex-1 min-w-0">
                <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e6dace] py-6 px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
                    <div>
                        <h1 className="text-2xl font-black text-[#4a3426] tracking-tight uppercase">Facturation</h1>
                        <p className="text-xs text-[#8c8279] font-bold uppercase tracking-widest mt-1">Gestion des factures fournisseurs</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex-1 md:flex-none h-12 px-6 bg-[#4a3426] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#38261b] transition-all shadow-lg shadow-[#4a3426]/10"
                        >
                            <Plus size={20} />
                            <span>Ajouter Facture</span>
                        </button>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 md:mt-8 pb-20">
                    {/* Stat Boxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setStatusFilter(statusFilter === 'paid' ? 'all' : 'paid')}
                            className={`rounded-[2rem] p-6 border transition-all shadow-lg relative overflow-hidden group cursor-pointer ${statusFilter === 'paid' ? 'ring-4 ring-[#2d6a4f]/20 scale-[1.02]' : ''} bg-[#2d6a4f] border-[#2d6a4f] text-white`}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Total Payé</p>
                                    <h3 className="text-2xl font-black text-white">{stats.paid.toFixed(3)} <span className="text-xs opacity-50">DT</span></h3>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-white/80 uppercase tracking-wider relative z-10">
                                <span>Factures validées</span>
                                <span className="bg-white/20 text-white px-2 py-0.5 rounded-full">{stats.countPaid}</span>
                            </div>
                            {statusFilter === 'paid' && <div className="absolute top-4 right-4 text-white/40"><Filter size={14} /></div>}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            onClick={() => setStatusFilter(statusFilter === 'unpaid' ? 'all' : 'unpaid')}
                            className={`rounded-[2rem] p-6 border transition-all shadow-lg relative overflow-hidden group cursor-pointer ${statusFilter === 'unpaid' ? 'ring-4 ring-red-500/20 scale-[1.02]' : ''} bg-red-500 border-red-500 text-white`}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Total Impayé</p>
                                    <h3 className="text-2xl font-black text-white">{stats.unpaid.toFixed(3)} <span className="text-xs opacity-50">DT</span></h3>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-white/80 uppercase tracking-wider relative z-10">
                                <span>En attente de règlement</span>
                                <span className="bg-white/20 text-white px-2 py-0.5 rounded-full">{stats.countUnpaid}</span>
                            </div>
                            {statusFilter === 'unpaid' && <div className="absolute top-4 right-4 text-white/40"><Filter size={14} /></div>}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            onClick={() => setStatusFilter('paid')}
                            className={`bg-white rounded-[2rem] p-6 border transition-all shadow-sm relative overflow-hidden group cursor-pointer ${statusFilter === 'paid' ? 'bg-[#f0faf5]/30' : 'border-[#e6dace]'}`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c69f6e]/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-[#fff9f2] rounded-2xl flex items-center justify-center text-[#c69f6e]">
                                    <Receipt size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#8c8279] uppercase tracking-widest">Factures Payées</p>
                                    <h3 className="text-2xl font-black text-[#4a3426]">{stats.countPaid}</h3>
                                </div>
                            </div>
                            <div className="bg-[#fcfaf8] rounded-xl p-2 flex items-center justify-center gap-2 border border-[#e6dace]/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]"></div>
                                <span className="text-[9px] font-black text-[#2d6a4f] uppercase tracking-widest">Voir Payées</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            onClick={() => setStatusFilter('unpaid')}
                            className={`bg-white rounded-[2rem] p-6 border transition-all shadow-sm relative overflow-hidden group cursor-pointer ${statusFilter === 'unpaid' ? 'bg-red-50/10' : 'border-[#e6dace]'}`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#4a3426]/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-[#f9f6f2] rounded-2xl flex items-center justify-center text-[#4a3426]">
                                    <Filter size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#8c8279] uppercase tracking-widest">Factures en cours</p>
                                    <h3 className="text-2xl font-black text-[#4a3426]">{stats.countUnpaid}</h3>
                                </div>
                            </div>
                            <div className="bg-[#fcfaf8] rounded-xl p-2 flex items-center justify-center gap-2 border border-[#e6dace]/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#c69f6e] animate-pulse"></div>
                                <span className="text-[9px] font-black text-[#c69f6e] uppercase tracking-widest">Voir Impayées</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white rounded-[2rem] p-6 mb-8 border border-[#e6dace] shadow-sm flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8c8279] mb-2 block ml-1">Fournisseur</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c69f6e]" size={18} />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchSupplier}
                                    onChange={(e) => setSearchSupplier(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 bg-[#f9f6f2] border border-[#e6dace] rounded-xl font-bold text-[#4a3426] outline-none focus:border-[#c69f6e] transition-all"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-auto">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8c8279] mb-2 block ml-1">Période</label>
                            <div className="flex items-center gap-3">
                                <PremiumDatePicker
                                    label="Début"
                                    value={filterStartDate}
                                    onChange={setFilterStartDate}
                                />
                                <span className="text-[#8c8279] font-black opacity-30 text-xs uppercase">à</span>
                                <PremiumDatePicker
                                    label="Fin"
                                    value={filterEndDate}
                                    onChange={setFilterEndDate}
                                />
                            </div>
                        </div>
                        {statusFilter !== 'all' && (
                            <button
                                onClick={() => setStatusFilter('all')}
                                className="h-12 px-4 bg-[#fcfaf8] border border-[#e6dace] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#c69f6e] hover:bg-[#fff9f2] flex items-center gap-2 transition-all"
                            >
                                <X size={14} /> Réinitialiser
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="py-40 flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-[#c69f6e]" size={50} />
                            <p className="font-bold text-[#8c8279] animate-pulse">Chargement des factures...</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Area for Unpaid Invoices */}
                            {(statusFilter === 'all' || statusFilter === 'unpaid') && (
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                                            <Clock size={22} />
                                        </div>
                                        <h2 className="text-xl font-black text-[#4a3426] uppercase tracking-tight">Factures non payées</h2>
                                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full font-black text-sm border border-red-100">
                                            {filteredInvoices.filter((inv: any) => inv.status !== 'paid').length}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <AnimatePresence>
                                            {filteredInvoices.filter((inv: any) => inv.status !== 'paid').map((inv: any) => (
                                                <motion.div
                                                    key={inv.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-red-50/40 rounded-[2.5rem] border-2 border-red-100 overflow-hidden group hover:shadow-xl hover:border-red-200 transition-all"
                                                >
                                                    <div className="relative h-48 bg-[#f9f6f2] border-b border-[#e6dace] flex items-center justify-center overflow-hidden">
                                                        {inv.photo_url ? (
                                                            <>
                                                                <img src={inv.photo_url} alt="Invoice" className="w-full h-full object-cover" />
                                                                <button
                                                                    onClick={() => setViewingData(inv)}
                                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                                >
                                                                    <Eye size={30} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className="text-[#8c8279] flex flex-col items-center gap-2">
                                                                <Receipt size={40} className="opacity-20" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Pas de photo</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 bg-red-500 text-white">
                                                            <Clock size={12} />
                                                            En attente
                                                        </div>
                                                    </div>

                                                    <div className="p-6">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h3 className="font-black text-xl text-[#4a3426] tracking-tight">{inv.supplier_name}</h3>
                                                                <div className="flex items-center gap-2 text-[#8c8279] text-[10px] font-black uppercase tracking-widest mt-1">
                                                                    <Calendar size={12} className="text-[#c69f6e]" />
                                                                    <span>Reçu le:</span>
                                                                    <span className="text-[#4a3426]">{new Date(inv.date).toLocaleDateString('fr-FR')}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-2xl font-black text-red-500">{parseFloat(inv.amount || '0').toFixed(3)}</div>
                                                                <div className="text-[10px] font-bold text-red-400 uppercase ml-1">DT</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setShowPayModal(inv)}
                                                                className="flex-1 h-11 bg-[#2d6a4f] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1b4332] transition-all"
                                                            >
                                                                <CheckCircle2 size={18} />
                                                                <span>Payer</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(inv.id)}
                                                                className="w-11 h-11 border-2 border-red-50 text-red-100 hover:text-red-500 hover:border-red-100 rounded-xl flex items-center justify-center transition-all"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {filteredInvoices.filter((inv: any) => inv.status !== 'paid').length === 0 && (
                                            <div className="col-span-full py-10 bg-[#f9f6f2] rounded-[2rem] border-2 border-dashed border-[#e6dace] text-center">
                                                <div className="text-[#8c8279] opacity-40 mb-3"><CheckCircle2 className="mx-auto" size={40} /></div>
                                                <p className="font-bold text-[#8c8279] uppercase text-xs tracking-widest">Aucune facture en attente</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Separator */}
                            {statusFilter === 'all' && <div className="h-px bg-[#e6dace] w-full opacity-50"></div>}

                            {/* Area for Paid Invoices */}
                            {(statusFilter === 'all' || statusFilter === 'paid') && (
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-[#f0faf5] rounded-xl flex items-center justify-center text-[#2d6a4f]">
                                            <CheckCircle2 size={22} />
                                        </div>
                                        <h2 className="text-xl font-black text-[#4a3426] uppercase tracking-tight">Historique des Paiements</h2>
                                        <span className="bg-[#f0faf5] text-[#2d6a4f] px-3 py-1 rounded-full font-black text-sm border border-[#d1e7dd]">
                                            {filteredInvoices.filter((inv: any) => inv.status === 'paid').length}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <AnimatePresence>
                                            {filteredInvoices.filter((inv: any) => inv.status === 'paid').map((inv: any) => (
                                                <motion.div
                                                    key={inv.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-[#f0faf5]/40 rounded-[2.5rem] border-2 border-[#d1e7dd] overflow-hidden group hover:shadow-xl transition-all"
                                                >
                                                    <div className="relative h-48 bg-[#f9f6f2] border-b border-[#e6dace] flex items-center justify-center overflow-hidden">
                                                        {inv.photo_url ? (
                                                            <>
                                                                <img src={inv.photo_url} alt="Invoice" className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                                                                <button
                                                                    onClick={() => setViewingData(inv)}
                                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                                >
                                                                    <Eye size={30} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className="text-[#8c8279] flex flex-col items-center gap-2">
                                                                <Receipt size={40} className="opacity-20" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Pas de photo</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 bg-[#2d6a4f] text-white">
                                                            <CheckCircle2 size={12} />
                                                            Payé
                                                        </div>
                                                    </div>

                                                    <div className="p-6">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h3 className="font-black text-xl text-[#4a3426] tracking-tight opacity-70">{inv.supplier_name}</h3>
                                                                <div className="flex items-center gap-2 text-[#8c8279] text-[10px] font-black uppercase tracking-widest mt-1">
                                                                    <Calendar size={12} className="text-[#c69f6e]" />
                                                                    <span>Reçu le:</span>
                                                                    <span className="text-[#4a3426]">{new Date(inv.date).toLocaleDateString('fr-FR')}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-2xl font-black text-[#2d6a4f]">{parseFloat(inv.amount || '0').toFixed(3)}</div>
                                                                <div className="text-[10px] font-bold text-[#2d6a4f]/60 uppercase ml-1">DT</div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-[#f0faf5] border border-[#d1e7dd] rounded-2xl p-4 mb-4">
                                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em] text-[#2d6a4f]">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]"></div>
                                                                    {inv.payment_method}
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg border border-[#2d6a4f]/10">
                                                                    <span className="opacity-50">Réglé le:</span>
                                                                    <span>{new Date(inv.paid_date).toLocaleDateString('fr-FR')}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleDelete(inv.id)}
                                                                className="flex-1 h-11 border-2 border-red-50 text-red-100 hover:text-red-500 hover:border-red-100 rounded-xl flex items-center justify-center transition-all px-4 gap-2"
                                                            >
                                                                <Trash2 size={18} />
                                                                <span className="text-xs font-black uppercase">Supprimer</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {filteredInvoices.filter((inv: any) => inv.status === 'paid').length === 0 && (
                                            <div className="col-span-full py-10 bg-[#f9f6f2] rounded-[2rem] border-2 border-dashed border-[#e6dace] text-center">
                                                <p className="font-bold text-[#8c8279] uppercase text-xs tracking-widest opacity-40">Aucun historique de paiement</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Add Invoice Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-[#4a3426]/60 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-visible shadow-2xl border border-white/20"
                        >
                            <div className="p-8 bg-[#4a3426] text-white relative rounded-t-[2.5rem]">
                                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <Receipt size={28} className="text-[#c69f6e]" />
                                    Nouveau Reçu
                                </h2>
                                <p className="text-xs text-white/60 font-medium mt-1">Enregistrer une nouvelle facture fournisseur</p>
                                <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-white/40 hover:text-white"><X size={24} /></button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Fournisseur</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c69f6e]" size={20} />
                                        <select
                                            value={newInvoice.supplier_name}
                                            onChange={(e) => setNewInvoice({ ...newInvoice, supplier_name: e.target.value })}
                                            className="w-full h-14 pl-12 pr-4 bg-[#f9f6f2] border border-[#e6dace] rounded-2xl font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all appearance-none"
                                        >
                                            <option value="">Sélectionner un fournisseur</option>
                                            {data?.getSuppliers.map((s: any) => (
                                                <option key={s.id} value={s.name}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Montant (DT)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c69f6e]" size={20} />
                                            <input
                                                type="number"
                                                step="0.001"
                                                placeholder="0.000"
                                                value={newInvoice.amount}
                                                onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                                                className="w-full h-14 pl-12 pr-4 bg-[#f9f6f2] border border-[#e6dace] rounded-2xl font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Date Facture</label>
                                        <PremiumDatePicker
                                            label="Date"
                                            value={newInvoice.date}
                                            onChange={(val) => setNewInvoice({ ...newInvoice, date: val })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Photo / Reçu</label>
                                    <div
                                        onClick={() => document.getElementById('photo-upload')?.click()}
                                        className="relative w-full h-32 bg-[#fcfaf8] border-2 border-dashed border-[#e6dace] rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#c69f6e] hover:bg-[#fff9f2] transition-all overflow-hidden"
                                    >
                                        {newInvoice.photo_url ? (
                                            <img src={newInvoice.photo_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <UploadCloud className="text-[#c69f6e] opacity-40" size={32} />
                                                <span className="text-[10px] font-black text-[#8c8279] uppercase tracking-widest">Cliquer pour uploader</span>
                                            </>
                                        )}
                                        <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddInvoice}
                                    disabled={!newInvoice.supplier_name || !newInvoice.amount}
                                    className="w-full h-16 bg-[#4a3426] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-[#38261b] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-[#4a3426]/20"
                                >
                                    Confirmer l'ajout
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pay Modal */}
            <AnimatePresence>
                {showPayModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-[#2d6a4f]/60 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setShowPayModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[2.5rem] w-full max-w-md overflow-visible shadow-2xl border border-white/20"
                        >
                            <div className="p-8 bg-[#2d6a4f] text-white relative rounded-t-[2.5rem]">
                                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <CheckCircle2 size={28} className="text-[#a7c957]" />
                                    Paiement
                                </h2>
                                <p className="text-xs text-white/60 font-medium mt-1">Valider le règlement de la facture</p>
                                <button onClick={() => setShowPayModal(null)} className="absolute top-8 right-8 text-white/40 hover:text-white"><X size={24} /></button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="bg-[#f0faf5] p-4 rounded-2xl border border-[#d1e7dd]">
                                    <span className="text-[10px] font-black text-[#2d6a4f] uppercase tracking-widest block mb-1">Détails Facture</span>
                                    <div className="flex justify-between items-baseline font-black text-[#1b4332]">
                                        <span className="text-lg">{showPayModal.supplier_name}</span>
                                        <span className="text-2xl">{parseFloat(showPayModal.amount).toFixed(3)} DT</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Mode de Paiement</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'Espèces', icon: Coins },
                                            { id: 'Tpe', icon: CreditCard },
                                            { id: 'Chèque', icon: Banknote },
                                            { id: 'T. Restaurant', icon: Receipt }
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setPaymentDetails({ ...paymentDetails, method: m.id })}
                                                className={`h-14 rounded-2xl border-2 flex items-center gap-3 px-4 transition-all ${paymentDetails.method === m.id
                                                    ? 'bg-[#2d6a4f] border-[#2d6a4f] text-white shadow-lg'
                                                    : 'bg-white border-[#e6dace] text-[#8c8279] hover:border-[#2d6a4f]'
                                                    }`}
                                            >
                                                <m.icon size={18} />
                                                <span className="font-bold text-xs">{m.id}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Date de Règlement</label>
                                    <PremiumDatePicker
                                        label="Date"
                                        colorMode="green"
                                        value={paymentDetails.date}
                                        onChange={(val) => setPaymentDetails({ ...paymentDetails, date: val })}
                                    />
                                </div>

                                {paymentDetails.method === 'Chèque' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Chèque Recto</label>
                                            <div
                                                onClick={() => document.getElementById('recto-upload')?.click()}
                                                className="h-24 bg-[#fcfaf8] border-2 border-dashed border-[#e6dace] rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#2d6a4f] hover:bg-[#f0faf5] transition-all overflow-hidden"
                                            >
                                                {paymentDetails.photo_cheque_url ? (
                                                    <img src={paymentDetails.photo_cheque_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <>
                                                        <UploadCloud className="text-[#2d6a4f] opacity-40" size={24} />
                                                        <span className="text-[8px] font-black text-[#8c8279] uppercase tracking-widest">Recto</span>
                                                    </>
                                                )}
                                                <input id="recto-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'recto')} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Chèque Verso</label>
                                            <div
                                                onClick={() => document.getElementById('verso-upload')?.click()}
                                                className="h-24 bg-[#fcfaf8] border-2 border-dashed border-[#e6dace] rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#2d6a4f] hover:bg-[#f0faf5] transition-all overflow-hidden"
                                            >
                                                {paymentDetails.photo_verso_url ? (
                                                    <img src={paymentDetails.photo_verso_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <>
                                                        <UploadCloud className="text-[#2d6a4f] opacity-40" size={24} />
                                                        <span className="text-[8px] font-black text-[#8c8279] uppercase tracking-widest">Verso</span>
                                                    </>
                                                )}
                                                <input id="verso-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'verso')} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handlePayInvoice}
                                    className="w-full h-16 bg-[#2d6a4f] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-[#1b4332] transition-all shadow-xl shadow-[#2d6a4f]/20"
                                >
                                    Valider et Archiver
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Viewer Overlay */}
            <AnimatePresence>
                {viewingData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar"
                        onClick={() => setViewingData(null)}
                    >
                        <div className="w-full max-w-6xl space-y-8 py-10" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center text-white mb-4">
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight">{viewingData.supplier_name}</h2>
                                    <p className="text-sm font-bold opacity-60 uppercase tracking-[0.3em]">{viewingData.amount} DT • {viewingData.status === 'paid' ? viewingData.payment_method : 'En attente'}</p>
                                </div>
                                <button onClick={() => setViewingData(null)} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"><X size={32} /></button>
                            </div>

                            <div className={`grid grid-cols-1 ${viewingData.payment_method === 'Chèque' ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-8`}>
                                {/* Photo Facture */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] text-center italic">Document Principal / Facture</p>
                                    {viewingData.photo_url ? (
                                        <div className="bg-white/5 p-4 rounded-[2rem] border border-white/10 shadow-2xl">
                                            <img src={viewingData.photo_url} className="w-full h-auto rounded-xl object-contain" alt="Facture" />
                                        </div>
                                    ) : (
                                        <div className="aspect-video bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 italic font-bold">Sans Facture</div>
                                    )}
                                </div>

                                {/* Photos Chèque */}
                                {viewingData.payment_method === 'Chèque' && (
                                    <>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] text-center italic">Chèque Recto</p>
                                            {viewingData.photo_cheque_url ? (
                                                <div className="bg-white/5 p-4 rounded-[2rem] border border-white/10 shadow-2xl">
                                                    <img src={viewingData.photo_cheque_url} className="w-full h-auto rounded-xl object-contain" alt="Chèque Recto" />
                                                </div>
                                            ) : (
                                                <div className="aspect-video bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 italic font-bold">Sans Recto</div>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] text-center italic">Chèque Verso</p>
                                            {viewingData.photo_verso_url ? (
                                                <div className="bg-white/5 p-4 rounded-[2rem] border border-white/10 shadow-2xl">
                                                    <img src={viewingData.photo_verso_url} className="w-full h-auto rounded-xl object-contain" alt="Chèque Verso" />
                                                </div>
                                            ) : (
                                                <div className="aspect-video bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 italic font-bold">Sans Verso</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
