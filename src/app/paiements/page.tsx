'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
    CreditCard, Loader2, Search, Calendar,
    ArrowUpRight, Download, Filter, User,
    TrendingUp, Receipt, Wallet, UploadCloud, Coins, Banknote,
    ChevronLeft, ChevronRight, Image as ImageIcon, Ticket,
    Clock, CheckCircle2, Eye, Edit2, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

// --- Helper Components & Utilities ---

const formatDateToDisplay = (dateStr: string) => {
    if (!dateStr) return 'JJ/MM/AAAA';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

const PremiumDatePicker = ({ value, onChange, label, align = 'left' }: { value: string, onChange: (val: string) => void, label: string, align?: 'left' | 'right' }) => {
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
                className="flex items-center gap-2 bg-white/50 hover:bg-white border border-[#e6dace] rounded-xl px-3 py-2 transition-all min-w-[130px] group w-full"
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
                            className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-3 bg-white rounded-3xl shadow-2xl border border-[#e6dace] p-5 z-[110] w-72`}
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
      totalRecetteCaisse
      totalExpenses
      totalUnpaidInvoices
      totalTicketsRestaurant
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

const UPDATE_BANK_DEPOSIT = gql`
  mutation UpdateBankDeposit($id: Int!, $amount: String!, $date: String!) {
    updateBankDeposit(id: $id, amount: $amount, date: $date) {
      id
    }
  }
`;

const DELETE_BANK_DEPOSIT = gql`
  mutation DeleteBankDeposit($id: Int!) {
    deleteBankDeposit(id: $id)
  }
`;

const ADD_PAID_INVOICE = gql`
  mutation AddPaidInvoice($supplier_name: String!, $amount: String!, $date: String!, $photo_url: String, $photo_cheque_url: String, $photo_verso_url: String, $payment_method: String!, $paid_date: String!, $payer: String, $doc_type: String) {
    addPaidInvoice(supplier_name: $supplier_name, amount: $amount, date: $date, photo_url: $photo_url, photo_cheque_url: $photo_cheque_url, photo_verso_url: $photo_verso_url, payment_method: $payment_method, paid_date: $paid_date, payer: $payer, doc_type: $doc_type) {
      id
    }
  }
`;

const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: Int!) {
    deleteInvoice(id: $id)
  }
`;

const PAY_INVOICE = gql`
  mutation PayInvoice($id: Int!, $payment_method: String!, $paid_date: String!, $photo_cheque_url: String, $photo_verso_url: String, $payer: String) {
    payInvoice(id: $id, payment_method: $payment_method, paid_date: $paid_date, photo_cheque_url: $photo_cheque_url, photo_verso_url: $photo_verso_url, payer: $payer) {
      id
      status
      paid_date
    }
  }
`;

const UNPAY_INVOICE = gql`
  mutation UnpayInvoice($id: Int!) {
    unpayInvoice(id: $id) {
        id
        status
        paid_date
    }
  }
`;

const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: Int!, $supplier_name: String, $amount: String, $date: String, $payment_method: String, $paid_date: String) {
    updateInvoice(id: $id, supplier_name: $supplier_name, amount: $amount, date: $date, payment_method: $payment_method, paid_date: $paid_date) {
      id
    }
  }
`;

const GET_INVOICES = gql`
  query GetInvoices($supplierName: String, $startDate: String, $endDate: String, $payer: String) {
    getInvoices(supplierName: $supplierName, startDate: $startDate, endDate: $endDate, payer: $payer) {
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
      photos
      doc_type
      doc_number
      payer
      origin
    }
  }
`;

export default function PaiementsPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ role: 'admin' | 'caissier', full_name: string } | null>(null);
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

    const ty = today.getFullYear();
    const tm = String(today.getMonth() + 1).padStart(2, '0');
    const td = String(today.getDate()).padStart(2, '0');
    const todayStr = `${ty}-${tm}-${td}`;

    // Forms State
    const [bankAmount, setBankAmount] = useState('');
    const [bankDate, setBankDate] = useState(todayStr);
    const [showBankForm, setShowBankForm] = useState(false);
    const [editingDeposit, setEditingDeposit] = useState<any>(null);

    const [expName, setExpName] = useState('');
    const [expAmount, setExpAmount] = useState('');
    const [expDate, setExpDate] = useState(todayStr);
    const [expMethod, setExpMethod] = useState('Espèces');
    const [expDocType, setExpDocType] = useState('Facture');
    const [expPhoto, setExpPhoto] = useState('');
    const [expPhotoCheque, setExpPhotoCheque] = useState('');
    const [expPhotoVerso, setExpPhotoVerso] = useState('');
    const [showExpForm, setShowExpForm] = useState(false);
    const [editingHistoryItem, setEditingHistoryItem] = useState<any>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    // Unpaid Invoices Modal State & Logic
    const [showUnpaidModal, setShowUnpaidModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState<any>(null);
    const [viewingUnpaidPhoto, setViewingUnpaidPhoto] = useState<any>(null);
    const [paymentDetails, setPaymentDetails] = useState({
        method: 'Espèces',
        date: todayStr,
        photo_cheque_url: '',
        photo_verso_url: ''
    });
    const [imgZoom, setImgZoom] = useState(1);
    const [imgRotation, setImgRotation] = useState(0);
    const [unpaidSearchFilter, setUnpaidSearchFilter] = useState('');
    const [unpaidDateRange, setUnpaidDateRange] = useState({ start: '', end: '' });

    const { data: unpaidData, refetch: refetchUnpaid } = useQuery(GET_INVOICES, {
        variables: { supplierName: '', startDate: '', endDate: '' },
        pollInterval: 5000
    });

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historySearch, setHistorySearch] = useState('');
    const [historyDateRange, setHistoryDateRange] = useState({ start: '', end: '' });

    const { data: historyData, refetch: refetchHistory } = useQuery(GET_INVOICES, {
        variables: { payer: 'riadh', startDate: '', endDate: '' },
        pollInterval: 5000,
        skip: !showHistoryModal
    });

    const [execPayInvoice] = useMutation(PAY_INVOICE);
    const [execDeleteInvoice] = useMutation(DELETE_INVOICE);
    const [execUnpayInvoice] = useMutation(UNPAY_INVOICE);
    const [execUpdateInvoice] = useMutation(UPDATE_INVOICE);

    const handlePaySubmit = async () => {
        if (!showPayModal) return;
        try {
            await execPayInvoice({
                variables: {
                    id: parseInt(showPayModal.id),
                    payment_method: paymentDetails.method,
                    paid_date: paymentDetails.date,
                    photo_cheque_url: paymentDetails.photo_cheque_url,
                    photo_verso_url: paymentDetails.photo_verso_url,
                    payer: 'riadh'
                }
            });
            await refetchUnpaid();
            await refetch();
            setShowPayModal(null);
            Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: 'Facture marquée comme payée',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (e) {
            console.error(e);
            Swal.fire('Erreur', 'Impossible de payer la facture', 'error');
        }
    };

    const handleDelete = async (inv: any) => {
        const isDirect = inv.origin === 'direct_expense';
        Swal.fire({
            title: isDirect ? 'Supprimer la dépense?' : 'Annuler le paiement?',
            text: isDirect
                ? "Cette dépense (Directe) sera définitivement supprimée de la base de données."
                : "Cette facture retournera dans la liste des impayés (Facturation).",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isDirect ? '#ef4444' : '#f59e0b',
            cancelButtonColor: '#8c8279',
            confirmButtonText: isDirect ? 'Oui, supprimer' : 'Oui, remettre en impayé',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    if (isDirect) {
                        await execDeleteInvoice({ variables: { id: parseInt(inv.id) } });
                        Swal.fire({
                            icon: 'success',
                            title: 'Supprimé!',
                            text: 'La dépense a été retirée définitivement.',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    } else {
                        await execUnpayInvoice({ variables: { id: parseInt(inv.id) } });
                        Swal.fire({
                            icon: 'success',
                            title: 'Annulé!',
                            text: 'Le paiement est annulé, la facture est de nouveau impayée.',
                            timer: 1500,
                            showConfirmButton: false
                        });
                        await refetchUnpaid();
                    }
                    await refetch();
                    await refetchHistory();
                } catch (e) {
                    console.error(e);
                    Swal.fire('Erreur', 'Une erreur est survenue lors de l\'opération', 'error');
                }
            }
        });
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

        const firstD = new Date(new Date().setDate(first));
        const fy = firstD.getFullYear();
        const fm = String(firstD.getMonth() + 1).padStart(2, '0');
        const fd = String(firstD.getDate()).padStart(2, '0');
        const firstday = `${fy}-${fm}-${fd}`;

        const lastday = todayStr;

        setDateRange({ start: firstday, end: lastday });
        setActiveFilter('week');
        setMonth(null);
    };

    const setThisYear = () => {
        const now = new Date();
        const firstday = `${now.getFullYear()}-01-01`;
        const lastday = todayStr;

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
    const [updateBankDeposit] = useMutation(UPDATE_BANK_DEPOSIT);
    const [deleteBankDeposit] = useMutation(DELETE_BANK_DEPOSIT);
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
        totalUnpaidInvoices: 0,
        totalTPE: 0,
        totalCheque: 0,
        totalCash: 0,
        totalBankDeposits: 0,
        totalRecetteCaisse: 0,
        totalExpenses: 0,
        totalTicketsRestaurant: 0
    };

    const handleBankSubmit = async () => {
        if (!bankAmount || !bankDate) return;
        try {
            if (editingDeposit) {
                await updateBankDeposit({ variables: { id: parseInt(editingDeposit.id), amount: bankAmount, date: bankDate } });
                setEditingDeposit(null);
            } else {
                await addBankDeposit({ variables: { amount: bankAmount, date: bankDate } });
            }
            setBankAmount('');
            setShowBankForm(false);
            refetch();
            Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: editingDeposit ? 'Versement bancaire mis à jour' : 'Versement bancaire ajouté',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (e) {
            console.error(e);
            Swal.fire('Erreur', 'Une erreur est survenue', 'error');
        }
    };

    const handleEditDepositClick = (d: any) => {
        setEditingDeposit(d);
        setBankAmount(d.amount);
        setBankDate(d.date);
        setShowBankForm(true);
    };

    const handleDeleteDeposit = (d: any) => {
        Swal.fire({
            title: 'Êtes-vous sûr?',
            text: "Ce versement sera supprimé définitivement.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteBankDeposit({ variables: { id: parseInt(d.id) } });
                    refetch();
                    Swal.fire('Supprimé!', 'Versement supprimé avec succès.', 'success');
                } catch (e) {
                    console.error(e);
                    Swal.fire('Erreur', 'Impossible de supprimer', 'error');
                }
            }
        });
    };

    const handleExpSubmit = async () => {
        if (!expName || !expAmount || !expDate) return;
        try {
            if (editingHistoryItem) {
                await execUpdateInvoice({
                    variables: {
                        id: parseInt(editingHistoryItem.id),
                        supplier_name: expName,
                        amount: expAmount,
                        date: expDate,
                        payment_method: expMethod,
                        paid_date: expDate,
                        doc_type: expDocType
                    }
                });
                Swal.fire('Mis à jour!', 'Dépense mise à jour avec succès.', 'success');
                setEditingHistoryItem(null);
            } else {
                await addPaidInvoice({
                    variables: {
                        supplier_name: expName,
                        amount: expAmount,
                        date: expDate,
                        photo_url: expPhoto,
                        photo_cheque_url: expPhotoCheque,
                        photo_verso_url: expPhotoVerso,
                        payment_method: expMethod,
                        paid_date: expDate,
                        payer: 'riadh',
                        doc_type: expDocType
                    }
                });
                Swal.fire('Ajouté!', 'Dépense ajoutée avec succès.', 'success');
            }
            setExpName('');
            setExpAmount('');
            setExpPhoto('');
            setExpPhotoCheque('');
            setExpPhotoVerso('');
            setShowExpForm(false);
            refetch();
            refetchHistory();
        } catch (e) {
            console.error(e);
            Swal.fire('Erreur', 'Une erreur est survenue lors de l\'enregistrement', 'error');
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
                                align="right"
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
                                                            className={`h-10 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${isActive ? 'bg-[#c69f6e] text-white shadow-lg shadow-[#c69f6e]/20' : 'text-[#8c8279] hover:bg-[#fcfaf8] hover:text-[#4a3426] border border-transparent hover:border-[#e6dace]'}`}
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
                    {/* Financial Summary Grid - 3 Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 1. Chiffre d'Affaire */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                            className="col-span-1 sm:col-span-2 lg:col-span-3 bg-gradient-to-br from-[#10b981] to-[#059669] p-10 rounded-[2.5rem] shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-all text-white"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-white/80 mb-4 uppercase text-xs font-black tracking-widest">
                                    <Wallet size={16} /> Chiffre d'Affaire
                                </div>
                                <h3 className="text-5xl lg:text-7xl font-black tracking-tighter">
                                    {stats.totalRecetteCaisse.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                </h3>
                                <span className="text-lg font-bold opacity-70 mt-2 block">DT</span>
                            </div>
                            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-500 text-white">
                                <Wallet size={180} />
                            </div>
                        </motion.div>

                        {/* 2. Total Dépenses (Moved here and made BIG) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            className="col-span-1 sm:col-span-2 lg:col-span-3 bg-gradient-to-br from-[#6b7280] to-[#4b5563] p-10 rounded-[2.5rem] shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-all text-white"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-white/80 mb-4 uppercase text-xs font-black tracking-widest">
                                    <Banknote size={16} /> Total Dépenses
                                </div>
                                <h3 className="text-5xl lg:text-7xl font-black tracking-tighter">
                                    {stats.totalExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                </h3>
                                <span className="text-lg font-bold opacity-70 mt-2 block">DT</span>
                            </div>
                            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-500 text-white">
                                <Banknote size={180} />
                            </div>
                        </motion.div>

                        {/* 3. Reste */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="col-span-1 sm:col-span-2 lg:col-span-3 bg-gradient-to-br from-[#22c55e] to-[#16a34a] p-10 rounded-[2.5rem] shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-all text-white"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-white/80 mb-4 uppercase text-xs font-black tracking-widest">
                                    <TrendingUp size={16} /> Reste
                                </div>
                                <h3 className="text-5xl lg:text-7xl font-black tracking-tighter">
                                    {stats.totalRecetteNette.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                </h3>
                                <span className="text-lg font-bold opacity-70 mt-2 block">DT</span>
                            </div>
                            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-500 text-white">
                                <TrendingUp size={180} />
                            </div>
                        </motion.div>

                        {/* 4. Total Cash */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] p-6 rounded-[2rem] shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-all text-white"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-white/80 mb-2 uppercase text-[9px] font-black tracking-widest">
                                    <Coins size={12} /> Total Cash
                                </div>
                                <h3 className="text-3xl font-black tracking-tighter">
                                    {stats.totalCash.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                </h3>
                                <span className="text-xs font-bold opacity-70">DT</span>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500 text-white">
                                <Coins size={80} />
                            </div>
                        </motion.div>

                        {/* 5. Bancaire */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] p-6 rounded-[2rem] shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-all text-white"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-white/80 mb-2 uppercase text-[9px] font-black tracking-widest">
                                    <CreditCard size={12} /> Bancaire (TPE + Vers. + Chèques)
                                </div>
                                <h3 className="text-3xl font-black tracking-tighter">
                                    {(stats.totalTPE + stats.totalBankDeposits + stats.totalCheque).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                </h3>
                                <span className="text-xs font-bold opacity-70">DT</span>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500 text-white">
                                <CreditCard size={80} />
                            </div>
                        </motion.div>

                        {/* 6. Ticket Restaurant */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                            className="bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] p-6 rounded-[2rem] shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-all text-white"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-white/80 mb-2 uppercase text-[9px] font-black tracking-widest">
                                    <Ticket size={12} /> Ticket Restaurant
                                </div>
                                <h3 className="text-3xl font-black tracking-tighter">
                                    {(stats.totalTicketsRestaurant || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                </h3>
                                <span className="text-xs font-bold opacity-70">DT</span>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500 text-white">
                                <Ticket size={80} />
                            </div>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Middle: Salaries/Payments List */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Nouvelle Dépense Section */}
                            <div className="bg-white p-6 rounded-[2.5rem] luxury-shadow border border-[#e6dace]/50">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-[#4a3426] flex items-center gap-2">
                                        <div className={editingHistoryItem ? "bg-blue-500 p-2 rounded-xl text-white" : "bg-red-500 p-2 rounded-xl text-white"}>
                                            <Receipt size={18} />
                                        </div>
                                        {editingHistoryItem ? 'Modifier la Dépense' : 'Nouvelle Dépense'}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {!showExpForm && (
                                            <div className="flex flex-col items-end gap-1">
                                                <button
                                                    onClick={() => {
                                                        refetchUnpaid();
                                                        setShowUnpaidModal(true);
                                                    }}
                                                    className="text-[10px] font-black uppercase tracking-widest bg-red-50 border-2 border-red-200 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 shadow-sm"
                                                >
                                                    <Clock size={14} className="text-red-500" />
                                                    <span className="flex items-baseline gap-1">
                                                        <span className="text-xs">Total Impayé:</span>
                                                        <span className="text-sm font-black">
                                                            {(unpaidData?.getInvoices?.filter((inv: any) => inv.status !== 'paid')
                                                                .reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || 0), 0) || 0)
                                                                .toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                        </span>
                                                        <span className="text-[9px]">DT</span>
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowHistoryModal(true);
                                                        refetchHistory();
                                                    }}
                                                    className="w-full text-[10px] font-black uppercase tracking-widest bg-[#f4ece4] border border-[#e6dace] text-[#c69f6e] py-1.5 rounded-lg hover:bg-[#ebdccf] transition-all flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <Clock size={12} />
                                                    <span>Historique Riadh</span>
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (showExpForm) {
                                                    setEditingHistoryItem(null);
                                                    setExpName('');
                                                    setExpAmount('');
                                                    setExpPhoto('');
                                                    setExpPhotoCheque('');
                                                    setExpPhotoVerso('');
                                                }
                                                setShowExpForm(!showExpForm);
                                            }}
                                            className="text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-500 px-3 py-2 rounded-xl hover:bg-red-100 transition-all h-10"
                                        >
                                            {showExpForm ? 'Annuler' : 'Ajouter une dépense'}
                                        </button>
                                    </div>
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
                                                            align="right"
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
                                                <div>
                                                    <label className="text-[10px] font-black text-red-700/50 uppercase ml-1">Type de Document</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpDocType('Facture')}
                                                            className={`flex-1 h-11 rounded-xl font-bold text-xs transition-all ${expDocType === 'Facture'
                                                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                                : 'bg-white border border-red-100 text-red-400 hover:bg-red-50'
                                                                }`}
                                                        >
                                                            📄 Facture
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpDocType('BL')}
                                                            className={`flex-1 h-11 rounded-xl font-bold text-xs transition-all ${expDocType === 'BL'
                                                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                                : 'bg-white border border-red-100 text-red-400 hover:bg-red-50'
                                                                }`}
                                                        >
                                                            📋 BL
                                                        </button>
                                                    </div>
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
                                                    className={`w-full h-11 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg md:mt-auto ${editingHistoryItem ? 'bg-blue-600 shadow-blue-500/20' : 'bg-red-500 shadow-red-500/20'}`}
                                                >
                                                    {addingExp ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editingHistoryItem ? 'Enregistrer les modifications' : 'Enregistrer la Dépense')}
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
                                            {(data?.getInvoices || [])
                                                .filter((inv: any) => editingHistoryItem?.id !== inv.id)
                                                .slice(0, 4)
                                                .map((inv: any) => (
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

                                </div>
                            </div>

                            {/* Confirmations Salaires Section */}
                            <div className="bg-white p-6 rounded-[2.5rem] luxury-shadow border border-[#e6dace]/50">
                                <div className="flex justify-between items-center px-2 mb-4">
                                    <h3 className="text-xl font-bold text-[#4a3426] flex items-center gap-2">
                                        <User size={20} className="text-[#c69f6e]" /> Restes Salaires
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
                                        onClick={() => {
                                            setShowBankForm(!showBankForm);
                                            setEditingDeposit(null);
                                            setBankAmount('');
                                            setBankDate(todayStr);
                                        }}
                                        className="text-[10px] font-black uppercase tracking-widest bg-[#f4ece4] text-[#c69f6e] px-3 py-2 rounded-xl hover:bg-[#ebdccf] transition-all"
                                    >
                                        {showBankForm ? 'Annuler' : 'Verser à la banque'}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {showBankForm && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="mb-6"
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
                                                            align="right"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleBankSubmit}
                                                    disabled={addingBank}
                                                    className="w-full h-11 bg-[#4a3426] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#4a3426]/20"
                                                >
                                                    {addingBank ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editingDeposit ? 'Mettre à jour' : 'Confirmer le Versement')}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-[#8c8279] uppercase tracking-widest px-2">Derniers versements</h4>
                                    {data?.getBankDeposits?.length > 0 ? (
                                        data.getBankDeposits
                                            .filter((d: any) => editingDeposit?.id !== d.id)
                                            .slice(0, 5)
                                            .map((d: any) => (
                                                <div key={d.id} className="flex justify-between items-center p-4 bg-[#fcfaf8] rounded-2xl border border-transparent hover:border-[#e6dace] transition-all group">
                                                    <div>
                                                        <p className="text-sm font-black text-[#4a3426] text-[15px]">{parseFloat(d.amount).toFixed(3)} DT</p>
                                                        <p className="text-[10px] font-bold text-[#8c8279] uppercase tracking-tighter">{new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="hidden group-hover:flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleEditDepositClick(d)}
                                                                className="w-8 h-8 rounded-lg bg-white border border-[#e6dace] text-[#c69f6e] flex items-center justify-center hover:bg-[#c69f6e] hover:text-white transition-all"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDeposit(d)}
                                                                className="w-8 h-8 rounded-lg bg-white border border-red-100 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                        <div className="bg-green-100 p-2 rounded-xl text-green-600">
                                                            <TrendingUp size={16} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    ) : (
                                        <p className="text-center py-8 text-xs font-bold text-[#8c8279] italic">Aucun versement enregistré</p>
                                    )}
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

                {/* Unpaid Invoices List Modal */}
                <AnimatePresence>
                    {showUnpaidModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-[#4a3426]/60 backdrop-blur-md flex items-center justify-center p-4"
                            onClick={() => setShowUnpaidModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-[#f9f6f2] rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/20 flex flex-col"
                            >
                                <div className="p-4 bg-white border-b border-[#e6dace] shrink-0">
                                    <div className="flex flex-col md:flex-row items-center gap-4">
                                        <div className="flex items-center gap-3 shrink-0">
                                            <h2 className="text-lg font-black text-[#4a3426] uppercase tracking-tight flex items-center gap-2">
                                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                                                    <Clock size={16} />
                                                </div>
                                                Factures Non Payées
                                                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs border border-red-100">
                                                    {unpaidData?.getInvoices?.filter((inv: any) => inv.status !== 'paid').length || 0}
                                                </span>
                                            </h2>
                                        </div>

                                        <div className="h-8 w-[1px] bg-[#e6dace] hidden md:block"></div>

                                        <div className="flex items-center gap-2 whitespace-nowrap bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 shrink-0">
                                            <span className="text-[10px] font-bold uppercase text-red-400">Total:</span>
                                            <span className="text-sm font-black text-red-600">
                                                {(unpaidData?.getInvoices?.filter((inv: any) => inv.status !== 'paid')
                                                    .reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || 0), 0) || 0)
                                                    .toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                            </span>
                                            <span className="text-[10px] font-bold text-red-400">DT</span>
                                        </div>

                                        <div className="flex-1 flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                                            <div className="relative min-w-[200px] flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8279]" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="Rechercher..."
                                                    value={unpaidSearchFilter}
                                                    onChange={(e) => setUnpaidSearchFilter(e.target.value)}
                                                    className="w-full h-9 pl-9 pr-3 bg-[#fcfaf8] border border-[#e6dace] rounded-lg text-xs font-bold text-[#4a3426] placeholder:text-[#8c8279]/50 focus:border-red-300 focus:ring-1 focus:ring-red-100 outline-none transition-all"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="w-32">
                                                    <PremiumDatePicker
                                                        label="Début"
                                                        value={unpaidDateRange.start}
                                                        onChange={(val) => setUnpaidDateRange(prev => ({ ...prev, start: val }))}
                                                    />
                                                </div>
                                                <span className="text-[#c69f6e] font-black text-xs opacity-30">→</span>
                                                <div className="w-32">
                                                    <PremiumDatePicker
                                                        label="Fin"
                                                        value={unpaidDateRange.end}
                                                        onChange={(val) => setUnpaidDateRange(prev => ({ ...prev, end: val }))}
                                                        align="right"
                                                    />
                                                </div>
                                                {(unpaidDateRange.start || unpaidDateRange.end) && (
                                                    <button
                                                        onClick={() => setUnpaidDateRange({ start: '', end: '' })}
                                                        className="h-9 px-3 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-all"
                                                    >
                                                        RàZ
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <button onClick={() => setShowUnpaidModal(false)} className="w-8 h-8 rounded-full hover:bg-[#fcfaf8] flex items-center justify-center text-[#8c8279] transition-colors shrink-0">
                                            <ChevronRight size={20} className="rotate-90" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {unpaidData?.getInvoices
                                            ?.filter((inv: any) => inv.status !== 'paid')
                                            .filter((inv: any) => {
                                                // Filter by supplier name
                                                if (unpaidSearchFilter) {
                                                    const searchLower = unpaidSearchFilter.toLowerCase();
                                                    const supplierMatch = inv.supplier_name?.toLowerCase().includes(searchLower);
                                                    if (!supplierMatch) return false;
                                                }

                                                // Filter by date range
                                                if (unpaidDateRange.start || unpaidDateRange.end) {
                                                    const invDate = new Date(inv.date);
                                                    if (unpaidDateRange.start) {
                                                        const startDate = new Date(unpaidDateRange.start);
                                                        if (invDate < startDate) return false;
                                                    }
                                                    if (unpaidDateRange.end) {
                                                        const endDate = new Date(unpaidDateRange.end);
                                                        if (invDate > endDate) return false;
                                                    }
                                                }

                                                return true;
                                            })
                                            .map((inv: any) => (
                                                <motion.div
                                                    key={inv.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-red-50 rounded-[2rem] border-2 border-red-200 overflow-hidden group hover:shadow-xl hover:shadow-red-500/10 transition-all flex flex-col"
                                                >
                                                    <div className="p-5 flex justify-between items-start border-b border-red-100/50 bg-red-100/30">
                                                        <div>
                                                            <span className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit mb-2">
                                                                <Clock size={12} /> Impayé
                                                            </span>
                                                            <h3 className="font-black text-lg text-[#4a3426] tracking-tight leading-tight line-clamp-1" title={inv.supplier_name}>{inv.supplier_name}</h3>
                                                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mt-1">Reçu le {new Date(inv.date).toLocaleDateString('fr-FR')}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl font-black text-red-600 leading-none">{parseFloat(inv.amount).toFixed(3)}</div>
                                                            <div className="text-[10px] font-bold text-red-400">TND</div>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-white flex-1">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                                {inv.photo_url ? (
                                                                    <button onClick={() => setViewingUnpaidPhoto(inv)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-black uppercase hover:bg-red-100 transition-colors">
                                                                        <Eye size={12} /> Voir
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-gray-300 italic px-2">Sans photo</span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-[#8c8279] bg-[#f9f6f2] px-2 py-1 rounded-md border border-[#e6dace] uppercase">
                                                                {inv.doc_type || 'Facture'} N°{inv.doc_number || '-'}
                                                            </span>
                                                        </div>

                                                        <div className="flex gap-2 mt-auto">
                                                            <button
                                                                onClick={() => setShowPayModal(inv)}
                                                                className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                                            >
                                                                <CheckCircle2 size={14} /> Régler
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(inv)}
                                                                className="w-10 h-10 border border-red-200 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </div>
                                    {(() => {
                                        const unpaidInvoices = unpaidData?.getInvoices?.filter((inv: any) => inv.status !== 'paid') || [];
                                        const filteredInvoices = unpaidInvoices.filter((inv: any) => {
                                            // Filter by supplier name
                                            if (unpaidSearchFilter) {
                                                const searchLower = unpaidSearchFilter.toLowerCase();
                                                const supplierMatch = inv.supplier_name?.toLowerCase().includes(searchLower);
                                                if (!supplierMatch) return false;
                                            }

                                            // Filter by date range
                                            if (unpaidDateRange.start || unpaidDateRange.end) {
                                                const invDate = new Date(inv.date);
                                                if (unpaidDateRange.start) {
                                                    const startDate = new Date(unpaidDateRange.start);
                                                    if (invDate < startDate) return false;
                                                }
                                                if (unpaidDateRange.end) {
                                                    const endDate = new Date(unpaidDateRange.end);
                                                    if (invDate > endDate) return false;
                                                }
                                            }

                                            return true;
                                        });

                                        if (unpaidInvoices.length === 0) {
                                            return (
                                                <div className="flex flex-col items-center justify-center h-64 text-[#8c8279] opacity-50 space-y-4">
                                                    <CheckCircle2 size={48} />
                                                    <p className="font-bold italic">Aucune facture impayée</p>
                                                </div>
                                            );
                                        }

                                        if (filteredInvoices.length === 0) {
                                            return (
                                                <div className="flex flex-col items-center justify-center h-64 text-[#8c8279] opacity-50 space-y-4">
                                                    <Search size={48} />
                                                    <p className="font-bold italic">Aucun résultat trouvé</p>
                                                    <p className="text-xs">Essayez d'ajuster vos filtres</p>
                                                </div>
                                            );
                                        }

                                        return null;
                                    })()}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Payment Modal */}
                <AnimatePresence>
                    {showPayModal && (
                        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-[#4a3426]/80 backdrop-blur-sm"
                                onClick={() => setShowPayModal(null)}
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl"
                            >
                                <div className="bg-[#10b981] p-6 text-white text-center relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-black uppercase tracking-widest mb-1">Règlement Facture</h3>
                                        <p className="text-sm font-medium opacity-90">{showPayModal.supplier_name}</p>
                                        <div className="mt-4 text-4xl font-black tracking-tighter">
                                            {parseFloat(showPayModal.amount).toFixed(3)} <span className="text-lg opacity-80">DT</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                                        <CheckCircle2 size={150} />
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-1 block ml-1">Mode de paiement</label>
                                        <div className="flex gap-2">
                                            {['Espèces', 'Chèque', 'Virement'].map(m => (
                                                <button
                                                    key={m}
                                                    onClick={() => setPaymentDetails({ ...paymentDetails, method: m })}
                                                    className={`flex-1 h-10 rounded-xl font-bold text-xs transition-all ${paymentDetails.method === m ? 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-1 block ml-1">Date de paiement</label>
                                        <input
                                            type="date"
                                            value={paymentDetails.date}
                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, date: e.target.value })}
                                            className="w-full h-10 bg-[#f9f6f2] border border-[#e6dace] rounded-xl px-4 font-bold text-[#4a3426] focus:border-[#10b981] outline-none text-sm"
                                        />
                                    </div>
                                    {paymentDetails.method === 'Chèque' && (
                                        <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100 text-center">
                                            <p className="text-xs text-yellow-700 font-bold mb-2">Photos Chèque (Optionnel)</p>
                                            <div className="flex gap-2 justify-center">
                                                <button className="px-3 py-1 bg-white border border-yellow-200 rounded-lg text-[10px] font-bold text-yellow-600 uppercase">Recto</button>
                                                <button className="px-3 py-1 bg-white border border-yellow-200 rounded-lg text-[10px] font-bold text-yellow-600 uppercase">Verso</button>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handlePaySubmit}
                                        className="w-full h-12 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-[#10b981]/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                                    >
                                        <CheckCircle2 size={18} /> Confirmer le paiement
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Photo Viewer for Unpaid Invoices */}
                <AnimatePresence>
                    {viewingUnpaidPhoto && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setViewingUnpaidPhoto(null)}>
                            <div className="relative max-w-4xl max-h-[90vh] w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                                <div className="absolute top-4 right-4 z-10">
                                    <button onClick={() => setViewingUnpaidPhoto(null)} className="bg-black/50 hover:bg-black text-white p-2 rounded-full backdrop-blur-md transition-all"><ChevronRight className="rotate-90" /></button>
                                </div>
                                <div className="h-[80vh] flex items-center justify-center p-4">
                                    <img src={viewingUnpaidPhoto.photo_url} className="max-w-full max-h-full object-contain rounded-lg" />
                                </div>
                                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent text-white text-center">
                                    <p className="font-bold">{viewingUnpaidPhoto.supplier_name}</p>
                                    <p className="text-xs opacity-70">{viewingUnpaidPhoto.amount} DT - {viewingUnpaidPhoto.date}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* History Modal for Riadh */}
            <AnimatePresence>
                {showHistoryModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-[#4a3426]/60 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setShowHistoryModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#f9f6f2] rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/20 flex flex-col"
                        >
                            <div className="p-6 bg-white border-b border-[#e6dace] shrink-0">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-black text-[#4a3426] uppercase tracking-tight flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#f4ece4] rounded-xl flex items-center justify-center text-[#c69f6e]">
                                            <Clock size={22} />
                                        </div>
                                        Historique Dépenses (Riadh)
                                    </h2>
                                    <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 rounded-full hover:bg-[#fcfaf8] flex items-center justify-center text-[#8c8279] transition-colors">
                                        <ChevronRight size={24} className="rotate-90" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c8279]" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Rechercher par nom..."
                                            value={historySearch}
                                            onChange={(e) => setHistorySearch(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-[#fcfaf8] border border-[#e6dace] rounded-xl font-medium text-[#4a3426] placeholder:text-[#8c8279]/50 focus:border-[#c69f6e] focus:ring-2 focus:ring-[#c69f6e]/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <PremiumDatePicker
                                                label="Début"
                                                value={historyDateRange.start}
                                                onChange={(val) => setHistoryDateRange(prev => ({ ...prev, start: val }))}
                                            />
                                        </div>
                                        <span className="text-[#c69f6e] font-black text-sm opacity-30 mt-5">→</span>
                                        <div className="flex-1">
                                            <PremiumDatePicker
                                                label="Fin"
                                                value={historyDateRange.end}
                                                onChange={(val) => setHistoryDateRange(prev => ({ ...prev, end: val }))}
                                                align="right"
                                            />
                                        </div>
                                        {(historyDateRange.start || historyDateRange.end) && (
                                            <button
                                                onClick={() => setHistoryDateRange({ start: '', end: '' })}
                                                className="mt-5 px-3 h-10 bg-[#f4ece4] text-[#c69f6e] rounded-xl text-xs font-bold hover:bg-[#ebdccf] transition-all"
                                            >
                                                Réinitialiser
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                                <div className="space-y-4">
                                    {(() => {
                                        const riadhInvoices = historyData?.getInvoices?.filter((inv: any) => inv.payer === 'riadh') || [];
                                        const filteredHistory = riadhInvoices.filter((inv: any) => {
                                            if (historySearch) {
                                                if (!inv.supplier_name.toLowerCase().includes(historySearch.toLowerCase())) return false;
                                            }
                                            if (historyDateRange.start) {
                                                if (new Date(inv.date) < new Date(historyDateRange.start)) return false;
                                            }
                                            if (historyDateRange.end) {
                                                if (new Date(inv.date) > new Date(historyDateRange.end)) return false;
                                            }
                                            return true;
                                        });

                                        if (filteredHistory.length > 0) {
                                            return filteredHistory
                                                .sort((a: any, b: any) => {
                                                    const dateA = new Date(a.paid_date || a.date).getTime();
                                                    const dateB = new Date(b.paid_date || b.date).getTime();
                                                    const dateDiff = dateB - dateA;
                                                    if (dateDiff !== 0) return dateDiff;
                                                    return parseInt(b.id) - parseInt(a.id);
                                                })
                                                .map((inv: any) => (
                                                    <div key={inv.id} className="group relative bg-white p-5 rounded-3xl border border-[#e6dace]/60 hover:border-[#c69f6e]/60 hover:shadow-lg hover:shadow-[#c69f6e]/5 transition-all duration-300">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-[#f9f6f2] flex items-center justify-center text-[#c69f6e] group-hover:bg-[#c69f6e] group-hover:text-white transition-colors duration-300">
                                                                    <Receipt size={20} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-black text-[#4a3426] text-lg leading-tight group-hover:text-[#c69f6e] transition-colors">{inv.supplier_name}</h3>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[10px] font-bold text-[#8c8279] uppercase tracking-wider bg-[#f4ece4] px-2 py-0.5 rounded-full">
                                                                            {inv.payment_method}
                                                                        </span>
                                                                        <span className="w-1 h-1 rounded-full bg-[#e6dace]"></span>
                                                                        {inv.origin === 'direct_expense' ? (
                                                                            <span className="text-[9px] font-black text-red-500/70 border border-red-200 px-1.5 py-0.5 rounded uppercase tracking-tighter">Directe</span>
                                                                        ) : (
                                                                            <span className="text-[9px] font-black text-blue-500/70 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-tighter">Facture</span>
                                                                        )}
                                                                        <span className="w-1 h-1 rounded-full bg-[#e6dace]"></span>
                                                                        <span className="text-[10px] font-bold text-[#8c8279] opacity-70">
                                                                            {new Date(inv.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-6">
                                                                <div className="text-right">
                                                                    <div className="font-black text-[#4a3426] text-xl">
                                                                        {parseFloat(inv.amount).toFixed(3)} <span className="text-sm opacity-50">DT</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingHistoryItem(inv);
                                                                            setExpName(inv.supplier_name);
                                                                            setExpAmount(inv.amount);
                                                                            setExpDate(inv.date);
                                                                            setExpMethod(inv.payment_method);
                                                                            setExpDocType(inv.doc_type || 'Facture');
                                                                            setShowExpForm(true);
                                                                            setShowHistoryModal(false);
                                                                        }}
                                                                        className="w-10 h-10 rounded-full border-2 border-blue-50 hover:border-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all text-blue-400"
                                                                        title="Modifier"
                                                                    >
                                                                        <Edit2 size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(inv)}
                                                                        className="w-10 h-10 rounded-full border-2 border-red-50 hover:border-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all text-red-400"
                                                                        title="Supprimer / Annuler"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                    {(inv.photo_url || inv.photo_cheque_url) && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedInvoice(inv);
                                                                                setShowHistoryModal(false);
                                                                            }}
                                                                            className="w-10 h-10 rounded-full border-2 border-[#f4ece4] hover:border-[#c69f6e] hover:bg-[#c69f6e] hover:text-white flex items-center justify-center transition-all text-[#c69f6e]"
                                                                            title="Voir détails"
                                                                        >
                                                                            <Eye size={18} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ));
                                        } else {
                                            return (
                                                <div className="text-center py-12 text-[#8c8279] font-bold italic opacity-50">
                                                    Aucun résultat correspondant
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
