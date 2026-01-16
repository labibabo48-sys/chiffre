'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
    CreditCard, Loader2, Search, Calendar,
    ArrowUpRight, Download, Filter, User, FileText,
    TrendingUp, Receipt, Wallet, UploadCloud, Coins, Banknote,
    ChevronLeft, ChevronRight, ChevronDown, Image as ImageIcon, Ticket,
    Clock, CheckCircle2, Eye, Edit2, Trash2, X, Layout, Plus,
    Truck, Sparkles, Calculator, Zap, Award
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
      totalRiadhExpenses
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
      category
    }
    getDailyExpenses(month: $month, startDate: $startDate, endDate: $endDate) {
      date
      diponce
      diponce_divers
      diponce_journalier
      diponce_admin
      avances_details { username montant }
      doublages_details { username montant }
      extras_details { username montant }
      primes_details { username montant }
      restes_salaires_details { username montant }
    }
    getSalaryRemainders(month: $month) {
      id
      employee_name
      amount
      month
      status
      updated_at
    }
    getEmployees {
      id
      name
      department
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
  mutation AddPaidInvoice($supplier_name: String!, $amount: String!, $date: String!, $photo_url: String, $photo_cheque_url: String, $photo_verso_url: String, $payment_method: String!, $paid_date: String!, $payer: String, $doc_type: String, $category: String) {
    addPaidInvoice(supplier_name: $supplier_name, amount: $amount, date: $date, photo_url: $photo_url, photo_cheque_url: $photo_cheque_url, photo_verso_url: $photo_verso_url, payment_method: $payment_method, paid_date: $paid_date, payer: $payer, doc_type: $doc_type, category: $category) {
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
  mutation UpdateInvoice($id: Int!, $supplier_name: String, $amount: String, $date: String, $payment_method: String, $paid_date: String, $category: String) {
    updateInvoice(id: $id, supplier_name: $supplier_name, amount: $amount, date: $date, payment_method: $payment_method, paid_date: $paid_date, category: $category) {
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
      category
      updated_at
    }
  }
`;

const GET_SALARY_REMAINDERS = gql`
  query GetSalaryRemainders($month: String) {
    getSalaryRemainders(month: $month) {
      id
      employee_name
      amount
      month
      status
    }
  }
`;

const UPSERT_SALARY_REMAINDER = gql`
  mutation UpsertSalaryRemainder($employee_name: String!, $amount: Float!, $month: String!, $status: String) {
    upsertSalaryRemainder(employee_name: $employee_name, amount: $amount, month: $month, status: $status) {
      id
      employee_name
      amount
      month
      status
      updated_at
    }
  }
`;

const DELETE_SALARY_REMAINDER = gql`
  mutation DeleteSalaryRemainder($employee_name: String!, $month: String!) {
    deleteSalaryRemainder(employee_name: $employee_name, month: $month)
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
    const [expCategory, setExpCategory] = useState('');
    const [expPhotoCheque, setExpPhotoCheque] = useState('');
    const [expPhotoVerso, setExpPhotoVerso] = useState('');
    const [showExpForm, setShowExpForm] = useState(false);
    const [showSalaryRemaindersModal, setShowSalaryRemaindersModal] = useState(false);
    const [salaryRemainderMonth, setSalaryRemainderMonth] = useState(currentMonthStr);
    const [salaryRemainderMode, setSalaryRemainderMode] = useState<'global' | 'employee'>('employee');
    const [salaryRemainderSearch, setSalaryRemainderSearch] = useState('');
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
    const [showExpensesDetails, setShowExpensesDetails] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
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
    const [upsertSalaryRemainder] = useMutation(UPSERT_SALARY_REMAINDER);
    const [deleteSalaryRemainder] = useMutation(DELETE_SALARY_REMAINDER);

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
        totalRiadhExpenses: 0,
        totalTicketsRestaurant: 0
    };

    const expenseDetails = useMemo(() => {
        if (!data || !data.getDailyExpenses) return {
            journalier: [], fournisseurs: [], divers: [], administratif: [],
            avances: [], doublages: [], extras: [], primes: [], restesSalaires: [], remainders: []
        };
        const base = {
            journalier: [], fournisseurs: [], divers: [], administratif: [],
            avances: [], doublages: [], extras: [], primes: [], restesSalaires: [], remainders: []
        };

        // Add direct expenses from invoices categorized
        const directExpenses = (data.getInvoices || []).filter((inv: any) => inv.payer === 'riadh' && inv.category);

        const agg = data.getDailyExpenses.reduce((acc: any, curr: any) => {
            let d = [], dv = [], dj = [], da = [];
            try { d = JSON.parse(curr.diponce || '[]'); } catch (e) { }
            try { dv = JSON.parse(curr.diponce_divers || '[]'); } catch (e) { }
            try { dj = JSON.parse(curr.diponce_journalier || '[]'); } catch (e) { }
            try { da = JSON.parse(curr.diponce_admin || '[]'); } catch (e) { }

            return {
                ...acc,
                fournisseurs: [...acc.fournisseurs, ...d],
                divers: [...acc.divers, ...dv],
                journalier: [...acc.journalier, ...dj],
                administratif: [...acc.administratif, ...da],
                avances: [...acc.avances, ...curr.avances_details],
                doublages: [...acc.doublages, ...curr.doublages_details],
                extras: [...acc.extras, ...curr.extras_details],
                primes: [...acc.primes, ...curr.primes_details],
                restesSalaires: [...acc.restesSalaires, ...(curr.restes_salaires_details || [])]
            };
        }, { ...base });

        // Merge direct expenses from invoices into the aggregation
        directExpenses.forEach((inv: any) => {
            if (inv.category === 'Journalier') agg.journalier.push({ designation: inv.supplier_name, amount: inv.amount });
            else if (inv.category === 'Fournisseur') agg.fournisseurs.push({ supplier: inv.supplier_name, amount: inv.amount });
            else if (inv.category === 'Divers') agg.divers.push({ designation: inv.supplier_name, amount: inv.amount });
        });

        // Add salary remainders
        (data.getSalaryRemainders || []).forEach((rem: any) => {
            const displayName = rem.employee_name === 'Restes Salaires' ? 'Tous Employés' : rem.employee_name;
            agg.remainders.push({ name: displayName, amount: rem.amount, updated_at: rem.updated_at });
        });

        const group = (list: any[], nameKey: string, amountKey: string) => {
            const map = new Map();
            list.forEach(item => {
                const name = item[nameKey];
                if (!name) return;
                const amt = parseFloat(item[amountKey] || '0');
                map.set(name, (map.get(name) || 0) + amt);
            });
            return Array.from(map.entries()).map(([name, amount]) => ({ name, amount })).filter(x => x.amount > 0).sort((a, b) => b.amount - a.amount);
        };

        return {
            journalier: group(agg.journalier, 'designation', 'amount'),
            fournisseurs: group(agg.fournisseurs, 'supplier', 'amount'),
            divers: group(agg.divers, 'designation', 'amount'),
            administratif: group(agg.administratif, 'designation', 'amount'),
            avances: group(agg.avances, 'username', 'montant'),
            doublages: group(agg.doublages, 'username', 'montant'),
            extras: group(agg.extras, 'username', 'montant'),
            primes: group(agg.primes, 'username', 'montant'),
            restesSalaires: group(agg.restesSalaires, 'username', 'montant'),
            remainders: agg.remainders
        };
    }, [data]);

    const totals = useMemo(() => {
        const dep = expenseDetails.journalier.reduce((a: number, b: any) => a + b.amount, 0) +
            expenseDetails.fournisseurs.reduce((a: number, b: any) => a + b.amount, 0) +
            expenseDetails.divers.reduce((a: number, b: any) => a + b.amount, 0) +
            expenseDetails.administratif.reduce((a: number, b: any) => a + b.amount, 0);

        const sal = expenseDetails.avances.reduce((a: number, b: any) => a + b.amount, 0) +
            expenseDetails.doublages.reduce((a: number, b: any) => a + b.amount, 0) +
            expenseDetails.extras.reduce((a: number, b: any) => a + b.amount, 0) +
            expenseDetails.primes.reduce((a: number, b: any) => a + b.amount, 0) +
            expenseDetails.restesSalaires.reduce((a: number, b: any) => a + b.amount, 0) +
            expenseDetails.remainders.reduce((a: number, b: any) => a + b.amount, 0);

        return {
            expenses: dep,
            salaries: sal,
            riadh: stats.totalRiadhExpenses,
            global: dep + sal + stats.totalRiadhExpenses
        };
    }, [expenseDetails, stats.totalRiadhExpenses]);

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
        if (showBankForm) {
            setShowBankForm(false);
            setEditingDeposit(null);
            setBankAmount('');
        } else {
            setEditingDeposit(d);
            setBankAmount(d.amount);
            setBankDate(d.date);
            setShowBankForm(true);
        }
    };

    const handleEditHistoryItemClick = (inv: any) => {
        if (showExpForm) {
            setShowExpForm(false);
            setEditingHistoryItem(null);
            setExpName('');
            setExpAmount('');
        } else {
            setEditingHistoryItem(inv);
            setExpName(inv.supplier_name);
            setExpAmount(inv.amount);
            setExpDate(inv.date);
            setExpMethod(inv.payment_method);
            setExpDocType(inv.doc_type || 'Facture');
            setShowExpForm(true);
            setShowHistoryModal(false);
        }
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
        if (!expCategory && !editingHistoryItem) {
            Swal.fire('Catégorie requise', 'Veuillez sélectionner une catégorie (Fournisseur, Journalier ou Divers)', 'warning');
            return;
        }
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
                        doc_type: expDocType,
                        category: expCategory || editingHistoryItem.category
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
                        doc_type: expDocType,
                        category: expCategory
                    }
                });
                Swal.fire('Ajouté!', 'Dépense ajoutée avec succès.', 'success');
            }
            setExpName('');
            setExpAmount('');
            setExpPhoto('');
            setExpPhotoCheque('');
            setExpPhotoVerso('');
            setExpCategory('');
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
                    <div className="space-y-4">
                        {/* 1. Chiffre d'Affaire */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                            className="bg-[#3eb37c] p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:scale-[1.005] transition-all text-white h-56 flex flex-col justify-center"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-white/90 mb-4 uppercase text-[11px] font-bold tracking-[0.2em]">
                                    <FileText size={18} /> Chiffre d'Affaire
                                </div>
                                <h3 className="text-6xl font-black tracking-tighter mb-2">
                                    {stats.totalRecetteCaisse.toLocaleString('fr-FR', { minimumFractionDigits: 3 }).replace(/\s/g, ',')}
                                </h3>
                                <span className="text-xl font-bold opacity-80 block">DT</span>
                            </div>
                            <div className="absolute right-8 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-500 text-white">
                                <Wallet size={160} />
                            </div>
                        </motion.div>

                        {/* 2. Total Dépenses (This now shows the TOTAL Global) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            onClick={() => setShowExpensesDetails(true)}
                            className="bg-[#4b5563] p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:scale-[1.005] transition-all text-white h-56 flex flex-col justify-center cursor-pointer"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-white/90 mb-4 uppercase text-[11px] font-bold tracking-[0.2em]">
                                    <Banknote size={18} /> Total Dépenses
                                </div>
                                <h3 className="text-6xl font-black tracking-tighter mb-2">
                                    {totals.global.toLocaleString('fr-FR', { minimumFractionDigits: 3 }).replace(/\s/g, ',')}
                                </h3>
                                <span className="text-xl font-bold opacity-80 block">DT</span>
                            </div>
                            <div className="absolute right-8 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-500 text-white">
                                <Banknote size={160} />
                            </div>
                        </motion.div>

                        {/* 3. Reste */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-[#56b350] p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:scale-[1.005] transition-all text-white h-56 flex flex-col justify-center"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-white/90 mb-4 uppercase text-[11px] font-bold tracking-[0.2em]">
                                    <TrendingUp size={18} /> Reste
                                </div>
                                <h3 className="text-6xl font-black tracking-tighter mb-2">
                                    {stats.totalRecetteNette.toLocaleString('fr-FR', { minimumFractionDigits: 3 }).replace(/\s/g, ',')}
                                </h3>
                                <span className="text-xl font-bold opacity-80 block">DT</span>
                            </div>
                            <div className="absolute right-8 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-500 text-white">
                                <TrendingUp size={160} />
                            </div>
                        </motion.div>
                    </div>

                    {/* Secondary Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 4. Total Cash */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-[#f59e0b] p-8 rounded-[2rem] shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all text-white h-40 flex flex-col justify-center"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-white/90 mb-2 uppercase text-[10px] font-bold tracking-widest">
                                    <Coins size={14} /> Total Cash
                                </div>
                                <h3 className="text-4xl font-black tracking-tighter">{stats.totalCash.toLocaleString('fr-FR', { minimumFractionDigits: 3 }).replace(/\s/g, ',')}</h3>
                                <span className="text-sm font-bold opacity-70">DT</span>
                            </div>
                            <div className="absolute right-4 bottom-2 opacity-10 group-hover:scale-110 transition-transform duration-500 text-white">
                                <Coins size={80} />
                            </div>
                        </motion.div>

                        {/* 5. Bancaire */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            className="bg-[#3b82f6] p-8 rounded-[2rem] shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all text-white h-40 flex flex-col justify-center"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-white/90 mb-2 uppercase text-[10px] font-bold tracking-widest">
                                    <CreditCard size={14} /> Bancaire (TPE + Vers. + Chèques)
                                </div>
                                <h3 className="text-4xl font-black tracking-tighter">
                                    {(stats.totalTPE + stats.totalBankDeposits + stats.totalCheque).toLocaleString('fr-FR', { minimumFractionDigits: 3 }).replace(/\s/g, ',')}
                                </h3>
                                <span className="text-sm font-bold opacity-70">DT</span>
                            </div>
                            <div className="absolute right-4 bottom-2 opacity-10 group-hover:scale-110 transition-transform duration-500 text-white">
                                <CreditCard size={80} />
                            </div>
                        </motion.div>

                        {/* 6. Ticket Restaurant */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                            className="bg-[#8b5cf6] p-8 rounded-[2rem] shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all text-white h-40 flex flex-col justify-center"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-white/90 mb-2 uppercase text-[10px] font-bold tracking-widest">
                                    <Ticket size={14} /> Ticket Restaurant
                                </div>
                                <h3 className="text-4xl font-black tracking-tighter">
                                    {(stats.totalTicketsRestaurant || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 }).replace(/\s/g, ',')}
                                </h3>
                                <span className="text-sm font-bold opacity-70">DT</span>
                            </div>
                            <div className="absolute right-4 bottom-2 opacity-10 group-hover:scale-110 transition-transform duration-500 text-white">
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
                                            className="grid grid-cols-1 gap-4 mb-6 p-6 bg-red-50/30 rounded-3xl border border-red-100"
                                        >
                                            {/* Category Selection */}
                                            <div className="flex flex-col gap-2 mb-2">
                                                <label className="text-[10px] font-black text-red-700/50 uppercase ml-1">Choisir une Catégorie <span className="text-red-500">*</span></label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { id: 'Fournisseur', label: 'Fournisseur', icon: Truck },
                                                        { id: 'Journalier', label: 'Journalier', icon: Clock },
                                                        { id: 'Divers', label: 'Divers', icon: Sparkles }
                                                    ].map((cat) => (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => setExpCategory(cat.id)}
                                                            className={`flex items-center justify-center gap-2 h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${expCategory === cat.id
                                                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 ring-4 ring-red-500/10'
                                                                : 'bg-white border border-red-100 text-red-400 hover:bg-white/80'
                                                                }`}
                                                        >
                                                            <cat.icon size={16} />
                                                            {cat.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-6">
                                    {/* Dernières Dépenses */}


                                </div>
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
                    {/* Restes Salaires Section */}
                    <div className="bg-[#f9f6f2] rounded-[2.5rem] p-8 shadow-sm border border-[#e6dace]/50">
                        <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <User className="text-[#c69f6e]" size={24} />
                                <h2 className="text-xl font-black text-[#4a3426] tracking-tight">Restes Salaires</h2>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex bg-[#fcfaf8] border border-[#e6dace] rounded-xl p-1 shadow-inner h-10 items-center">
                                    <input
                                        type="month"
                                        value={salaryRemainderMonth}
                                        onChange={(e) => setSalaryRemainderMonth(e.target.value)}
                                        className="bg-transparent px-3 py-1 text-xs font-black text-[#4a3426] outline-none h-full"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSalaryRemainderMode('global')}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${salaryRemainderMode === 'global' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                    >
                                        Global
                                    </button>
                                    <button
                                        onClick={() => setSalaryRemainderMode('employee')}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${salaryRemainderMode === 'employee' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                    >
                                        Employés
                                    </button>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c69f6e]" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Filtrer employé..."
                                        value={salaryRemainderSearch}
                                        onChange={(e) => setSalaryRemainderSearch(e.target.value)}
                                        className="w-64 h-10 bg-white border border-[#e6dace] rounded-xl pl-10 pr-4 text-xs font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all placeholder:text-[#8c8279]/50 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {salaryRemainderMode === 'global' ? (
                            <div className="flex justify-center py-12">
                                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-red-500/5 border border-red-100 w-full max-w-md text-center group">
                                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-4 ring-red-50/50">
                                        <Banknote size={32} />
                                    </div>
                                    <h3 className="text-sm font-black text-[#8c8279] uppercase tracking-widest mb-6">Montant Global ({salaryRemainderMonth})</h3>
                                    <div className="relative">
                                        <input
                                            id="global-salary-input"
                                            key={salaryRemainderMonth}
                                            type="number"
                                            step="0.001"
                                            defaultValue={0}
                                            className="w-full text-center text-5xl font-black text-[#4a3426] outline-none border-b-2 border-[#e6dace] focus:border-red-400 pb-2 bg-transparent transition-colors"
                                        />
                                        <span className="text-xs font-black text-[#c69f6e] mt-2 block mb-6">DT</span>

                                        <div className="flex gap-2 mt-6">
                                            <button
                                                id="global-save-btn"
                                                onClick={async () => {
                                                    const input = document.getElementById('global-salary-input') as HTMLInputElement;
                                                    const val = parseFloat(input?.value || '0');
                                                    await upsertSalaryRemainder({
                                                        variables: {
                                                            employee_name: 'Restes Salaires',
                                                            amount: val || 0,
                                                            month: salaryRemainderMonth,
                                                            status: 'CONFIRMÉ'
                                                        }
                                                    });
                                                    await refetch();
                                                    if (input) input.value = '';
                                                    const btn = document.getElementById('global-save-btn');
                                                    if (btn) {
                                                        const originalText = btn.innerHTML;
                                                        btn.innerHTML = '<span class="flex items-center gap-2 justify-center">ENREGISTRÉ <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>';
                                                        btn.classList.add('bg-green-500', 'text-white', 'border-green-500', 'shadow-green-500/30');
                                                        btn.classList.remove('bg-white', 'text-red-500', 'border-red-200');
                                                        setTimeout(() => {
                                                            btn.innerHTML = originalText;
                                                            btn.classList.remove('bg-green-500', 'text-white', 'border-green-500', 'shadow-green-500/30');
                                                            btn.classList.add('bg-white', 'text-red-500', 'border-red-200');
                                                        }, 2000);
                                                    }
                                                }}
                                                className="flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-white border-2 border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-md active:scale-95"
                                            >
                                                Sauvegarder
                                            </button>
                                        </div>
                                        <div className="mt-8 space-y-3">
                                            {(() => {
                                                const globals = (data?.getSalaryRemainders || []).filter((r: any) => r.employee_name === 'Restes Salaires').sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
                                                if (globals.length === 0) return null;
                                                return globals.map((g: any) => (
                                                    <div key={g.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-red-100 shadow-sm group hover:border-red-200 transition-colors">
                                                        <div className="flex flex-col items-start">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="font-black text-xl text-[#4a3426]">{g.amount}</span>
                                                                <span className="text-[10px] font-bold text-[#c69f6e] uppercase">DT</span>
                                                            </div>
                                                            {g.updated_at && (
                                                                <p className="text-[9px] font-bold text-green-600/70 mt-1 flex items-center gap-1">
                                                                    <CheckCircle2 size={10} />
                                                                    {new Date(Number(g.updated_at) || g.updated_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                Swal.fire({
                                                                    title: 'Supprimer?',
                                                                    text: 'Voulez-vous supprimer ce montant?',
                                                                    icon: 'warning',
                                                                    showCancelButton: true,
                                                                    confirmButtonColor: '#ef4444',
                                                                    cancelButtonColor: '#8c8279',
                                                                    confirmButtonText: 'Oui'
                                                                }).then(async (result) => {
                                                                    if (result.isConfirmed) {
                                                                        await deleteSalaryRemainder({ variables: { id: parseInt(g.id) } });
                                                                        await refetch();
                                                                    }
                                                                });
                                                            }}
                                                            className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-3xl border border-[#e6dace]/30 bg-white">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#fcfaf8] border-b border-[#e6dace]/30">
                                            <th className="px-8 py-5 text-[10px] font-black text-[#8c8279] uppercase tracking-[0.2em]">Employé</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-[#8c8279] uppercase tracking-[0.2em] text-center">Montant</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-[#8c8279] uppercase tracking-[0.2em] text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e6dace]/10">
                                        {(() => {
                                            const employees = data?.getEmployees || [];
                                            const remainders = data?.getSalaryRemainders || [];
                                            const filtered = employees.filter((emp: any) => emp.name.toLowerCase().includes(salaryRemainderSearch.toLowerCase()));

                                            if (filtered.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={3} className="px-8 py-12 text-center text-[#8c8279] italic font-bold opacity-50">Aucun employé trouvé</td>
                                                    </tr>
                                                );
                                            }

                                            return filtered.map((emp: any) => {
                                                const rem = remainders.find((r: any) => r.employee_name === emp.name);
                                                const initials = emp.name.split(' ').map((n: any) => n[0]).join('').toUpperCase().substring(0, 2);
                                                return (
                                                    <tr key={emp.id} className="hover:bg-[#fcfaf8]/50 transition-colors group">
                                                        <td className="px-8 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-[#f4ece4] flex items-center justify-center text-[10px] font-black text-[#c69f6e] group-hover:scale-110 transition-transform">{initials}</div>
                                                                <span className="font-black text-[#4a3426] tracking-tight text-sm">{emp.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-4">
                                                            <div className="flex items-center justify-center gap-2 relative">
                                                                <input
                                                                    id={`salary-input-${emp.id}`}
                                                                    type="number"
                                                                    step="0.001"
                                                                    defaultValue={rem?.amount || 0}
                                                                    className={`w-32 text-center font-black bg-transparent outline-none border-b transition-colors text-lg ${rem && rem.amount > 0 ? 'text-green-600 border-green-200 focus:border-green-500' : 'text-[#4a3426] border-transparent focus:border-[#c69f6e]'}`}
                                                                />
                                                                <span className={`text-[10px] font-black mt-1 ${rem && rem.amount > 0 ? 'text-green-600/60' : 'text-[#4a3426]/40'}`}>DT</span>
                                                                {rem && rem.amount > 0 && (
                                                                    <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-green-500">
                                                                        <CheckCircle2 size={16} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    id={`save-btn-${emp.id}`}
                                                                    onClick={async () => {
                                                                        const input = document.getElementById(`salary-input-${emp.id}`) as HTMLInputElement;
                                                                        const val = parseFloat(input?.value || '0');
                                                                        await upsertSalaryRemainder({
                                                                            variables: {
                                                                                employee_name: emp.name,
                                                                                amount: val || 0,
                                                                                month: salaryRemainderMonth,
                                                                                status: 'CONFIRMÉ'
                                                                            }
                                                                        });
                                                                        await refetch();
                                                                        const btn = document.getElementById(`save-btn-${emp.id}`);
                                                                        if (btn) {
                                                                            const originalContent = btn.innerHTML;
                                                                            const originalClasses = btn.className;

                                                                            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                                                                            btn.className = "w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30 transition-all scale-110";

                                                                            setTimeout(() => {
                                                                                btn.innerHTML = originalContent;
                                                                                btn.className = originalClasses;
                                                                            }, 2000);
                                                                        }
                                                                    }}
                                                                    className={`inline-flex items-center justify-center h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm ${rem && rem.amount > 0
                                                                        ? 'bg-white text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300'
                                                                        : 'bg-white text-[#4a3426] border-[#e6dace] hover:bg-[#2d6a4f] hover:text-white hover:border-[#2d6a4f]'}`}
                                                                >
                                                                    {rem && rem.amount > 0 ? 'Modifier' : 'Sauvegarder'}
                                                                </button>

                                                                {rem && rem.amount > 0 && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            Swal.fire({
                                                                                title: 'Supprimer?',
                                                                                text: 'Voulez-vous supprimer ce montant?',
                                                                                icon: 'warning',
                                                                                showCancelButton: true,
                                                                                confirmButtonColor: '#ef4444',
                                                                                cancelButtonColor: '#8c8279',
                                                                                confirmButtonText: 'Oui'
                                                                            }).then(async (result) => {
                                                                                if (result.isConfirmed) {
                                                                                    await deleteSalaryRemainder({
                                                                                        variables: {
                                                                                            id: parseInt(rem.id)
                                                                                        }
                                                                                    });
                                                                                    await refetch();
                                                                                    const input = document.getElementById(`salary-input-${emp.id}`) as HTMLInputElement;
                                                                                    if (input) input.value = "0";
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 flex items-center justify-center transition-all shadow-sm active:scale-95"
                                                                        title="Supprimer"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        )}
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
                                            .sort((a: any, b: any) => {
                                                const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
                                                if (dateDiff !== 0) return dateDiff;
                                                return parseInt(b.id) - parseInt(a.id);
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
            </div >

            {/* History Modal for Riadh */}
            <AnimatePresence>
                {
                    showHistoryModal && (
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
                                                        const timeA = new Date(a.updated_at || a.date).getTime();
                                                        const timeB = new Date(b.updated_at || b.date).getTime();
                                                        const timeDiff = timeB - timeA;
                                                        if (timeDiff !== 0) return timeDiff;
                                                        return parseInt(b.id) - parseInt(a.id);
                                                    })
                                                    .map((inv: any) => (
                                                        <div key={inv.id} className="group relative bg-white p-5 rounded-[2rem] border border-[#e6dace]/60 hover:border-[#c69f6e]/60 hover:shadow-xl hover:shadow-[#c69f6e]/5 transition-all duration-300">
                                                            <div className="flex justify-between items-center">
                                                                {/* Actions & Amount (Left side now) */}
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleDelete(inv)}
                                                                            className="w-10 h-10 rounded-full border-2 border-red-50 hover:border-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all text-red-400"
                                                                            title="Supprimer / Annuler"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleEditHistoryItemClick(inv)}
                                                                            className="w-10 h-10 rounded-full border-2 border-blue-50 hover:border-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all text-blue-400"
                                                                            title="Modifier"
                                                                        >
                                                                            <Edit2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="text-left bg-[#fdfbf7] px-4 py-2 rounded-2xl border border-[#e6dace]/30">
                                                                        <div className="font-black text-[#4a3426] text-xl">
                                                                            {parseFloat(inv.amount).toFixed(3)} <span className="text-xs opacity-50">DT</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* PHOTO button (Center) */}
                                                                <div className="flex-1 flex justify-center mx-4">
                                                                    {(inv.photo_url || inv.photo_cheque_url) ? (
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedInvoice(inv);
                                                                                setShowHistoryModal(false);
                                                                            }}
                                                                            className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-[#c69f6e] text-[#c69f6e] hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-[#c69f6e]/20 shadow-sm hover:shadow-lg hover:shadow-[#c69f6e]/20 group/btn"
                                                                        >
                                                                            <ImageIcon size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                                            <span>Photo</span>
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-[9px] font-black text-[#8c8279]/30 uppercase tracking-widest italic border border-dashed border-[#e6dace] px-3 py-1 rounded-full select-none">Pas de photo</span>
                                                                    )}
                                                                </div>

                                                                {/* Info & Icon (Right side now) */}
                                                                <div className="flex items-center gap-4 text-right">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1 justify-end">
                                                                            <h3 className="font-black text-[#4a3426] text-lg leading-tight group-hover:text-[#c69f6e] transition-colors">{inv.supplier_name}</h3>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 justify-end">
                                                                            <span className="text-[9px] font-bold text-[#8c8279] uppercase tracking-wider bg-[#f4ece4] px-2 py-0.5 rounded-full">
                                                                                {inv.payment_method}
                                                                            </span>
                                                                            <span className="w-1 h-1 rounded-full bg-[#e6dace]"></span>
                                                                            {inv.origin === 'direct_expense' ? (
                                                                                <span className="text-[9px] font-black text-red-500/70 border border-red-200 px-1.5 py-0.5 rounded uppercase tracking-tighter bg-red-50/50">Directe</span>
                                                                            ) : (
                                                                                <span className="text-[9px] font-black text-blue-500/70 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-tighter bg-blue-50/50">Facture</span>
                                                                            )}
                                                                            <span className="w-1 h-1 rounded-full bg-[#e6dace]"></span>
                                                                            <span className="text-[10px] font-bold text-[#8c8279] opacity-70">
                                                                                {new Date(inv.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-12 h-12 rounded-2xl bg-[#f9f6f2] flex items-center justify-center text-[#c69f6e] group-hover:bg-[#c69f6e] group-hover:text-white transition-colors duration-300 shadow-sm">
                                                                        <Receipt size={20} />
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
                    )
                }
            </AnimatePresence >

            {/* Expenses Details Modal */}
            <AnimatePresence>
                {
                    showExpensesDetails && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-[#4a3426]/60 backdrop-blur-sm"
                                onClick={() => setShowExpensesDetails(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-[#fcfaf8] w-full max-w-7xl h-auto max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col"
                            >
                                <div className="p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-3 items-center mb-8 bg-white/50 p-6 rounded-[2rem] border border-[#e6dace]/30">
                                        <div className="text-left">
                                            <h2 className="text-3xl font-black text-[#4a3426] tracking-tighter">Détails des Dépenses</h2>
                                            <p className="text-[#c69f6e] font-black text-[10px] uppercase tracking-[0.3em] mt-1">Récapitulatif financier complet</p>
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <p className="text-[9px] font-black text-[#8c8279] uppercase tracking-widest leading-none mb-1 opacity-60">Total Global</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-3xl font-black text-[#4a3426] tracking-tighter">
                                                    {totals.global.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}
                                                </p>
                                                <span className="text-xs font-black text-[#c69f6e]">DT</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => setShowExpensesDetails(false)}
                                                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#8c8279] hover:bg-red-50 hover:text-red-500 transition-all border border-[#e6dace]/50 shadow-sm"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start pb-8">
                                        {[
                                            { title: 'Dépenses Journalier', subtitle: 'Quotidien & Fonctionnement', icon: Clock, color: 'text-[#c69f6e]', iconBg: 'bg-[#c69f6e]/10', items: expenseDetails.journalier },
                                            { title: 'Dépenses Fournisseurs', subtitle: 'Marchandises & Services', icon: Truck, color: 'text-[#4a3426]', iconBg: 'bg-[#4a3426]/10', items: expenseDetails.fournisseurs },
                                            { title: 'Dépenses Divers', subtitle: 'Frais Exceptionnels', icon: Sparkles, color: 'text-[#c69f6e]', iconBg: 'bg-[#c69f6e]/10', items: expenseDetails.divers },
                                            { title: 'Dépenses Administratif', subtitle: 'Loyers, Factures & Bureaux', icon: Layout, color: 'text-[#4a3426]', iconBg: 'bg-[#4a3426]/10', items: expenseDetails.administratif },
                                            { title: 'Historique Dépenses (Riadh)', subtitle: 'Paiements directs', icon: User, color: 'text-[#c69f6e]', iconBg: 'bg-[#c69f6e]/10', amount: stats.totalRiadhExpenses, items: [] },
                                            { title: 'Accompte', subtitle: 'Avances sur salaires', icon: Calculator, color: 'text-[#a89284]', iconBg: 'bg-[#a89284]/10', items: expenseDetails.avances },
                                            { title: 'Doublage', subtitle: 'Heures supplémentaires', icon: TrendingUp, color: 'text-[#4a3426]', iconBg: 'bg-[#4a3426]/10', items: expenseDetails.doublages },
                                            { title: 'Extra', subtitle: 'Main d\'œuvre occasionnelle', icon: Zap, color: 'text-[#c69f6e]', iconBg: 'bg-[#c69f6e]/10', items: expenseDetails.extras },
                                            { title: 'Primes', subtitle: 'Récompenses & Bonus', icon: Sparkles, color: 'text-[#2d6a4f]', iconBg: 'bg-[#2d6a4f]/10', items: expenseDetails.primes },
                                            { title: 'TOUS EMPLOYÉS', subtitle: 'Salaires en attente', icon: Banknote, color: 'text-red-500', iconBg: 'bg-red-50', items: expenseDetails.remainders }
                                        ].map((cat, idx) => {
                                            const total = cat.amount !== undefined ? cat.amount : (cat.items || []).reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
                                            // Show Restes Salaires even if 0, but hide others if 0
                                            if (total === 0 && cat.title !== 'TOUS EMPLOYÉS') return null;
                                            const isExpanded = expandedCategories.includes(idx);
                                            const hasItems = cat.items && cat.items.length > 0;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`group bg-white rounded-[2rem] border transition-all duration-300 ${isExpanded ? 'border-[#c69f6e] ring-4 ring-[#c69f6e]/5 shadow-xl' : 'border-[#e6dace]/50 hover:border-[#c69f6e]/30 shadow-sm shadow-[#4a3426]/5'}`}
                                                >
                                                    <div
                                                        onClick={() => {
                                                            if (!hasItems) return;
                                                            setExpandedCategories(prev =>
                                                                prev.includes(idx) ? prev.filter((i: number) => i !== idx) : [...prev, idx]
                                                            );
                                                        }}
                                                        className={`p-6 flex items-center justify-between cursor-pointer select-none ${hasItems ? 'hover:bg-[#fcfaf8]' : 'cursor-default'} rounded-[2rem] transition-colors`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-2xl ${cat.iconBg} flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                                                                <cat.icon size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-[10px] font-black text-[#8c8279] uppercase tracking-widest leading-none mb-1.5">{cat.title}</p>
                                                                    {cat.title === 'TOUS EMPLOYÉS' && (
                                                                        <span className="text-[9px] font-bold text-red-400 uppercase tracking-tight bg-red-50 border border-red-100 px-1.5 py-0.5 rounded ml-2">En attente</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[9px] font-bold text-[#4a3426]/30 uppercase tracking-tighter leading-none">{cat.subtitle}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <p className="text-lg font-black text-[#4a3426] leading-none mb-1">{total.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}</p>
                                                                <p className="text-[8px] font-black text-[#c69f6e] uppercase tracking-widest opacity-60">DT</p>
                                                            </div>
                                                            {hasItems && (
                                                                <div className={`text-[#c69f6e] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                                    <ChevronDown size={18} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <AnimatePresence>
                                                        {isExpanded && hasItems && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden bg-[#fcfaf8]/50 border-t border-[#e6dace]/30"
                                                            >
                                                                <div className="p-4 space-y-2">
                                                                    {(cat.items || []).map((item: any, i: number) => (
                                                                        <div key={i} className="flex justify-between items-center px-5 py-3 bg-white rounded-xl border border-[#e6dace]/10 shadow-sm">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[11px] font-bold text-[#4a3426]/70 uppercase tracking-tight">{item.name}</span>
                                                                                {item.updated_at && (
                                                                                    <span className="text-[9px] font-bold text-green-600/60 flex items-center gap-1 mt-0.5">
                                                                                        <CheckCircle2 size={9} />
                                                                                        {new Date(Number(item.updated_at) || item.updated_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <span className="text-[11px] font-black text-[#4a3426]">{item.amount.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} <span className="text-[9px] opacity-40 ml-0.5">DT</span></span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>


                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >


        </div >
    );
}
