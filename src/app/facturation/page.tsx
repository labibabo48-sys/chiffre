'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
    Loader2, Search, Calendar, Plus,
    CreditCard, Banknote, Coins, Receipt,
    Trash2, UploadCloud, CheckCircle2,
    Clock, Filter, X, Eye, DollarSign, Bookmark, Edit2, Package, LayoutGrid, Hash,
    ZoomIn, ZoomOut, RotateCcw, Download, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Components & Utilities ---

const formatDateToDisplay = (dateStr: string) => {
    if (!dateStr) return 'JJ/MM/AAAA';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

import { createPortal } from 'react-dom';

const PremiumDatePicker = ({ value, onChange, label, colorMode = 'brown', lockedDates = [], allowedDates, align = 'left' }: { value: string, onChange: (val: string) => void, label: string, colorMode?: 'brown' | 'green' | 'red', lockedDates?: string[], allowedDates?: string[], align?: 'left' | 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

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
                                const isLocked = lockedDates.includes(dStr);
                                const isNotAllowed = allowedDates && !allowedDates.includes(dStr);
                                const isDisabled = isLocked || isNotAllowed;

                                const now = new Date();
                                const isToday = now.getFullYear() === day.getFullYear() &&
                                    now.getMonth() === day.getMonth() &&
                                    now.getDate() === day.getDate();

                                return (
                                    <button key={i} type="button"
                                        onClick={() => {
                                            if (isDisabled) return;
                                            onChange(dStr);
                                            setIsOpen(false);
                                        }}
                                        disabled={isDisabled}
                                        className={`h-10 w-10 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center relative
                                            ${isDisabled ? 'text-red-300 opacity-40 cursor-not-allowed' : (isSelected ? `${theme.bg} text-white shadow-lg ${theme.shadow}` : `text-[#4a3426] hover:bg-[#fcfaf8] border border-transparent hover:border-[#e6dace]`)}
                                            ${isToday && !isSelected && !isDisabled ? `${theme.text} bg-opacity-10 ${theme.bg}` : ''}`}
                                    >
                                        {day.getDate()}
                                        {isLocked && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                                        {isNotAllowed && !isLocked && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-gray-400 rounded-full" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="relative">
            <button
                ref={buttonRef}
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
            {typeof document !== 'undefined' && createPortal(CalendarPopup, document.body)}
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
      photos
      doc_type
      doc_number
    }
    getSuppliers {
      id
      name
    }
    getDesignations {
      id
      name
      type
    }
    getLockedDates
  }
`;

const UPSERT_SUPPLIER = gql`
  mutation UpsertSupplier($name: String!) {
    upsertSupplier(name: $name) {
      id
      name
    }
  }
`;

const UPSERT_DESIGNATION = gql`
  mutation UpsertDesignation($name: String!, $type: String) {
    upsertDesignation(name: $name, type: $type) {
      id
      name
      type
    }
  }
`;

const ADD_INVOICE = gql`
  mutation AddInvoice($supplier_name: String!, $amount: String!, $date: String!, $photo_url: String, $photos: String, $doc_type: String, $doc_number: String) {
    addInvoice(supplier_name: $supplier_name, amount: $amount, date: $date, photo_url: $photo_url, photos: $photos, doc_type: $doc_type, doc_number: $doc_number) {
      id
      status
      doc_type
      doc_number
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

const UNPAY_INVOICE = gql`
  mutation UnpayInvoice($id: Int!) {
    unpayInvoice(id: $id) {
      id
      status
    }
  }
`;

const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: Int!, $supplier_name: String, $amount: String, $date: String, $photo_url: String, $photos: String, $doc_type: String, $doc_number: String) {
    updateInvoice(id: $id, supplier_name: $supplier_name, amount: $amount, date: $date, photo_url: $photo_url, photos: $photos, doc_type: $doc_type, doc_number: $doc_number) {
      id
      supplier_name
      amount
      date
      doc_type
      doc_number
    }
  }
`;

// --- Confirm Modal Component ---
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, color = 'brown' }: any) => {
    if (!isOpen) return null;
    const colors: { [key: string]: string } = {
        brown: 'bg-[#4a3426] hover:bg-[#38261b]',
        red: 'bg-red-500 hover:bg-red-600',
        green: 'bg-[#2d6a4f] hover:bg-[#1b4332]'
    };
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 text-left"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl border border-[#e6dace]"
                >
                    <div className={`p-6 ${colors[color]} text-white`}>
                        <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <p className="text-sm font-bold text-[#8c8279] uppercase tracking-wide leading-relaxed">
                            {message}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 h-12 bg-[#f9f6f2] text-[#8c8279] rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#ece6df] transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => { onConfirm(); onClose(); }}
                                className={`flex-1 h-12 ${colors[color]} text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg`}
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

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
    const [showEditModal, setShowEditModal] = useState<any>(null);
    const [showConfirm, setShowConfirm] = useState<{ type: string, title: string, message: string, color: string, onConfirm: () => void } | null>(null);
    const [showChoiceModal, setShowChoiceModal] = useState(false);
    const [viewingData, setViewingData] = useState<any>(null);
    const [imgZoom, setImgZoom] = useState(1);
    const [imgRotation, setImgRotation] = useState(0);

    const resetView = () => {
        setImgZoom(1);
        setImgRotation(0);
    };

    useEffect(() => {
        if (!viewingData) resetView();
    }, [viewingData]);

    const today = new Date();
    const ty = today.getFullYear();
    const tm = String(today.getMonth() + 1).padStart(2, '0');
    const td = String(today.getDate()).padStart(2, '0');
    const todayStr = `${ty}-${tm}-${td}`;

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const y_ty = yesterday.getFullYear();
    const y_tm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const y_td = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${y_ty}-${y_tm}-${y_td}`;

    // Form state
    const [newInvoice, setNewInvoice] = useState<{ supplier_name: string, amount: string, date: string, photos: string[], doc_type: string, doc_number: string }>({
        supplier_name: '',
        amount: '',
        date: todayStr,
        photos: [],
        doc_type: '',
        doc_number: ''
    });
    const [paymentDetails, setPaymentDetails] = useState({
        method: 'Espèces',
        date: todayStr,
        photo_cheque_url: '',
        photo_verso_url: ''
    });

    const [section, setSection] = useState<'Fournisseur' | 'Journalier' | 'Divers'>('Fournisseur');
    const [showAddNameModal, setShowAddNameModal] = useState(false);
    const [newName, setNewName] = useState({ name: '', section: 'Fournisseur' });

    const [execUpsertSupplier] = useMutation(UPSERT_SUPPLIER);
    const [execUpsertDesignation] = useMutation(UPSERT_DESIGNATION);
    const [execAddInvoice] = useMutation(ADD_INVOICE);
    const [execPayInvoice] = useMutation(PAY_INVOICE);
    const [execDeleteInvoice] = useMutation(DELETE_INVOICE);
    const [execUnpayInvoice] = useMutation(UNPAY_INVOICE);
    const [execUpdateInvoice] = useMutation(UPDATE_INVOICE);

    const handleAddName = async () => {
        if (!newName.name) return;
        try {
            if (newName.section === 'Fournisseur') {
                await execUpsertSupplier({ variables: { name: newName.name } });
            } else {
                await execUpsertDesignation({
                    variables: {
                        name: newName.name,
                        type: newName.section === 'Journalier' ? 'journalier' : 'divers'
                    }
                });
            }
            refetch();
            setShowAddNameModal(false);
            setNewName({ name: '', section: 'Fournisseur' });
        } catch (err) {
            console.error("Error adding name:", err);
        }
    };

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

    const lockedDates = data?.getLockedDates || [];

    const handleAddInvoice = async () => {
        if (!newInvoice.supplier_name || !newInvoice.amount || !newInvoice.date) return;
        if (lockedDates.includes(newInvoice.date)) {
            alert("Cette date est verrouillée. Impossible d'ajouter une facture.");
            return;
        }
        setShowConfirm({
            type: 'add',
            title: 'Ajouter Facture',
            message: `Êtes-vous sûr de vouloir ajouter cette facture de ${newInvoice.amount} DT pour ${newInvoice.supplier_name} ?`,
            color: 'brown',
            onConfirm: async () => {
                try {
                    await execAddInvoice({
                        variables: {
                            ...newInvoice,
                            amount: newInvoice.amount.toString(),
                            photo_url: newInvoice.photos[0] || '',
                            photos: JSON.stringify(newInvoice.photos),
                            doc_type: newInvoice.doc_type,
                            doc_number: newInvoice.doc_number || null
                        }
                    });
                    setShowAddModal(false);
                    setNewInvoice({
                        supplier_name: '',
                        amount: '',
                        date: todayStr,
                        photos: [],
                        doc_type: 'Facture',
                        doc_number: ''
                    });
                    refetch();
                } catch (e) {
                    console.error(e);
                }
            }
        });
    };

    const handlePayInvoice = async () => {
        if (!showPayModal) return;
        if (lockedDates.includes(paymentDetails.date)) {
            alert("Cette date est verrouillée. Impossible de valider le paiement.");
            return;
        }
        setShowConfirm({
            type: 'pay',
            title: 'Valider Paiement',
            message: `Êtes-vous sûr de vouloir régler ${showPayModal.amount} DT à ${showPayModal.supplier_name} via ${paymentDetails.method} ?`,
            color: 'green',
            onConfirm: async () => {
                try {
                    await execPayInvoice({
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
            }
        });
    };

    const handleUnpay = async (inv: any) => {
        if (lockedDates.includes(inv.paid_date)) {
            alert("Cette date est verrouillée. Impossible d'annuler le paiement.");
            return;
        }
        setShowConfirm({
            type: 'unpay',
            title: 'Annulation Payement',
            message: `Voulez-vous vraiment annuler le paiement de cette facture pour ${inv.supplier_name} ? Elle redeviendra "Impayée".`,
            color: 'brown',
            onConfirm: async () => {
                try {
                    await execUnpayInvoice({ variables: { id: inv.id } });
                    refetch();
                } catch (e) { console.error(e); }
            }
        });
    };

    const handleUpdateInvoice = async (invoiceData: any) => {
        setShowConfirm({
            type: 'update',
            title: 'Enregistrer Modifications',
            message: 'Êtes-vous sûr de vouloir enregistrer les modifications apportées à cette facture ?',
            color: 'brown',
            onConfirm: async () => {
                try {
                    await execUpdateInvoice({
                        variables: {
                            id: invoiceData.id,
                            supplier_name: invoiceData.supplier_name,
                            amount: invoiceData.amount.toString(),
                            date: invoiceData.date,
                            photo_url: invoiceData.photos[0] || '',
                            photos: JSON.stringify(invoiceData.photos),
                            doc_type: invoiceData.doc_type,
                            doc_number: invoiceData.doc_number || ''
                        }
                    });
                    setShowEditModal(null);
                    refetch();
                } catch (e) { console.error(e); }
            }
        });
    };

    const handleDelete = async (inv: any) => {
        const targetDate = inv.status === 'paid' ? inv.paid_date : inv.date;
        if (lockedDates.includes(targetDate)) {
            alert("Cette date est verrouillée. Impossible de supprimer cette facture.");
            return;
        }

        setShowConfirm({
            type: 'delete',
            title: 'Supprimer Facture',
            message: `Êtes-vous sûr de vouloir supprimer définitivement la facture de ${inv.supplier_name} ? Cette action est irréversible.`,
            color: 'red',
            onConfirm: async () => {
                try {
                    await execDeleteInvoice({ variables: { id: inv.id } });
                    refetch();
                } catch (e) {
                    console.error(e);
                }
            }
        });
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'invoice' | 'recto' | 'verso' = 'invoice') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (field === 'invoice') {
            const filePromises = Array.from(files).map(file => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            });

            const results = await Promise.all(filePromises);
            setNewInvoice(prev => ({
                ...prev,
                photos: [...prev.photos, ...results]
            }));
        } else {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const res = reader.result as string;
                if (field === 'recto') setPaymentDetails({ ...paymentDetails, photo_cheque_url: res });
                else if (field === 'verso') setPaymentDetails({ ...paymentDetails, photo_verso_url: res });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeletePhoto = (index: number) => {
        setNewInvoice(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
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
                            onClick={() => setShowChoiceModal(true)}
                            className="flex-1 md:flex-none h-12 px-6 bg-white text-[#4a3426] border border-[#e6dace] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#fcfaf8] transition-all shadow-sm"
                        >
                            <Bookmark size={18} />
                            <span>Ajouter Section</span>
                        </button>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                                <span>Total Non Payé</span>
                                <span className="bg-white/20 text-white px-2 py-0.5 rounded-full">{stats.countUnpaid}</span>
                            </div>
                            {statusFilter === 'unpaid' && <div className="absolute top-4 right-4 text-white/40"><Filter size={14} /></div>}
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
                                    align="right"
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
                                                    className="bg-red-100 rounded-[2.5rem] border-2 border-red-400/50 overflow-hidden group hover:shadow-2xl hover:shadow-red-500/20 transition-all"
                                                >
                                                    <div className="p-6 pb-0 flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 bg-red-500 text-white">
                                                                <Clock size={12} />
                                                                Non Payé
                                                            </div>
                                                            <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/60 text-red-600 border border-red-200">
                                                                {inv.doc_type || 'Facture'} {inv.doc_number ? `#${inv.doc_number}` : ''}
                                                            </div>
                                                        </div>
                                                        {inv.photo_url && (
                                                            <button
                                                                onClick={() => setViewingData(inv)}
                                                                className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors bg-white/60 px-3 py-1 rounded-lg border border-red-200"
                                                            >
                                                                <Eye size={14} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Voir Photo</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="p-6">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h3 className="font-black text-2xl text-[#4a3426] tracking-tight">{inv.supplier_name}</h3>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-2xl font-black text-red-600">
                                                                    {parseFloat(inv.amount || '0').toFixed(3)}
                                                                    <span className="text-[10px] font-bold text-red-500 uppercase ml-1">DT</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-lg border border-red-400/20 mt-2 justify-end">
                                                                    <Calendar size={12} className="text-red-600" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600/70">Reçu le:</span>
                                                                    <span className="text-[10px] font-black text-red-900">{new Date(inv.date).toLocaleDateString('fr-FR')}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setShowPayModal(inv)}
                                                                className="flex-1 h-11 bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                                            >
                                                                <CheckCircle2 size={18} />
                                                                <span>À Payer</span>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setShowEditModal({
                                                                        id: inv.id,
                                                                        supplier_name: inv.supplier_name,
                                                                        amount: inv.amount,
                                                                        date: inv.date,
                                                                        photos: JSON.parse(inv.photos || '[]'),
                                                                        doc_type: inv.doc_type || 'Facture',
                                                                        doc_number: inv.doc_number || ''
                                                                    });
                                                                }}
                                                                className="w-11 h-11 border-2 border-[#e6dace] text-[#8c8279] hover:text-[#4a3426] hover:border-[#4a3426] rounded-xl flex items-center justify-center transition-all"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(inv)}
                                                                className="w-11 h-11 border-2 border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-xl flex items-center justify-center transition-all"
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
                                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-700">
                                            <CheckCircle2 size={22} />
                                        </div>
                                        <h2 className="text-xl font-black text-[#4a3426] uppercase tracking-tight">Historique des Paiements</h2>
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-black text-sm border border-green-200">
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
                                                    className="bg-green-100 rounded-[2.5rem] border-2 border-green-400/50 overflow-hidden group hover:shadow-2xl hover:shadow-green-500/20 transition-all"
                                                >
                                                    <div className="p-6 pb-0 flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 bg-green-500 text-white">
                                                                <CheckCircle2 size={12} />
                                                                Payé
                                                            </div>
                                                            <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/60 text-green-700 border border-green-200">
                                                                {inv.doc_type || 'Facture'} {inv.doc_number ? `#${inv.doc_number}` : ''}
                                                            </div>
                                                        </div>
                                                        {inv.photo_url && (
                                                            <button
                                                                onClick={() => setViewingData(inv)}
                                                                className="flex items-center gap-2 text-green-700 hover:text-green-800 transition-colors bg-white/60 px-3 py-1 rounded-lg border border-green-200"
                                                            >
                                                                <Eye size={14} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Voir Photo</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="p-6">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h3 className="font-black text-2xl text-[#4a3426] tracking-tight opacity-70">{inv.supplier_name}</h3>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-2xl font-black text-green-700">
                                                                    {parseFloat(inv.amount || '0').toFixed(3)}
                                                                    <span className="text-[10px] font-bold text-green-600/60 uppercase ml-1">DT</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-lg border border-green-400/20 mt-2 justify-end">
                                                                    <Calendar size={12} className="text-green-600" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600/70">Reçu le:</span>
                                                                    <span className="text-[10px] font-black text-green-900">{new Date(inv.date).toLocaleDateString('fr-FR')}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-green-100 border border-green-200 rounded-2xl p-4 mb-4">
                                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em] text-green-700">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                                                                    {inv.payment_method}
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-green-700/20">
                                                                    <span className="text-green-600/50 font-bold uppercase text-[9px]">Réglé le:</span>
                                                                    <span className="text-green-800">{new Date(inv.paid_date).toLocaleDateString('fr-FR')}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleUnpay(inv)}
                                                                className="flex-1 h-11 bg-[#2D6B4E] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1f4b36] transition-all"
                                                            >
                                                                <RotateCcw size={18} />
                                                                <span className="text-xs uppercase">Annuler Payement</span>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setShowEditModal({
                                                                        id: inv.id,
                                                                        supplier_name: inv.supplier_name,
                                                                        amount: inv.amount,
                                                                        date: inv.date,
                                                                        photos: JSON.parse(inv.photos || '[]'),
                                                                        doc_type: inv.doc_type || 'Facture',
                                                                        doc_number: inv.doc_number || ''
                                                                    });
                                                                }}
                                                                className="w-11 h-11 border-2 border-[#e6dace] text-[#8c8279] hover:text-[#4a3426] hover:border-[#4a3426] rounded-xl flex items-center justify-center transition-all"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(inv)}
                                                                className="w-11 h-11 border-2 border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-xl flex items-center justify-center transition-all"
                                                            >
                                                                <Trash2 size={18} />
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
            </div >

            {/* Add Invoice Modal */}
            <AnimatePresence>
                {
                    showAddModal && (
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
                                className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-white/20"
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
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-4 block ml-1">Section</label>
                                        <div className="flex gap-2 mb-6">
                                            {['Fournisseur', 'Journalier', 'Divers'].map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => {
                                                        setSection(s as any);
                                                        setNewInvoice({ ...newInvoice, supplier_name: '' });
                                                    }}
                                                    className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${section === s
                                                        ? 'bg-[#4a3426] text-[#c69f6e] border-[#4a3426] shadow-lg shadow-[#4a3426]/20'
                                                        : 'bg-white text-[#8c8279] border-[#e6dace] hover:border-[#4a3426]/30'
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>

                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">
                                            {section === 'Fournisseur' ? 'Fournisseur' : (section === 'Journalier' ? 'Personnel / Service' : 'Désignation')}
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c69f6e]" size={20} />
                                            <select
                                                value={newInvoice.supplier_name}
                                                onChange={(e) => setNewInvoice({ ...newInvoice, supplier_name: e.target.value })}
                                                className="w-full h-14 pl-12 pr-12 bg-[#f9f6f2] border border-[#e6dace] rounded-2xl font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all appearance-none"
                                            >
                                                <option value="">Sélectionner un élément</option>
                                                {section === 'Fournisseur' ? (
                                                    data?.getSuppliers.map((s: any) => (
                                                        <option key={s.id} value={s.name}>{s.name}</option>
                                                    ))
                                                ) : (
                                                    data?.getDesignations
                                                        .filter((d: any) => d.type === (section === 'Journalier' ? 'journalier' : 'divers'))
                                                        .map((d: any) => (
                                                            <option key={d.id} value={d.name}>{d.name}</option>
                                                        ))
                                                )}
                                            </select>
                                            <button
                                                onClick={() => {
                                                    setNewName({ ...newName, section: section });
                                                    setShowAddNameModal(true);
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#4a3426] text-white rounded-xl hover:bg-[#38261b] transition-all"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-4 block ml-1">Type de Document & Numéro</label>
                                        <div className="flex gap-4">
                                            <div className="flex-1 flex gap-2">
                                                {['Facture', 'BL'].map((t) => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setNewInvoice({ ...newInvoice, doc_type: t })}
                                                        className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${newInvoice.doc_type === t
                                                            ? 'bg-[#d00000] text-white border-[#d00000] shadow-lg shadow-[#d00000]/20'
                                                            : 'bg-white text-[#8c8279] border-[#e6dace] hover:border-[#d00000]/30'
                                                            }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex-[1.5] relative">
                                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c69f6e]" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="N° (Optionnel)"
                                                    value={newInvoice.doc_number}
                                                    onChange={(e) => setNewInvoice({ ...newInvoice, doc_number: e.target.value })}
                                                    className="w-full h-12 pl-11 pr-4 bg-[#f9f6f2] border border-[#e6dace] rounded-xl font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all text-xs"
                                                />
                                            </div>
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
                                                lockedDates={lockedDates}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Photo / Reçu</label>
                                        <div className="grid grid-cols-3 gap-3 mb-3">
                                            {newInvoice.photos.map((p, idx) => (
                                                <div key={idx} className="relative aspect-square bg-[#f9f6f2] rounded-xl overflow-hidden group border border-[#e6dace]">
                                                    <img src={p} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(idx); }}
                                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <div
                                                onClick={() => document.getElementById('photo-upload')?.click()}
                                                className="aspect-square bg-[#fcfaf8] border-2 border-dashed border-[#e6dace] rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#c69f6e] hover:bg-[#fff9f2] transition-all"
                                            >
                                                <UploadCloud className="text-[#c69f6e] opacity-40" size={24} />
                                                <span className="text-[8px] font-black text-[#8c8279] uppercase tracking-widest text-center px-1">Ajouter</span>
                                                <input id="photo-upload" type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddInvoice}
                                        disabled={!newInvoice.supplier_name || !newInvoice.amount || !newInvoice.doc_type}
                                        className="w-full h-16 bg-[#4a3426] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-[#38261b] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-[#4a3426]/20"
                                    >
                                        Confirmer l'ajout
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Pay Modal */}
            <AnimatePresence>
                {
                    showPayModal && (
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
                                            lockedDates={lockedDates}
                                            allowedDates={user?.role === 'caissier' ? [todayStr, yesterdayStr] : undefined}
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
                    )
                }
            </AnimatePresence >

            {/* Image Viewer Overlay */}
            <AnimatePresence>
                {
                    viewingData && (
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
                                        <p className="text-sm font-bold opacity-60 uppercase tracking-[0.3em]">{viewingData.amount} DT • {viewingData.status === 'paid' ? viewingData.payment_method : 'Non Payé'}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex bg-white/10 rounded-2xl p-1 gap-1 border border-white/10">
                                            <button onClick={() => setImgZoom(prev => Math.max(0.5, prev - 0.25))} className="w-10 h-10 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all" title="Zoom Arrière"><ZoomOut size={20} /></button>
                                            <div className="w-16 flex items-center justify-center font-black text-xs tabular-nums text-[#c69f6e]">{Math.round(imgZoom * 100)}%</div>
                                            <button onClick={() => setImgZoom(prev => Math.min(4, prev + 0.25))} className="w-10 h-10 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all" title="Zoom Avant"><ZoomIn size={20} /></button>
                                            <div className="w-px h-6 bg-white/10 self-center mx-1"></div>
                                            <button onClick={() => setImgRotation(prev => prev + 90)} className="w-10 h-10 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all" title="Tourner"><RotateCcw size={20} /></button>
                                            <button onClick={resetView} className="w-10 h-10 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all" title="Réinitialiser"><Maximize2 size={20} /></button>
                                        </div>
                                        <button onClick={() => setViewingData(null)} className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"><X size={32} /></button>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 ${viewingData.payment_method === 'Chèque' ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-8`}>
                                    {/* Photo Facture */}
                                    <div className="space-y-8">
                                        {(() => {
                                            let invoicePhotos: string[] = [];
                                            try {
                                                const parsed = JSON.parse(viewingData.photos || '[]');
                                                invoicePhotos = Array.isArray(parsed) ? parsed : [];
                                            } catch (e) {
                                                invoicePhotos = [];
                                            }

                                            // Include legacy photo_url if exists
                                            if (viewingData.photo_url && !invoicePhotos.includes(viewingData.photo_url)) {
                                                invoicePhotos = [viewingData.photo_url, ...invoicePhotos];
                                            }

                                            if (invoicePhotos.length === 0) {
                                                return (
                                                    <div className="h-[70vh] bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 italic font-bold uppercase tracking-widest">Sans Facture</div>
                                                );
                                            }

                                            return invoicePhotos.map((photo, pIdx) => (
                                                <div key={pIdx} className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] italic">Document {pIdx + 1} / Facture</p>
                                                        <a href={photo} download target="_blank" className="flex items-center gap-2 text-[9px] font-black text-[#c69f6e] uppercase tracking-widest hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                            <Download size={12} /> Télécharger
                                                        </a>
                                                    </div>
                                                    <div
                                                        className="bg-black rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden group h-[70vh] relative"
                                                        onWheel={(e) => {
                                                            if (e.deltaY < 0) setImgZoom(prev => Math.min(4, prev + 0.1));
                                                            else setImgZoom(prev => Math.max(0.5, prev - 0.1));
                                                        }}
                                                    >
                                                        <motion.div
                                                            className={`w-full h-full flex items-center justify-center p-4 ${imgZoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
                                                            animate={{ scale: imgZoom, rotate: imgRotation }}
                                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                            drag={imgZoom > 1}
                                                            dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                                                            dragElastic={0.1}
                                                        >
                                                            <img
                                                                src={photo}
                                                                draggable="false"
                                                                className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
                                                                alt={`Facture ${pIdx + 1}`}
                                                                style={{ pointerEvents: 'none', userSelect: 'none' }}
                                                            />
                                                        </motion.div>
                                                        <div className="absolute top-6 left-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="bg-black/60 backdrop-blur-md text-[10px] font-black text-[#c69f6e] px-4 py-2 rounded-full border border-[#c69f6e]/20 shadow-lg uppercase tracking-widest">Loupe: {Math.round(imgZoom * 100)}% • Molette pour zoomer</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>

                                    {/* Photos Chèque */}
                                    {viewingData.payment_method === 'Chèque' && (
                                        <>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] italic">Chèque Recto</p>
                                                    {viewingData.photo_cheque_url && (
                                                        <a href={viewingData.photo_cheque_url} download target="_blank" className="flex items-center gap-2 text-[9px] font-black text-[#c69f6e] uppercase tracking-widest hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                            <Download size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                                {viewingData.photo_cheque_url ? (
                                                    <div
                                                        className="bg-black rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden h-[70vh] relative"
                                                        onWheel={(e) => {
                                                            if (e.deltaY < 0) setImgZoom(prev => Math.min(4, prev + 0.1));
                                                            else setImgZoom(prev => Math.max(0.5, prev - 0.1));
                                                        }}
                                                    >
                                                        <motion.div
                                                            className={`w-full h-full flex items-center justify-center p-4 ${imgZoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
                                                            animate={{ scale: imgZoom, rotate: imgRotation }}
                                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                            drag={imgZoom > 1}
                                                            dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                                                            dragElastic={0.1}
                                                        >
                                                            <img
                                                                src={viewingData.photo_cheque_url}
                                                                draggable="false"
                                                                className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
                                                                alt="Chèque Recto"
                                                                style={{ pointerEvents: 'none', userSelect: 'none' }}
                                                            />
                                                        </motion.div>
                                                    </div>
                                                ) : (
                                                    <div className="h-[70vh] bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 italic font-bold">Sans Recto</div>
                                                )}
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] italic">Chèque Verso</p>
                                                    {viewingData.photo_verso_url && (
                                                        <a href={viewingData.photo_verso_url} download target="_blank" className="flex items-center gap-2 text-[9px] font-black text-[#c69f6e] uppercase tracking-widest hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                            <Download size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                                {viewingData.photo_verso_url ? (
                                                    <div
                                                        className="bg-black rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden h-[70vh] relative"
                                                        onWheel={(e) => {
                                                            if (e.deltaY < 0) setImgZoom(prev => Math.min(4, prev + 0.1));
                                                            else setImgZoom(prev => Math.max(0.5, prev - 0.1));
                                                        }}
                                                    >
                                                        <motion.div
                                                            className={`w-full h-full flex items-center justify-center p-4 ${imgZoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
                                                            animate={{ scale: imgZoom, rotate: imgRotation }}
                                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                            drag={imgZoom > 1}
                                                            dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                                                            dragElastic={0.1}
                                                        >
                                                            <img
                                                                src={viewingData.photo_verso_url}
                                                                draggable="false"
                                                                className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
                                                                alt="Chèque Verso"
                                                                style={{ pointerEvents: 'none', userSelect: 'none' }}
                                                            />
                                                        </motion.div>
                                                    </div>
                                                ) : (
                                                    <div className="h-[70vh] bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 italic font-bold">Sans Verso</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Edit Invoice Modal */}
            <AnimatePresence>
                {
                    showEditModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[150] bg-[#4a3426]/60 backdrop-blur-md flex items-center justify-center p-4"
                            onClick={() => setShowEditModal(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-white/20"
                            >
                                <div className="p-8 bg-[#4a3426] text-white relative rounded-t-[2.5rem]">
                                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                        <Edit2 size={28} className="text-[#c69f6e]" />
                                        Modifier Facture
                                    </h2>
                                    <p className="text-xs text-white/60 font-medium mt-1">Mettre à jour les informations de la facture</p>
                                    <button onClick={() => setShowEditModal(null)} className="absolute top-8 right-8 text-white/40 hover:text-white"><X size={24} /></button>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Fournisseur / Elément</label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c69f6e]" size={20} />
                                            <select
                                                value={showEditModal.supplier_name}
                                                onChange={(e) => setShowEditModal({ ...showEditModal, supplier_name: e.target.value })}
                                                className="w-full h-14 pl-12 pr-12 bg-[#f9f6f2] border border-[#e6dace] rounded-2xl font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all appearance-none"
                                            >
                                                <option value="">Sélectionner</option>
                                                {data?.getSuppliers.map((s: any) => (<option key={s.id} value={s.name}>{s.name}</option>))}
                                                {data?.getDesignations.map((d: any) => (<option key={d.id} value={d.name}>{d.name}</option>))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-3 block ml-1">Type de Document & Numéro</label>
                                        <div className="flex gap-4">
                                            <div className="flex-1 flex gap-2">
                                                {['Facture', 'BL'].map((t) => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setShowEditModal({ ...showEditModal, doc_type: t })}
                                                        className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${showEditModal.doc_type === t
                                                            ? 'bg-[#d00000] text-white border-[#d00000] shadow-lg shadow-[#d00000]/20'
                                                            : 'bg-white text-[#8c8279] border-[#e6dace] hover:border-[#d00000]/30'
                                                            }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex-[1.5] relative">
                                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c69f6e]" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="N° (Optionnel)"
                                                    value={showEditModal.doc_number}
                                                    onChange={(e) => setShowEditModal({ ...showEditModal, doc_number: e.target.value })}
                                                    className="w-full h-12 pl-11 pr-4 bg-[#f9f6f2] border border-[#e6dace] rounded-xl font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all text-xs"
                                                />
                                            </div>
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
                                                    value={showEditModal.amount}
                                                    onChange={(e) => setShowEditModal({ ...showEditModal, amount: e.target.value })}
                                                    className="w-full h-14 pl-12 pr-4 bg-[#f9f6f2] border border-[#e6dace] rounded-2xl font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Date Facture</label>
                                            <PremiumDatePicker
                                                label="Date"
                                                value={showEditModal.date}
                                                onChange={(val) => setShowEditModal({ ...showEditModal, date: val })}
                                                lockedDates={lockedDates}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Photos Facture ({showEditModal.photos.length}/5)</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {showEditModal.photos.map((p: string, i: number) => (
                                                <div key={i} className="aspect-square bg-[#fcfaf8] border border-[#e6dace] rounded-xl relative group overflow-hidden">
                                                    <img src={p} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => setShowEditModal({ ...showEditModal, photos: showEditModal.photos.filter((_: any, idx: number) => idx !== i) })}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {showEditModal.photos.length < 5 && (
                                                <button
                                                    onClick={() => document.getElementById('edit-upload')?.click()}
                                                    className="aspect-square bg-[#fcfaf8] border-2 border-dashed border-[#e6dace] rounded-xl flex items-center justify-center text-[#c69f6e] hover:border-[#c69f6e] hover:bg-[#fcfaf8] transition-all"
                                                >
                                                    <Plus size={24} />
                                                    <input
                                                        id="edit-upload"
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const files = e.target.files;
                                                            if (files && files.length > 0) {
                                                                const filePromises = Array.from(files).map(file => {
                                                                    return new Promise<string>((resolve) => {
                                                                        const reader = new FileReader();
                                                                        reader.onloadend = () => resolve(reader.result as string);
                                                                        reader.readAsDataURL(file);
                                                                    });
                                                                });
                                                                const results = await Promise.all(filePromises);
                                                                setShowEditModal({ ...showEditModal, photos: [...showEditModal.photos, ...results].slice(0, 5) });
                                                            }
                                                        }}
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleUpdateInvoice(showEditModal)}
                                        className="w-full h-16 bg-[#4a3426] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-[#38261b] transition-all shadow-xl shadow-[#4a3426]/20"
                                    >
                                        Enregistrer les modifications
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Confirmation Modal */}
            < ConfirmModal
                isOpen={!!showConfirm
                }
                onClose={() => setShowConfirm(null)}
                onConfirm={showConfirm?.onConfirm}
                title={showConfirm?.title}
                message={showConfirm?.message}
                color={showConfirm?.color}
            />



            {/* Choice Modal for Adding Section */}
            <AnimatePresence>
                {
                    showChoiceModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => setShowChoiceModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-[#e6dace]"
                            >
                                <div className="p-8 bg-[#4a3426] text-white relative">
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Ajouter Section</h3>
                                    <p className="text-xs opacity-60 font-bold uppercase tracking-widest mt-1">Choisissez le type d'élément à ajouter</p>
                                    <button onClick={() => setShowChoiceModal(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-8 grid grid-cols-1 gap-4">
                                    {[
                                        { id: 'Fournisseur', label: 'Ajouter Fournisseur', desc: 'Pour les factures de marchandises', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
                                        { id: 'Journalier', label: 'Ajouter Journalier', desc: 'Pour les dépenses quotidiennes', icon: Clock, color: 'text-green-500', bg: 'bg-green-50' },
                                        { id: 'Divers', label: 'Ajouter Divers', desc: 'Pour les charges exceptionnelles', icon: LayoutGrid, color: 'text-purple-500', bg: 'bg-purple-50' }
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setNewName({ name: '', section: item.id as any });
                                                setShowChoiceModal(false);
                                                setShowAddNameModal(true);
                                            }}
                                            className="flex items-center gap-6 p-6 rounded-3xl border-2 border-transparent hover:border-[#4a3426] hover:bg-[#fcfaf8] transition-all group text-left"
                                        >
                                            <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                                <item.icon size={32} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-black text-[#4a3426] uppercase tracking-tight">{item.label}</h4>
                                                <p className="text-sm text-[#8c8279] font-medium">{item.desc}</p>
                                            </div>
                                            <Plus size={24} className="text-[#e6dace] group-hover:text-[#4a3426] transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Add Name Modal */}
            <AnimatePresence>
                {
                    showAddNameModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[210] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => setShowAddNameModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl border border-[#e6dace]"
                            >
                                <div className="p-6 bg-[#4a3426] text-white">
                                    <h3 className="text-lg font-black uppercase tracking-tight">Ajouter {newName.section}</h3>
                                    <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest mt-1">Section: {newName.section}</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] mb-2 block ml-1">Nom / Désignation</label>
                                        <input
                                            type="text"
                                            placeholder={`Nom du ${newName.section.toLowerCase()}...`}
                                            value={newName.name}
                                            onChange={(e) => setNewName({ ...newName, name: e.target.value })}
                                            className="w-full h-12 px-4 bg-[#f9f6f2] border border-[#e6dace] rounded-xl font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => {
                                                setShowAddNameModal(false);
                                                setShowChoiceModal(true);
                                            }}
                                            className="flex-1 h-12 bg-[#f9f6f2] text-[#8c8279] rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#ece6df] transition-all"
                                        >
                                            Retour
                                        </button>
                                        <button
                                            onClick={handleAddName}
                                            disabled={!newName.name}
                                            className="flex-1 h-12 bg-[#4a3426] text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#38261b] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
                                        >
                                            Valider
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}
