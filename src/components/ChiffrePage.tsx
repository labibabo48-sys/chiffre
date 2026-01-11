'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
    Plus, Trash2, UploadCloud, Save, Search, LogOut, Loader2, Calendar,
    Wallet, TrendingDown, TrendingUp, CreditCard, Banknote, Coins, Calculator, Receipt,
    ChevronLeft, ChevronRight, LayoutDashboard, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
    Zap, Sparkles, ChevronDown, User, MessageSquare, FileText, Check
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';

const GET_CHIFFRE = gql`
  query GetChiffre($date: String!) {
    getChiffreByDate(date: $date) {
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

const GET_SUPPLIERS = gql`
    query GetSuppliers {
        getSuppliers {
            id
            name
        }
    }
`;

const GET_DESIGNATIONS = gql`
    query GetDesignations {
        getDesignations {
            id
            name
        }
    }
`;

const UPSERT_DESIGNATION = gql`
    mutation UpsertDesignation($name: String!) {
        upsertDesignation(name: $name) {
            id
            name
        }
    }
`;

const SAVE_CHIFFRE = gql`
  mutation SaveChiffre(
    $date: String!
    $recette_de_caisse: String!
    $total_diponce: String!
    $diponce: String!
    $recette_net: String!
    $tpe: String! 
    $cheque_bancaire: String!
    $espaces: String!
    $tickets_restaurant: String!
    $extra: String!
    $primes: String!
    $diponce_divers: String!
    $diponce_journalier: String!
    $diponce_admin: String!
) {
    saveChiffre(
        date: $date
      recette_de_caisse: $recette_de_caisse
      total_diponce: $total_diponce
      diponce: $diponce
      recette_net: $recette_net
      tpe: $tpe
      cheque_bancaire: $cheque_bancaire
      espaces: $espaces
      tickets_restaurant: $tickets_restaurant
      extra: $extra
      primes: $primes
      diponce_divers: $diponce_divers
      diponce_journalier: $diponce_journalier
      diponce_admin: $diponce_admin
    ) {
        id
    }
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

interface ChiffrePageProps {
    role: 'admin' | 'caissier';
    onLogout: () => void;
}

export default function ChiffrePage({ role, onLogout }: ChiffrePageProps) {
    // Global State
    const [date, setDate] = useState<string>('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const today = new Date();
        setDate(today.toISOString().split('T')[0]);
    }, []);

    // GraphQL
    const { data: chiffreData, refetch: refetchChiffre } = useQuery(GET_CHIFFRE, {
        variables: { date },
        skip: !date
    });
    const { data: suppliersData, refetch: refetchSuppliers } = useQuery(GET_SUPPLIERS);
    const { data: designationsData, refetch: refetchDesignations } = useQuery(GET_DESIGNATIONS);
    const [saveChiffre, { loading: saving }] = useMutation(SAVE_CHIFFRE);
    const [upsertSupplier] = useMutation(UPSERT_SUPPLIER);
    const [upsertDesignation] = useMutation(UPSERT_DESIGNATION);

    // Dashboard States
    const [recetteCaisse, setRecetteCaisse] = useState('0');
    const [expenses, setExpenses] = useState<{
        supplier: string,
        amount: string,
        details: string,
        invoices: string[],
        photo_cheque?: string,
        photo_verso?: string,
        paymentMethod: string,
        isFromFacturation?: boolean,
        invoiceId?: number
    }[]>([
        { supplier: '', amount: '0', details: '', invoices: [], photo_cheque: '', photo_verso: '', paymentMethod: 'Espèces' }
    ]);
    const [expensesDivers, setExpensesDivers] = useState<{
        designation: string,
        amount: string,
        details: string,
        invoices: string[],
        paymentMethod: string
    }[]>([
        { designation: '', amount: '0', details: '', invoices: [], paymentMethod: 'Espèces' }
    ]);
    const [expensesJournalier, setExpensesJournalier] = useState<{
        designation: string,
        amount: string,
        details: string,
        invoices: string[],
        paymentMethod: string
    }[]>([
        { designation: '', amount: '0', details: '', invoices: [], paymentMethod: 'Espèces' }
    ]);
    const [expensesAdmin, setExpensesAdmin] = useState<{
        designation: string,
        amount: string,
        paymentMethod: string
    }[]>([
        { designation: 'Riadh', amount: '0', paymentMethod: 'Espèces' },
        { designation: 'Malika', amount: '0', paymentMethod: 'Espèces' },
        { designation: 'Salaires', amount: '0', paymentMethod: 'Espèces' }
    ]);
    const [tpe, setTpe] = useState('0');
    const [cheque, setCheque] = useState('0');
    const [especes, setEspeces] = useState('0');
    const [ticketsRestaurant, setTicketsRestaurant] = useState('0');
    const [extra, setExtra] = useState('0');
    const [primes, setPrimes] = useState('0');

    // Bey Details
    const [avancesList, setAvancesList] = useState<{ username: string, montant: string }[]>([]);
    const [doublagesList, setDoublagesList] = useState<{ username: string, montant: string }[]>([]);
    const [extrasList, setExtrasList] = useState<{ username: string, montant: string }[]>([]);
    const [primesList, setPrimesList] = useState<{ username: string, montant: string }[]>([]);

    // UI States
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [designationSearch, setDesignationSearch] = useState('');
    const [showSupplierDropdown, setShowSupplierDropdown] = useState<number | null>(null);
    const [showJournalierDropdown, setShowJournalierDropdown] = useState<number | null>(null);
    const [showDiversDropdown, setShowDiversDropdown] = useState<number | null>(null);
    const [viewingInvoices, setViewingInvoices] = useState<string[] | null>(null);
    const [viewingInvoicesTarget, setViewingInvoicesTarget] = useState<{ index: number, type: 'expense' | 'divers' | 'journalier' } | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showJournalierModal, setShowJournalierModal] = useState(false);
    const [showDiversModal, setShowDiversModal] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [hasInteracted, setHasInteracted] = useState(false);

    // Modal Details States
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [modalDetailsTarget, setModalDetailsTarget] = useState<{ index: number, type: 'expense' | 'divers' | 'journalier' } | null>(null);
    const [tempDetails, setTempDetails] = useState('');
    const [lastFocusedValue, setLastFocusedValue] = useState('');

    const commonDesignations = designationsData?.getDesignations?.map((d: any) => d.name) || ["Fruits", "khodhra", "Entretien", "Outils", "Transport", "Petit déjeuner", "Divers"];

    // Helper to get raw state data
    const getCurrentState = () => ({
        recetteCaisse,
        expenses,
        tpe,
        cheque,
        especes,
        ticketsRestaurant,
        extra,
        primes,
        avancesList,
        doublagesList,
        extrasList,
        primesList,
        expensesDivers,
        expensesJournalier,
        expensesAdmin
    });



    // Load Data
    useEffect(() => {
        if (chiffreData?.getChiffreByDate) {
            const c = chiffreData.getChiffreByDate;


            setRecetteCaisse(c.recette_de_caisse);
            setExpenses(JSON.parse(c.diponce || '[]').map((e: any) => ({ ...e, details: e.details || '' })));
            setTpe(c.tpe);
            setCheque(c.cheque_bancaire);
            setEspeces(c.espaces);
            setTicketsRestaurant(c.tickets_restaurant || '0');
            setExtra(c.extra || '0');
            setPrimes(c.primes || '0');
            setAvancesList(c.avances_details || []);
            setDoublagesList(c.doublages_details || []);
            setExtrasList(c.extras_details || []);
            setPrimesList(c.primes_details || []);
            setExpensesDivers(JSON.parse(c.diponce_divers || '[]').map((d: any) => ({ ...d, details: d.details || '' })));
            setExpensesJournalier(JSON.parse(c.diponce_journalier || '[]').map((j: any) => ({ ...j, details: j.details || '' })));
            let adminData = JSON.parse(c.diponce_admin || '[]');
            if (adminData.length === 0) {
                adminData = [
                    { designation: 'Riadh', amount: '0', paymentMethod: 'Espèces' },
                    { designation: 'Malika', amount: '0', paymentMethod: 'Espèces' },
                    { designation: 'Salaires', amount: '0', paymentMethod: 'Espèces' }
                ];
            }
            setExpensesAdmin(adminData);
            setHasInteracted(false); // Reset interaction flag after loading from server
        } else {
            // Check for draft even if no server data
            const savedDraft = localStorage.getItem(`chiffre_draft_${date}`);
            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
                    if (draft.date === date) {
                        const d = draft.data;
                        setRecetteCaisse(d.recetteCaisse);
                        setTpe(d.tpe);
                        setCheque(d.cheque);
                        setEspeces(d.especes);
                        setTicketsRestaurant(d.ticketsRestaurant);
                        setExtra(d.extra);
                        setPrimes(d.primes);
                        setAvancesList(d.avancesList);
                        setDoublagesList(d.doublagesList);
                        setExtrasList(d.extrasList);
                        setPrimesList(d.primesList);
                        setExpenses(d.expenses.map((e: any) => ({ ...e, details: e.details || '' })));
                        setExpensesDivers((d.expensesDivers || []).map((dv: any) => ({ ...dv, details: dv.details || '' })));
                        if (!d.expensesDivers) setExpensesDivers([{ designation: '', amount: '0', details: '', invoices: [], paymentMethod: 'Espèces' }]);
                        setHasInteracted(true); // Treat as interacted since we are resuming a custom session
                        setToast({ msg: 'Reprise de votre saisie en cours', type: 'success' });
                        setTimeout(() => setToast(null), 3000);
                        return;
                    }
                } catch (e) { }
            }

            // Reset if no data found for date and no draft
            setRecetteCaisse('0');
            setExpenses([{ supplier: '', amount: '0', details: '', invoices: [], photo_cheque: '', photo_verso: '', paymentMethod: 'Espèces' }]);
            setTpe('0');
            setCheque('0');
            setEspeces('0');
            setTicketsRestaurant('0');
            setExtra('0');
            setPrimes('0');
            setAvancesList([]);
            setDoublagesList([]);
            setExtrasList([]);
            setPrimesList([]);
            setExpensesDivers([{ designation: '', amount: '0', details: '', invoices: [], paymentMethod: 'Espèces' }]);
            setHasInteracted(false);
        }
    }, [chiffreData, date]);

    // Calculations
    const acompte = avancesList.reduce((acc, curr) => acc + (parseFloat(curr.montant) || 0), 0);
    const doublage = doublagesList.reduce((acc, curr) => acc + (parseFloat(curr.montant) || 0), 0);
    const extraTotal = extrasList.reduce((acc, curr) => acc + (parseFloat(curr.montant) || 0), 0);
    const primesTotal = primesList.reduce((acc, curr) => acc + (parseFloat(curr.montant) || 0), 0);

    const totalExpensesDynamic = expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const totalExpensesDivers = expensesDivers.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const totalExpensesJournalier = expensesJournalier.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const totalExpensesAdmin = expensesAdmin.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const totalExpenses = totalExpensesDynamic + totalExpensesDivers + totalExpensesJournalier + totalExpensesAdmin + acompte + doublage + extraTotal + primesTotal;
    const recetteNett = (parseFloat(recetteCaisse) || 0) - totalExpenses;

    // Auto-balance logic
    useEffect(() => {
        const net = (parseFloat(recetteCaisse) || 0) - totalExpenses;
        const t = parseFloat(tpe) || 0;
        const c = parseFloat(cheque) || 0;
        const tr = parseFloat(ticketsRestaurant) || 0;
        const remainder = net - t - c - tr;
        let espVal = remainder.toFixed(3);
        if (espVal.endsWith('.000')) espVal = espVal.replace('.000', '');
        setEspeces(espVal);
    }, [recetteCaisse, totalExpenses, tpe, cheque, ticketsRestaurant]);

    // Handlers
    const handleDetailChange = (index: number, field: string, value: any) => {
        setHasInteracted(true);
        const newExpenses = [...expenses];
        (newExpenses[index] as any)[field] = value;
        setExpenses(newExpenses);
    };

    const handleDiversChange = (index: number, field: string, value: any) => {
        setHasInteracted(true);
        const newDivers = [...expensesDivers];
        (newDivers[index] as any)[field] = value;
        setExpensesDivers(newDivers);
    };

    const handleJournalierChange = (index: number, field: string, value: any) => {
        setHasInteracted(true);
        const newJournalier = [...expensesJournalier];
        (newJournalier[index] as any)[field] = value;
        setExpensesJournalier(newJournalier);
    };

    const handleAdminChange = (index: number, field: string, value: any) => {
        setHasInteracted(true);
        const newAdmin = [...expensesAdmin];
        (newAdmin[index] as any)[field] = value;
        setExpensesAdmin(newAdmin);
    };

    const handleAddExpense = () => { setHasInteracted(true); setExpenses([...expenses, { supplier: '', amount: '0', details: '', invoices: [], photo_cheque: '', photo_verso: '', paymentMethod: 'Espèces' }]); };
    const handleAddDivers = (designation?: string) => { setHasInteracted(true); setExpensesDivers([...expensesDivers, { designation: designation || '', amount: '0', details: '', invoices: [], paymentMethod: 'Espèces' }]); };
    const handleAddJournalier = (designation?: string) => { setHasInteracted(true); setExpensesJournalier([...expensesJournalier, { designation: designation || '', amount: '0', details: '', invoices: [], paymentMethod: 'Espèces' }]); };

    const handleRemoveExpense = (index: number) => { setHasInteracted(true); setExpenses(expenses.filter((_, i) => i !== index)); };
    const handleRemoveDivers = (index: number) => { setHasInteracted(true); setExpensesDivers(expensesDivers.filter((_, i) => i !== index)); };
    const handleRemoveJournalier = (index: number) => { setHasInteracted(true); setExpensesJournalier(expensesJournalier.filter((_, i) => i !== index)); };

    const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>, type: 'invoice' | 'recto' | 'verso' = 'invoice', isDivers: boolean = false) => {
        setHasInteracted(true);
        const files = e.target.files;
        if (!files) return;

        if (type === 'invoice') {
            const loaders = Array.from(files).map(file => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            });
            const base64s = await Promise.all(loaders);
            if (type === 'invoice') {
                if (isDivers === true) {
                    const newDivers = [...expensesDivers];
                    newDivers[index].invoices = [...newDivers[index].invoices, ...base64s];
                    setExpensesDivers(newDivers);
                } else if ((isDivers as any) === 'journalier') {
                    const newJournalier = [...expensesJournalier];
                    newJournalier[index].invoices = [...newJournalier[index].invoices, ...base64s];
                    setExpensesJournalier(newJournalier);
                } else {
                    const newExpenses = [...expenses];
                    newExpenses[index].invoices = [...newExpenses[index].invoices, ...base64s];
                    setExpenses(newExpenses);
                }
            }
        } else {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const newExpenses = [...expenses];
                if (type === 'recto') newExpenses[index].photo_cheque = reader.result as string;
                if (type === 'verso') newExpenses[index].photo_verso = reader.result as string;
                setExpenses(newExpenses);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddNewSupplier = async (name: string) => {
        if (!name.trim()) return;
        try {
            await upsertSupplier({ variables: { name: name.trim() } });
            setToast({ msg: `Fournisseur "${name}" ajouté`, type: 'success' });
            setNewSupplierName('');
            setShowSupplierModal(false);
            setTimeout(() => setToast(null), 3000);
            refetchSuppliers(); // Only refetch suppliers, not the whole data
        } catch (e) {
            setToast({ msg: "Erreur lors de l'ajout", type: 'error' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleSave = async () => {
        try {
            await saveChiffre({
                variables: {
                    date,
                    recette_de_caisse: recetteCaisse,
                    total_diponce: totalExpenses.toString(),
                    diponce: JSON.stringify(expenses),
                    recette_net: recetteNett.toString(),
                    tpe,
                    cheque_bancaire: cheque,
                    espaces: especes,
                    tickets_restaurant: ticketsRestaurant,
                    extra,
                    primes,
                    diponce_divers: JSON.stringify(expensesDivers),
                    diponce_journalier: JSON.stringify(expensesJournalier),
                    diponce_admin: JSON.stringify(expensesAdmin),
                }
            });
            setToast({ msg: 'Session enregistrée avec succès', type: 'success' });
            setTimeout(() => setToast(null), 3000);
            refetchChiffre();
        } catch (e) {
            console.error(e);
            setToast({ msg: "Erreur lors de l'enregistrement", type: 'error' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    // Suppliers for dropdown
    const suppliers = suppliersData?.getSuppliers || [];
    const filteredSuppliers = suppliers.filter((s: any) => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));

    // Date Navigation
    const changeMonth = (delta: number) => {
        const curr = new Date(date);
        curr.setMonth(curr.getMonth() + delta);
        setDate(curr.toISOString().split('T')[0]);
    };

    const shiftDate = (days: number) => {
        const current = new Date(date);
        current.setDate(current.getDate() + days);
        const newDateStr = current.toISOString().split('T')[0];
        if (role !== 'admin') {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const target = new Date(newDateStr);
            const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const yesterdayZero = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            const targetZero = new Date(target.getFullYear(), target.getMonth(), target.getDate());
            if (targetZero < yesterdayZero || targetZero > todayZero) return;
        }
        setDate(newDateStr);
    };

    const generateCalendarDays = (currentDateStr: string) => {
        const curr = new Date(currentDateStr);
        const startDay = new Date(curr.getFullYear(), curr.getMonth(), 1).getDay();
        const daysInMonth = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    if (!isClient) return null;

    // --- SUB-COMPONENTS ---



    return (
        <div className="min-h-screen bg-[#f8f5f2] text-[#2d241e] font-sans flex">
            {/* Styles */}
            <style jsx global>{`
                .luxury-shadow { box-shadow: 0 20px 40px -10px rgba(60, 45, 30, 0.08); }
                .gold-gradient { background: linear-gradient(135deg, #c69f6e 0%, #a67c52 100%); }
            `}</style>

            {/* Sidebar */}
            <Sidebar role={role} />

            {/* Main Content */}
            <div className="flex-1 min-w-0 pb-32">

                {/* Header */}
                <header className={`sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e6dace] py-4 px-4 md:px-12 flex justify-between items-center transition-all duration-300`}>

                    <h2 className="text-lg md:text-xl font-black text-[#4a3426] block sm:hidden lg:block uppercase tracking-widest">
                        Journalier
                    </h2>
                    <h2 className="text-xl font-black text-[#4a3426] hidden sm:block lg:hidden uppercase tracking-widest">
                        Journalier
                    </h2>

                    <div className="flex items-center gap-4 ml-auto">
                        {date && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => shiftDate(-1)}
                                    className={`p-2 rounded-full hover:bg-[#ebdccf] text-[#8c8279] hover:text-[#4a3426] transition-all ${role !== 'admin' && new Date(date) <= new Date(Date.now() - 86400000 * 2) ? 'opacity-0 pointer-events-none w-0 p-0 overflow-hidden' : ''}`}
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div
                                    className={`relative group ${role === 'admin' ? 'cursor-pointer' : ''}`}
                                    onClick={() => role === 'admin' && setShowCalendar(true)}
                                >
                                    <div className={`flex items-center gap-3 bg-[#f4ece4] px-5 py-2.5 rounded-2xl transition-all border border-transparent ${role === 'admin' ? 'group-hover:bg-[#e6dace] group-hover:border-[#c69f6e]/30' : ''}`}>
                                        <Calendar size={18} className="text-[#c69f6e]" />
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="text-[10px] font-bold text-[#8c8279] uppercase tracking-wider hidden xs:block">Date Sélectionnée</span>
                                            <span className="text-xs sm:text-sm font-bold text-[#4a3426] capitalize mt-0.5">
                                                {new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => shiftDate(1)}
                                    className={`p-2 rounded-full hover:bg-[#ebdccf] text-[#8c8279] hover:text-[#4a3426] transition-all ${role !== 'admin' && new Date(date) >= new Date(new Date().toISOString().split('T')[0]) ? 'opacity-0 pointer-events-none w-0 p-0 overflow-hidden' : ''}`}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                        <div className="w-px h-8 bg-[#e6dace] mx-2"></div>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-4 md:px-6 mt-6 md:mt-8">
                    <div className="space-y-6">
                        {/* 1. Recette De Caisse (Hero) */}
                        <section className="bg-[#f0faf5] rounded-[2.5rem] p-6 md:p-10 lg:p-12 luxury-shadow border border-[#d1fae5] relative overflow-hidden">
                            {/* Decorative Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-4 relative z-10 w-full max-w-4xl mx-auto">
                                {/* Date Side */}
                                <div className="text-center md:text-left flex flex-col gap-1">
                                    <div className="text-[#2d6a4f] text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-40">Session du</div>
                                    <div className="text-3xl md:text-4xl lg:text-5xl font-black text-[#2d6a4f] leading-none tracking-tighter">
                                        <span className="md:hidden">
                                            {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                        </span>
                                        <span className="hidden md:inline">
                                            {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Amount Side */}
                                <div className="flex flex-col items-center md:items-end w-full">
                                    <div className="bg-white/40 md:bg-transparent p-6 md:p-0 rounded-[2rem] border border-white md:border-transparent w-full md:w-auto">
                                        <div className="flex items-center justify-center md:justify-end gap-2 mb-2 text-[#8c8279]">
                                            <Wallet size={16} className="text-[#2d6a4f]" strokeWidth={2.5} />
                                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#4a3426]">Recette Caisse</span>
                                        </div>
                                        <div className="flex items-baseline justify-center md:justify-end gap-3">
                                            <input
                                                type="number"
                                                value={recetteCaisse}
                                                onChange={(e) => { setRecetteCaisse(e.target.value); setHasInteracted(true); }}
                                                className="text-6xl md:text-7xl lg:text-8xl font-black bg-transparent text-[#4a3426] outline-none placeholder-[#e6dace] text-center md:text-right w-full md:w-auto min-w-[150px]"
                                                placeholder="0"
                                            />
                                            <span className="text-xl md:text-2xl lg:text-3xl font-black text-[#c69f6e] shrink-0">DT</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 1. Dépenses Journalier */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-[#4a3426] flex items-center gap-2">
                                    <div className="bg-[#4a3426] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</div>
                                    Dépenses Journalier
                                </h3>
                                <button
                                    onClick={() => setShowJournalierModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e6dace] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#c69f6e] hover:bg-[#fcfaf8] transition-all"
                                >
                                    <Plus size={12} />
                                    Ajouter Journalier
                                </button>
                            </div>

                            <section className="bg-white rounded-[2rem] p-6 luxury-shadow border border-[#e6dace]/50 space-y-4">
                                <div className="space-y-3">
                                    {expensesJournalier.map((journalier, index) => (
                                        <div key={index} className="group flex flex-col p-2 rounded-xl transition-all border hover:bg-[#f9f6f2] border-transparent hover:border-[#e6dace]">
                                            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                                                <div className="w-full md:w-32 relative">
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={journalier.amount}
                                                        onChange={(e) => handleJournalierChange(index, 'amount', e.target.value)}
                                                        className="w-full bg-white border border-[#e6dace] rounded-xl h-12 px-3 font-black text-xl outline-none focus:border-[#c69f6e] text-center"
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bba282] text-xs font-black">DT</span>
                                                </div>

                                                <div className="flex-1 w-full relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <Search className="text-[#bba282]" size={16} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Désignation Journalière..."
                                                        value={journalier.designation}
                                                        onFocus={() => {
                                                            setShowJournalierDropdown(index);
                                                            setDesignationSearch(journalier.designation);
                                                        }}
                                                        onBlur={() => setTimeout(() => setShowJournalierDropdown(null), 200)}
                                                        onChange={(e) => {
                                                            handleJournalierChange(index, 'designation', e.target.value);
                                                            setDesignationSearch(e.target.value);
                                                        }}
                                                        className="w-full bg-white border border-[#e6dace] rounded-xl h-12 pl-10 pr-10 focus:border-[#c69f6e] outline-none font-medium transition-all"
                                                    />
                                                    <button
                                                        onClick={() => setShowJournalierDropdown(showJournalierDropdown === index ? null : index)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bba282] hover:text-[#c69f6e] transition-colors"
                                                    >
                                                        <ChevronDown size={18} />
                                                    </button>
                                                    {showJournalierDropdown === index && (
                                                        <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-xl z-50 mt-1 max-h-48 overflow-y-auto border border-[#e6dace]">
                                                            {commonDesignations
                                                                .filter((d: string) => d.toLowerCase().includes(designationSearch.toLowerCase()))
                                                                .map((d: string) => (
                                                                    <div
                                                                        key={d}
                                                                        className="p-3 hover:bg-[#f9f6f2] cursor-pointer font-medium text-[#4a3426] text-sm"
                                                                        onClick={() => {
                                                                            handleJournalierChange(index, 'designation', d);
                                                                            setShowJournalierDropdown(null);
                                                                        }}
                                                                    >
                                                                        {d}
                                                                    </div>
                                                                ))
                                                            }
                                                            <div
                                                                className="p-3 bg-[#fcfaf8] border-t border-[#e6dace] hover:bg-[#c69f6e] hover:text-white cursor-pointer font-bold text-[#c69f6e] text-xs flex items-center gap-2"
                                                                onClick={() => {
                                                                    setShowJournalierModal(true);
                                                                    setShowJournalierDropdown(null);
                                                                }}
                                                            >
                                                                <Plus size={14} /> Nouveau
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setModalDetailsTarget({ index, type: 'journalier' });
                                                        setTempDetails(journalier.details || '');
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className={`h-12 w-32 rounded-xl border flex items-center justify-center gap-2 transition-all ${journalier.details ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : 'bg-[#fcfaf8] text-[#bba282] border-[#e6dace] hover:border-[#c69f6e] hover:text-[#c69f6e]'}`}
                                                >
                                                    <FileText size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{journalier.details ? 'Détails OK' : 'Détails'}</span>
                                                </button>


                                                <div className="flex items-center gap-2 w-full md:w-auto">
                                                    <label
                                                        onClick={(e) => {
                                                            if (journalier.invoices.length > 0) {
                                                                setViewingInvoices(journalier.invoices);
                                                                setViewingInvoicesTarget({ index, type: 'journalier' });
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className={`h-12 w-24 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-colors relative whitespace-nowrap text-[10px] ${journalier.invoices.length > 0 ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : 'border-dashed border-[#bba282] text-[#bba282] hover:bg-[#f9f6f2]'}`}
                                                    >
                                                        <UploadCloud size={14} />
                                                        <span className="font-black uppercase tracking-widest">{journalier.invoices.length || 'Reçu'}</span>
                                                        <input type="file" multiple className="hidden" onChange={(e) => handleFileUpload(index, e, 'invoice', 'journalier' as any)} />
                                                    </label>
                                                    <div className="w-12 flex justify-center">
                                                        {(index > 0 || expensesJournalier.length > 1) && (
                                                            <button onClick={() => handleRemoveJournalier(index)} className="h-12 w-12 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                                <Trash2 size={20} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleAddJournalier()} className="mt-4 w-full py-3 border-2 border-dashed border-[#e6dace] rounded-xl text-[#bba282] font-bold flex items-center justify-center gap-2 hover:border-[#c69f6e] hover:text-[#c69f6e] transition-all">
                                    <Plus size={18} /> Nouvelle Ligne (Journalier)
                                </button>
                                <div className="mt-4 p-4 bg-[#fcfaf8] rounded-2xl flex justify-between items-center border border-[#e6dace]/50">
                                    <span className="text-xs font-black text-[#8c8279] uppercase tracking-widest">Total Dépenses Journalier</span>
                                    <span className="text-2xl font-black text-[#4a3426]">{totalExpensesJournalier.toFixed(3)} <span className="text-sm">DT</span></span>
                                </div>
                            </section>
                        </div>

                        {/* 2. Dépenses Fournisseur */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-[#4a3426] flex items-center gap-2">
                                    <div className="bg-[#4a3426] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</div>
                                    Dépenses Fournisseur
                                </h3>
                                <button
                                    onClick={() => setShowSupplierModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e6dace] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#c69f6e] hover:bg-[#fcfaf8] transition-all"
                                >
                                    <Plus size={12} />
                                    Ajouter Fournisseur
                                </button>
                            </div>

                            <section className="bg-white rounded-[2rem] p-6 luxury-shadow border border-[#e6dace]/50 space-y-4">
                                <div className="space-y-3">
                                    {expenses.map((expense, index) => (
                                        <div key={index} className={`group flex flex-col p-2 rounded-xl transition-all border ${expense.isFromFacturation ? 'bg-[#f0faf5]/50 border-[#d1e7dd]' : 'hover:bg-[#f9f6f2] border-transparent hover:border-[#e6dace]'}`}>
                                            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                                                <div className="w-full md:w-32 relative">
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        disabled={expense.isFromFacturation}
                                                        value={expense.amount}
                                                        onChange={(e) => handleDetailChange(index, 'amount', e.target.value)}
                                                        className={`w-full bg-white border border-[#e6dace] rounded-xl h-12 px-3 font-black text-xl outline-none focus:border-[#c69f6e] text-center ${expense.isFromFacturation ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bba282] text-xs font-black">DT</span>
                                                </div>

                                                <div className="flex-1 w-full relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <Search className="text-[#bba282]" size={16} />
                                                        {expense.isFromFacturation && <span className="text-[8px] font-black uppercase tracking-tighter bg-[#2d6a4f] text-white px-1.5 py-0.5 rounded leading-none">Facture</span>}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Fournisseur..."
                                                        value={expense.supplier}
                                                        disabled={expense.isFromFacturation}
                                                        onFocus={() => {
                                                            if (!expense.isFromFacturation) {
                                                                setShowSupplierDropdown(index);
                                                                setSupplierSearch(expense.supplier);
                                                                setLastFocusedValue(expense.supplier);
                                                            }
                                                        }}
                                                        onBlur={() => setTimeout(() => setShowSupplierDropdown(null), 200)}
                                                        onChange={(e) => { handleDetailChange(index, 'supplier', e.target.value); setSupplierSearch(e.target.value); }}
                                                        className={`w-full bg-white border border-[#e6dace] rounded-xl h-12 pl-10 pr-10 focus:border-[#c69f6e] outline-none font-medium transition-all ${expense.isFromFacturation ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    />
                                                    {!expense.isFromFacturation && (
                                                        <button
                                                            onClick={() => setShowSupplierDropdown(showSupplierDropdown === index ? null : index)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bba282] hover:text-[#c69f6e] transition-colors"
                                                        >
                                                            <ChevronDown size={18} />
                                                        </button>
                                                    )}
                                                    {showSupplierDropdown === index && !expense.isFromFacturation && (
                                                        <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-xl z-50 mt-1 max-h-48 overflow-y-auto border border-[#e6dace]">
                                                            {filteredSuppliers.map((s: any) => (
                                                                <div key={s.id} className="p-3 hover:bg-[#f9f6f2] cursor-pointer" onClick={() => { handleDetailChange(index, 'supplier', s.name); setShowSupplierDropdown(null); }}>
                                                                    {s.name}
                                                                </div>
                                                            ))}
                                                            {filteredSuppliers.length === 0 && supplierSearch && (
                                                                <div className="p-4 text-center text-[#bba282] text-xs italic">
                                                                    Aucun fournisseur trouvé
                                                                </div>
                                                            )}
                                                            <div
                                                                className="p-3 bg-[#fcfaf8] border-t border-[#e6dace] hover:bg-[#c69f6e] hover:text-white cursor-pointer font-bold text-[#c69f6e] text-xs flex items-center gap-2"
                                                                onClick={() => {
                                                                    setShowSupplierModal(true);
                                                                    setShowSupplierDropdown(null);
                                                                }}
                                                            >
                                                                <Plus size={14} /> Nouveau
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setModalDetailsTarget({ index, type: 'expense' });
                                                        setTempDetails(expense.details || '');
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className={`h-12 w-32 rounded-xl border flex items-center justify-center gap-2 transition-all ${expense.details ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : 'bg-[#fcfaf8] text-[#bba282] border-[#e6dace] hover:border-[#c69f6e] hover:text-[#c69f6e]'}`}
                                                >
                                                    <FileText size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{expense.details ? 'Détails OK' : 'Détails'}</span>
                                                </button>


                                                <div className="flex items-center gap-2 w-full md:w-auto">
                                                    <label
                                                        onClick={(e) => {
                                                            if (expense.invoices.length > 0) {
                                                                setViewingInvoices(expense.invoices);
                                                                setViewingInvoicesTarget({ index, type: 'expense' });
                                                                e.preventDefault();
                                                            } else if (expense.isFromFacturation) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className={`h-12 w-24 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-colors relative whitespace-nowrap text-[10px] ${expense.invoices.length > 0 ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : (expense.isFromFacturation ? 'border-dashed border-red-600 text-red-600 bg-red-50' : 'border-dashed border-[#bba282] text-[#bba282] hover:bg-[#f9f6f2]')}`}
                                                    >
                                                        <UploadCloud size={14} />
                                                        <span className="font-black uppercase tracking-widest">{expense.invoices.length || 'Reçu'}</span>
                                                        {!expense.isFromFacturation && <input type="file" multiple className="hidden" onChange={(e) => handleFileUpload(index, e, 'invoice')} />}
                                                    </label>

                                                    <div className="flex gap-2">
                                                        {expense.paymentMethod === 'Chèque' && (
                                                            <>
                                                                <label
                                                                    onClick={(e) => {
                                                                        if (expense.photo_cheque) {
                                                                            setViewingInvoices([expense.photo_cheque]);
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    className={`h-12 w-20 rounded-xl border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-colors relative whitespace-nowrap text-[10px] ${expense.photo_cheque ? 'border-[#c69f6e] text-[#c69f6e] bg-[#c69f6e]/5' : 'border-red-200 text-red-300 hover:bg-red-50'}`}
                                                                >
                                                                    <UploadCloud size={14} />
                                                                    <span className="font-black uppercase tracking-widest">{expense.photo_cheque ? 'Recto OK' : 'Recto'}</span>
                                                                    {!expense.isFromFacturation && <input type="file" className="hidden" onChange={(e) => handleFileUpload(index, e, 'recto')} />}
                                                                </label>
                                                                <label
                                                                    onClick={(e) => {
                                                                        if (expense.photo_verso) {
                                                                            setViewingInvoices([expense.photo_verso]);
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    className={`h-12 w-20 rounded-xl border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-colors relative whitespace-nowrap text-[10px] ${expense.photo_verso ? 'border-[#c69f6e] text-[#c69f6e] bg-[#c69f6e]/5' : 'border-red-200 text-red-300 hover:bg-red-50'}`}
                                                                >
                                                                    <UploadCloud size={14} />
                                                                    <span className="font-black uppercase tracking-widest">{expense.photo_verso ? 'Verso OK' : 'Verso'}</span>
                                                                    {!expense.isFromFacturation && <input type="file" className="hidden" onChange={(e) => handleFileUpload(index, e, 'verso')} />}
                                                                </label>
                                                            </>
                                                        )}

                                                        <div className="w-12 flex justify-center">
                                                            {!expense.isFromFacturation && (index > 0 || expenses.length > 1) && (
                                                                <button onClick={() => handleRemoveExpense(index)} className="h-12 w-12 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                                    <Trash2 size={20} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {expense.details && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                        animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                                                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                        onClick={() => {
                                                            setModalDetailsTarget({ index, type: 'expense' });
                                                            setTempDetails(expense.details);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="overflow-hidden w-full flex items-center gap-2 cursor-pointer hover:bg-[#fcfaf8]"
                                                    >
                                                        <div className="w-8 flex justify-center text-[#c69f6e]">
                                                            <Sparkles size={14} />
                                                        </div>
                                                        <span className="text-xs text-[#8c8279] font-medium italic">
                                                            {expense.details}
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleAddExpense} className="mt-4 w-full py-3 border-2 border-dashed border-[#e6dace] rounded-xl text-[#bba282] font-bold flex items-center justify-center gap-2 hover:border-[#c69f6e] hover:text-[#c69f6e] transition-all">
                                    <Plus size={18} /> Nouvelle Ligne
                                </button>
                                <div className="mt-4 p-4 bg-[#fcfaf8] rounded-2xl flex justify-between items-center border border-[#e6dace]/50">
                                    <span className="text-xs font-black text-[#8c8279] uppercase tracking-widest">Total Dépenses Fournisseur</span>
                                    <span className="text-2xl font-black text-[#4a3426]">{totalExpensesDynamic.toFixed(3)} <span className="text-sm">DT</span></span>
                                </div>
                            </section>
                        </div>

                        {/* 3. Dépenses Divers */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-[#4a3426] flex items-center gap-2">
                                    <div className="bg-[#4a3426] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</div>
                                    Dépenses divers
                                </h3>
                                <button
                                    onClick={() => setShowDiversModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e6dace] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#c69f6e] hover:bg-[#fcfaf8] transition-all"
                                >
                                    <Plus size={12} />
                                    Ajouter Divers
                                </button>
                            </div>

                            <section className="bg-white rounded-[2rem] p-6 luxury-shadow border border-[#e6dace]/50 space-y-4">
                                <div className="space-y-3">
                                    {expensesDivers.map((divers, index) => (
                                        <div key={index} className="group flex flex-col p-2 rounded-xl transition-all border hover:bg-[#f9f6f2] border-transparent hover:border-[#e6dace]">
                                            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                                                <div className="w-full md:w-32 relative">
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={divers.amount}
                                                        onChange={(e) => handleDiversChange(index, 'amount', e.target.value)}
                                                        className="w-full bg-white border border-[#e6dace] rounded-xl h-12 px-3 font-black text-xl outline-none focus:border-[#c69f6e] text-center"
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bba282] text-xs font-black">DT</span>
                                                </div>

                                                <div className="flex-1 w-full relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <Search className="text-[#bba282]" size={16} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Désignation Divers..."
                                                        value={divers.designation}
                                                        onFocus={() => {
                                                            setShowDiversDropdown(index);
                                                            setDesignationSearch(divers.designation);
                                                        }}
                                                        onBlur={() => setTimeout(() => setShowDiversDropdown(null), 200)}
                                                        onChange={(e) => {
                                                            handleDiversChange(index, 'designation', e.target.value);
                                                            setDesignationSearch(e.target.value);
                                                        }}
                                                        className="w-full bg-white border border-[#e6dace] rounded-xl h-12 pl-10 pr-10 focus:border-[#c69f6e] outline-none font-medium transition-all"
                                                    />
                                                    <button
                                                        onClick={() => setShowDiversDropdown(showDiversDropdown === index ? null : index)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bba282] hover:text-[#c69f6e] transition-colors"
                                                    >
                                                        <ChevronDown size={18} />
                                                    </button>
                                                    {showDiversDropdown === index && (
                                                        <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-xl z-50 mt-1 max-h-48 overflow-y-auto border border-[#e6dace]">
                                                            {commonDesignations
                                                                .filter((d: string) => d.toLowerCase().includes(designationSearch.toLowerCase()))
                                                                .map((d: string) => (
                                                                    <div
                                                                        key={d}
                                                                        className="p-3 hover:bg-[#f9f6f2] cursor-pointer font-medium text-[#4a3426] text-sm"
                                                                        onClick={() => {
                                                                            handleDiversChange(index, 'designation', d);
                                                                            setShowDiversDropdown(null);
                                                                        }}
                                                                    >
                                                                        {d}
                                                                    </div>
                                                                ))
                                                            }
                                                            <div
                                                                className="p-3 bg-[#fcfaf8] border-t border-[#e6dace] hover:bg-[#c69f6e] hover:text-white cursor-pointer font-bold text-[#c69f6e] text-xs flex items-center gap-2"
                                                                onClick={() => {
                                                                    setShowDiversModal(true);
                                                                    setShowDiversDropdown(null);
                                                                }}
                                                            >
                                                                <Plus size={14} /> Nouveau
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setModalDetailsTarget({ index, type: 'divers' });
                                                        setTempDetails(divers.details || '');
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className={`h-12 w-32 rounded-xl border flex items-center justify-center gap-2 transition-all ${divers.details ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : 'bg-[#fcfaf8] text-[#bba282] border-[#e6dace] hover:border-[#c69f6e] hover:text-[#c69f6e]'}`}
                                                >
                                                    <FileText size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{divers.details ? 'Détails OK' : 'Détails'}</span>
                                                </button>


                                                <div className="flex items-center gap-2 w-full md:w-auto">
                                                    <label
                                                        onClick={(e) => {
                                                            if (divers.invoices.length > 0) {
                                                                setViewingInvoices(divers.invoices);
                                                                setViewingInvoicesTarget({ index, type: 'divers' });
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className={`h-12 w-24 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-colors relative whitespace-nowrap text-[10px] ${divers.invoices.length > 0 ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : 'border-dashed border-[#bba282] text-[#bba282] hover:bg-[#f9f6f2]'}`}>
                                                        <UploadCloud size={14} />
                                                        <span className="font-black uppercase tracking-widest">{divers.invoices.length || 'Reçu'}</span>
                                                        <input type="file" multiple className="hidden" onChange={(e) => handleFileUpload(index, e, 'invoice', true)} />
                                                    </label>
                                                    <div className="w-12 flex justify-center">
                                                        {(index > 0 || expensesDivers.length > 1) && (
                                                            <button onClick={() => handleRemoveDivers(index)} className="h-12 w-12 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                                <Trash2 size={20} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleAddDivers()} className="mt-4 w-full py-3 border-2 border-dashed border-[#e6dace] rounded-xl text-[#bba282] font-bold flex items-center justify-center gap-2 hover:border-[#c69f6e] hover:text-[#c69f6e] transition-all">
                                    <Plus size={18} /> Nouvelle Ligne (Divers)
                                </button>
                                <div className="mt-4 p-4 bg-[#fcfaf8] rounded-2xl flex justify-between items-center border border-[#e6dace]/50">
                                    <span className="text-xs font-black text-[#8c8279] uppercase tracking-widest">Total Dépenses Divers</span>
                                    <span className="text-2xl font-black text-[#4a3426]">{totalExpensesDivers.toFixed(3)} <span className="text-sm">DT</span></span>
                                </div>
                            </section>
                        </div>

                        {/* 3. Fixes Grid */}
                        {/* 4. Dépenses Administratif */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-[#4a3426] flex items-center gap-2">
                                    <div className="bg-[#4a3426] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">4</div>
                                    Dépenses Administratif
                                </h3>
                            </div>

                            <section className="bg-white rounded-[2rem] p-6 luxury-shadow border border-[#e6dace]/50 space-y-4">
                                <div className="space-y-3">
                                    {expensesAdmin.map((admin, index) => (
                                        <div key={index} className="group flex flex-col p-2 rounded-xl transition-all border hover:bg-[#f9f6f2] border-transparent hover:border-[#e6dace]">
                                            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                                                <div className="w-full md:w-32 relative">
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={admin.amount}
                                                        onChange={(e) => handleAdminChange(index, 'amount', e.target.value)}
                                                        className="w-full bg-white border border-[#e6dace] rounded-xl h-12 px-3 font-black text-xl outline-none focus:border-[#c69f6e] text-center"
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bba282] text-xs font-black">DT</span>
                                                </div>

                                                <div className="flex-1 w-full relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <User className="text-[#bba282]" size={16} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={admin.designation}
                                                        readOnly
                                                        className="w-full bg-[#f9f6f2] border border-[#e6dace] rounded-xl h-12 pl-10 pr-4 outline-none font-bold text-[#4a3426] opacity-70 cursor-not-allowed"
                                                    />
                                                </div>

                                                <div className="hidden md:flex items-center gap-4">
                                                    <div className="w-32"></div> {/* Spacing for Détails button */}
                                                    <div className="w-24"></div> {/* Spacing for Reçu button */}
                                                    <div className="w-12"></div> {/* Spacing for Trash button */}
                                                </div>

                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-4 bg-[#fcfaf8] rounded-2xl flex justify-between items-center border border-[#e6dace]/50">
                                    <span className="text-xs font-black text-[#8c8279] uppercase tracking-widest">Total Dépenses Administratif</span>
                                    <span className="text-2xl font-black text-[#4a3426]">{totalExpensesAdmin.toFixed(3)} <span className="text-sm">DT</span></span>
                                </div>
                            </section>
                        </div>
                        {/* 3. Fixes Grid (2x2) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 2.2 Accompte */}
                            <div className="bg-white rounded-[2rem] p-6 luxury-shadow relative overflow-hidden border border-[#e6dace]/50">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-[#8c8279] text-xs uppercase tracking-wider">2.2 Accompte</h4>
                                    <span className="bg-[#f4ece4] text-[#4a3426] px-4 py-2 rounded-2xl font-black text-xl">{acompte.toFixed(3)} DT</span>
                                </div>
                                <div className="space-y-2 text-sm text-[#4a3426] max-h-32 overflow-y-auto custom-scrollbar">
                                    {avancesList.length > 0 ? avancesList.map((a, i) => (
                                        <div key={i} className="flex justify-between p-2 bg-[#f9f6f2] rounded-lg items-center">
                                            <span className="font-medium opacity-70">{a.username}</span>
                                            <b className="font-black text-[#4a3426]">{parseFloat(a.montant).toFixed(3)}</b>
                                        </div>
                                    )) : (
                                        <p className="text-center py-4 text-[#8c8279] italic opacity-50">Aucune avance</p>
                                    )}
                                </div>
                            </div>

                            {/* 2.3 Doublage */}
                            <div className="bg-white rounded-[2rem] p-6 luxury-shadow relative overflow-hidden border border-[#e6dace]/50">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-[#8c8279] text-xs uppercase tracking-wider">2.3 Doublage</h4>
                                    <span className="bg-[#f4ece4] text-[#4a3426] px-4 py-2 rounded-2xl font-black text-xl">{doublage.toFixed(3)} DT</span>
                                </div>
                                <div className="space-y-2 text-sm text-[#4a3426] max-h-32 overflow-y-auto custom-scrollbar">
                                    {doublagesList.length > 0 ? doublagesList.map((d, i) => (
                                        <div key={i} className="flex justify-between p-2 bg-[#f9f6f2] rounded-lg items-center">
                                            <span className="font-medium opacity-70">{d.username}</span>
                                            <b className="font-black text-[#4a3426]">{parseFloat(d.montant).toFixed(3)}</b>
                                        </div>
                                    )) : (
                                        <p className="text-center py-4 text-[#8c8279] italic opacity-50">Aucune doublage</p>
                                    )}
                                </div>
                            </div>

                            {/* 2.4 Extra */}
                            <div className="bg-white rounded-[2rem] p-6 luxury-shadow relative overflow-hidden border border-[#e6dace]/50">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <Zap size={16} className="text-[#c69f6e]" />
                                        <h4 className="font-bold text-[#8c8279] text-xs uppercase tracking-wider">2.4 Extra</h4>
                                    </div>
                                    <span className="bg-[#f4ece4] text-[#4a3426] px-4 py-2 rounded-2xl font-black text-xl">{extraTotal.toFixed(3)} DT</span>
                                </div>
                                <div className="space-y-2 text-sm text-[#4a3426] max-h-32 overflow-y-auto custom-scrollbar">
                                    {extrasList.length > 0 ? extrasList.map((e, i) => (
                                        <div key={i} className="flex justify-between p-2 bg-[#f9f6f2] rounded-lg items-center">
                                            <span className="font-medium opacity-70">{e.username}</span>
                                            <b className="font-black text-[#4a3426]">{parseFloat(e.montant).toFixed(3)}</b>
                                        </div>
                                    )) : (
                                        <p className="text-center py-4 text-[#8c8279] italic opacity-50">Aucun extra</p>
                                    )}
                                </div>
                            </div>

                            {/* 2.5 Primes */}
                            <div className="bg-white rounded-[2rem] p-6 luxury-shadow relative overflow-hidden border border-[#e6dace]/50">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={16} className="text-[#2d6a4f]" />
                                        <h4 className="font-bold text-[#8c8279] text-xs uppercase tracking-wider">2.5 Primes</h4>
                                    </div>
                                    <span className="bg-[#f4ece4] text-[#4a3426] px-4 py-2 rounded-2xl font-black text-xl">{primesTotal.toFixed(3)} DT</span>
                                </div>
                                <div className="space-y-2 text-sm text-[#4a3426] max-h-32 overflow-y-auto custom-scrollbar">
                                    {primesList.length > 0 ? primesList.map((p, i) => (
                                        <div key={i} className="flex justify-between p-2 bg-[#f9f6f2] rounded-lg items-center">
                                            <span className="font-medium opacity-70">{p.username}</span>
                                            <b className="font-black text-[#4a3426]">{parseFloat(p.montant).toFixed(3)}</b>
                                        </div>
                                    )) : (
                                        <p className="text-center py-4 text-[#8c8279] italic opacity-50">Aucune prime</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 4. TOTALS & RÉPARTITION SUMMARY BOX */}
                        <div className="bg-[#1b4332] rounded-[2.5rem] luxury-shadow relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

                            {/* Totals Row */}
                            <div className="p-8 border-b border-white/10 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className="space-y-1 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-8">
                                        <div className="flex items-center gap-2 opacity-70 mb-2 text-white">
                                            <Calculator size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Total Dépenses</span>
                                        </div>
                                        <div className="flex items-baseline gap-3 text-white mt-1">
                                            <span className="text-5xl md:text-6xl font-black tracking-tighter">{totalExpenses.toFixed(3)}</span>
                                            <span className="text-xl md:text-2xl font-medium opacity-50 uppercase">DT</span>
                                        </div>
                                        <div className="text-[10px] md:text-xs opacity-40 mt-1 text-white">
                                            (Fournisseurs: {totalExpensesDynamic.toFixed(3)} + Journalier: {totalExpensesJournalier.toFixed(3)} + Divers: {totalExpensesDivers.toFixed(3)} + Admin: {totalExpensesAdmin.toFixed(3)} + Fixes: {(acompte + doublage + extraTotal + primesTotal).toFixed(3)})
                                        </div>
                                    </div>

                                    <div className="pt-2 md:pt-0 md:pl-4">
                                        <div className="flex items-center gap-2 opacity-70 mb-2 text-white">
                                            <TrendingUp size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Recette Nette</span>
                                        </div>
                                        <div className="flex items-baseline gap-3 mt-1">
                                            <span className={`text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter transition-all duration-500 ${recetteNett >= 0 ? 'text-[#c69f6e]' : 'text-red-400'}`}>
                                                {recetteNett.toFixed(3)}
                                            </span>
                                            <span className="text-2xl md:text-3xl font-medium opacity-50 text-white uppercase font-black">DT</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Répartition Section */}
                            <div className="p-8 pt-6 relative z-10">
                                <h3 className="font-black text-white/80 mb-6 flex items-center gap-3 uppercase text-xs tracking-[0.2em]">
                                    <Receipt size={16} /> Répartition Finale
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'TPE (Carte)', icon: CreditCard, val: tpe, set: setTpe },
                                        { label: 'Espèces', icon: Coins, val: especes, set: setEspeces },
                                        { label: 'Chèque', icon: Wallet, val: cheque, set: setCheque },
                                        { label: 'Ticket Restaurant', icon: Receipt, val: ticketsRestaurant, set: setTicketsRestaurant }
                                    ].map((m, i) => (
                                        <div key={i} className="relative">
                                            <label className="text-xs font-black uppercase tracking-[0.15em] text-white/50 ml-2 mb-2 block">{m.label}</label>
                                            <div className="relative">
                                                <m.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                                                <input
                                                    type="number"
                                                    disabled={m.label === 'Espèces'}
                                                    value={m.val}
                                                    onChange={(e) => m.set(e.target.value)}
                                                    className={`w-full h-20 rounded-2xl pl-11 pr-3 font-black text-2xl md:text-3xl text-white outline-none transition-all shadow-inner ${m.label === 'Espèces' ? 'bg-white/20 border-white/30' : 'bg-white/10 border border-white/10 focus:bg-white/20 focus:border-white/40'}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Centered Save Button (Integrated in content) */}
                        <div className="flex justify-center pt-8">
                            <button
                                onClick={handleSave}
                                className="gold-gradient text-white px-12 py-5 rounded-[2.5rem] shadow-2xl shadow-[#c69f6e]/30 flex items-center gap-3 font-black text-xl hover:scale-105 active:scale-95 transition-all w-full max-w-md justify-center border border-white/20"
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />} Enregistrer la Session
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-6 left-0 right-0 mx-auto w-max z-50 px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 ${toast.type === 'success' ? 'bg-[#2d6a4f] text-white' : 'bg-red-600 text-white'}`}>{toast.msg}</motion.div>
                )}
            </AnimatePresence>

            {/* Image Modal */}
            <AnimatePresence>
                {viewingInvoices && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setViewingInvoices(null); setViewingInvoicesTarget(null); }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setViewingInvoices(null); setViewingInvoicesTarget(null); }} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"><LogOut size={20} className="rotate-180" /></button>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-[#4a3426] flex items-center gap-2"><Receipt size={24} className="text-[#c69f6e]" /> Reçus & Factures</h3>
                                {viewingInvoicesTarget && (
                                    <label className="flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-[#1b4332] transition-all shadow-lg shadow-green-200">
                                        <Plus size={16} /> Ajouter Photo
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={async (e) => {
                                                const files = e.target.files;
                                                if (!files) return;
                                                const loaders = Array.from(files).map(file => {
                                                    return new Promise<string>((resolve) => {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => resolve(reader.result as string);
                                                        reader.readAsDataURL(file);
                                                    });
                                                });
                                                const base64s = await Promise.all(loaders);

                                                if (viewingInvoicesTarget.type === 'journalier') {
                                                    const newJournalier = [...expensesJournalier];
                                                    const currentInvoices = newJournalier[viewingInvoicesTarget.index].invoices || [];
                                                    newJournalier[viewingInvoicesTarget.index].invoices = [...currentInvoices, ...base64s];
                                                    setExpensesJournalier(newJournalier);
                                                    setViewingInvoices(newJournalier[viewingInvoicesTarget.index].invoices);
                                                } else if (viewingInvoicesTarget.type === 'divers') {
                                                    const newDivers = [...expensesDivers];
                                                    const currentInvoices = newDivers[viewingInvoicesTarget.index].invoices || [];
                                                    newDivers[viewingInvoicesTarget.index].invoices = [...currentInvoices, ...base64s];
                                                    setExpensesDivers(newDivers);
                                                    setViewingInvoices(newDivers[viewingInvoicesTarget.index].invoices);
                                                } else {
                                                    const newExpenses = [...expenses];
                                                    const currentInvoices = newExpenses[viewingInvoicesTarget.index].invoices || [];
                                                    newExpenses[viewingInvoicesTarget.index].invoices = [...currentInvoices, ...base64s];
                                                    setExpenses(newExpenses);
                                                    setViewingInvoices(newExpenses[viewingInvoicesTarget.index].invoices);
                                                }
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                            {viewingInvoices.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{viewingInvoices.map((img, idx) => (<div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm"><img src={img} className="w-full h-auto object-contain" /><div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">Reçu {idx + 1}</div></div>))}</div>
                            ) : <div className="text-center py-20 text-gray-400"><UploadCloud size={60} className="mx-auto mb-4 opacity-20" /><p>Aucun reçu attaché</p></div>}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Admin Calendar Modal */}
            <AnimatePresence>
                {showCalendar && role === 'admin' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-[2px] flex items-start justify-center pt-24" onClick={() => setShowCalendar(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: -20 }} className="bg-white rounded-3xl p-6 shadow-2xl border border-[#c69f6e]/20 w-80" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-[#f4ece4] rounded-full text-[#4a3426]"><ChevronLeft size={18} /></button>
                                <h3 className="text-lg font-bold text-[#4a3426] capitalize">{new Date(date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
                                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-[#f4ece4] rounded-full text-[#4a3426]"><ChevronRight size={18} /></button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">{['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (<span key={i} className="text-xs font-bold text-[#bba282] uppercase">{d}</span>))}</div>
                            <div className="grid grid-cols-7 gap-1">
                                {generateCalendarDays(date).map((day, i) => {
                                    if (!day) return <div key={i}></div>;
                                    const isSelected = new Date(date).getDate() === day;
                                    return (<button key={i} onClick={() => { const newD = new Date(date); newD.setDate(day); setDate(newD.toISOString().split('T')[0]); setShowCalendar(false); }} className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${isSelected ? 'bg-[#4a3426] text-white shadow-lg' : 'text-[#4a3426] hover:bg-[#f4ece4] hover:text-[#c69f6e]'}`}>{day}</button>);
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click outside to close dropdowns */}
            {showSupplierDropdown !== null && <div className="fixed inset-0 z-40" onClick={() => setShowSupplierDropdown(null)} />}
            {showJournalierDropdown !== null && <div className="fixed inset-0 z-40" onClick={() => setShowJournalierDropdown(null)} />}
            {showDiversDropdown !== null && <div className="fixed inset-0 z-40" onClick={() => setShowDiversDropdown(null)} />}

            {/* Supplier Modal */}
            {/* Details Modal */}
            <AnimatePresence>
                {showDetailsModal && modalDetailsTarget && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setShowDetailsModal(false);
                                setModalDetailsTarget(null);
                            }}
                            className="absolute inset-0 bg-[#4a3426]/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="relative bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl border border-[#e6dace] overflow-hidden"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="bg-[#fcfaf8] p-4 rounded-2xl text-[#c69f6e] border border-[#e6dace]">
                                    <Sparkles size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#4a3426] tracking-tight">Ajouter des détails</h3>
                                    <p className="text-[10px] text-[#c69f6e] font-black uppercase tracking-[0.2em] mt-1">
                                        {modalDetailsTarget.type === 'divers'
                                            ? `Catégorie : ${expensesDivers[modalDetailsTarget.index]?.designation || ''}`
                                            : modalDetailsTarget.type === 'journalier'
                                                ? `Désignation : ${expensesJournalier[modalDetailsTarget.index]?.designation || ''}`
                                                : `Fournisseur : ${expenses[modalDetailsTarget.index]?.supplier || ''}`}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c8279] ml-1">Précisions (ex: Fruits → Pommes)</label>
                                    <div className="relative">
                                        <textarea
                                            autoFocus
                                            value={tempDetails}
                                            onChange={(e) => setTempDetails(e.target.value)}
                                            placeholder="Notez ici les détails de la dépense..."
                                            className="w-full bg-[#fcfaf8] border border-[#e6dace] rounded-3xl p-6 text-base font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none min-h-[160px] resize-none transition-all shadow-inner placeholder-[#bba282]/30"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setModalDetailsTarget(null);
                                        }}
                                        className="flex-1 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] text-[#8c8279] hover:bg-[#f9f6f2] border border-[#e6dace] transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (modalDetailsTarget.type === 'divers') {
                                                const newDivers = [...expensesDivers];
                                                newDivers[modalDetailsTarget.index].details = tempDetails;
                                                setExpensesDivers(newDivers);
                                            } else if (modalDetailsTarget.type === 'journalier') {
                                                const newJournalier = [...expensesJournalier];
                                                newJournalier[modalDetailsTarget.index].details = tempDetails;
                                                setExpensesJournalier(newJournalier);
                                            } else {
                                                const newExpenses = [...expenses];
                                                newExpenses[modalDetailsTarget.index].details = tempDetails;
                                                setExpenses(newExpenses);
                                            }
                                            setShowDetailsModal(false);
                                            setModalDetailsTarget(null);
                                        }}
                                        className="flex-[2] py-5 gold-gradient rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] text-white shadow-xl shadow-[#c69f6e]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Enregistrer les détails
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSupplierModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSupplierModal(false)}
                            className="absolute inset-0 bg-[#4a3426]/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-[#e6dace] overflow-hidden p-8"
                        >
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="bg-[#fcfaf8] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#e6dace]">
                                        <Plus size={32} className="text-[#c69f6e]" />
                                    </div>
                                    <h3 className="text-2xl font-black text-[#4a3426] tracking-tight">Nouveau Fournisseur</h3>
                                    <p className="text-[#8c8279] text-sm mt-1">Ajoutez un nouveau partenaire à votre liste.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bba282]" size={18} />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Nom du fournisseur..."
                                            value={newSupplierName}
                                            onChange={(e) => setNewSupplierName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddNewSupplier(newSupplierName)}
                                            className="w-full bg-[#fcfaf8] border border-[#e6dace] rounded-2xl h-14 pl-12 pr-4 focus:border-[#c69f6e] outline-none font-bold text-[#4a3426] transition-all placeholder-[#bba282]/50"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowSupplierModal(false)}
                                        className="flex-1 h-14 rounded-2xl border border-[#e6dace] text-[#8c8279] font-black uppercase text-xs tracking-widest hover:bg-[#fcfaf8] transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={() => handleAddNewSupplier(newSupplierName)}
                                        disabled={!newSupplierName.trim()}
                                        className="flex-1 h-14 rounded-2xl bg-[#c69f6e] text-white font-black uppercase text-xs tracking-widest hover:bg-[#b08d5d] transition-all shadow-lg shadow-[#c69f6e]/20 disabled:opacity-50"
                                    >
                                        Confirmer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Selection Modals Journalier/Divers */}
            <AnimatePresence>
                {(showJournalierModal || showDiversModal) && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowJournalierModal(false); setShowDiversModal(false); }} className="absolute inset-0 bg-[#4a3426]/40 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-[#e6dace] overflow-hidden" >
                            <div className="relative">
                                <div className="text-center mb-8">
                                    <div className="bg-[#fcfaf8] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#e6dace]">
                                        <Plus size={32} className="text-[#c69f6e]" />
                                    </div>
                                    <h3 className="text-2xl font-black text-[#4a3426] tracking-tight">Nouvelle Désignation</h3>
                                    <p className="text-[#8c8279] text-sm mt-1">Ajoutez une nouvelle désignation à votre liste.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bba282]" size={18} />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Nom de la désignation..."
                                            value={designationSearch}
                                            onChange={(e) => setDesignationSearch(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && designationSearch.trim()) {
                                                    if (showJournalierModal) {
                                                        handleAddJournalier(designationSearch);
                                                        setShowJournalierModal(false);
                                                    } else {
                                                        handleAddDivers(designationSearch);
                                                        setShowDiversModal(false);
                                                    }
                                                    setDesignationSearch('');
                                                }
                                            }}
                                            className="w-full bg-[#fcfaf8] border border-[#e6dace] rounded-2xl h-14 pl-12 pr-4 focus:border-[#c69f6e] outline-none font-bold text-[#4a3426] transition-all placeholder-[#bba282]/50"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => {
                                                setShowJournalierModal(false);
                                                setShowDiversModal(false);
                                                setDesignationSearch('');
                                            }}
                                            className="flex-1 h-14 rounded-2xl border border-[#e6dace] text-[#8c8279] font-black uppercase text-xs tracking-widest hover:bg-[#fcfaf8] transition-all"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (designationSearch.trim()) {
                                                    try {
                                                        await upsertDesignation({ variables: { name: designationSearch.trim() } });
                                                        refetchDesignations();
                                                        if (showJournalierModal) {
                                                            handleAddJournalier(designationSearch.trim());
                                                            setShowJournalierModal(false);
                                                        } else {
                                                            handleAddDivers(designationSearch.trim());
                                                            setShowDiversModal(false);
                                                        }
                                                        setDesignationSearch('');
                                                        setToast({ msg: 'Désignation ajoutée', type: 'success' });
                                                        setTimeout(() => setToast(null), 3000);
                                                    } catch (e) {
                                                        setToast({ msg: 'Erreur lors de l’ajout', type: 'error' });
                                                        setTimeout(() => setToast(null), 3000);
                                                    }
                                                }
                                            }}
                                            disabled={!designationSearch.trim()}
                                            className="flex-1 h-14 rounded-2xl bg-[#c69f6e] text-white font-black uppercase text-xs tracking-widest hover:bg-[#b08d5d] transition-all shadow-lg shadow-[#c69f6e]/20 disabled:opacity-50"
                                        >
                                            Confirmer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
