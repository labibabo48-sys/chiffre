'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
    LayoutDashboard, TrendingDown, TrendingUp, Calendar, ChevronLeft, ChevronRight,
    BarChart3, LineChart, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight,
    Download, Filter, DownloadCloud, Loader2, Users, Receipt, CreditCard,
    Banknote, Coins, Plus, Search, Trash2, FileText, UploadCloud, ChevronDown, Check,
    LogOut, ZoomIn, ZoomOut, Maximize2, RotateCcw, LockIcon, UnlockIcon, X, PlusCircle, AlertCircle,
    Wallet, Eye, EyeOff, ChevronsRight, Upload, SlidersHorizontal, ArrowUpDown, Lock, Unlock, Settings,
    Briefcase, User, MessageSquare, Share2, ExternalLink, List, Pencil, Save, Calculator, Zap, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const GET_CHIFFRES_RANGE = gql`
  query GetChiffresRange($startDate: String!, $endDate: String!) {
    getChiffresByRange(startDate: $startDate, endDate: $endDate) {
        id
        date
        avances_details { id username montant }
        doublages_details { id username montant }
        extras_details { id username montant }
        primes_details { id username montant }
        diponce
        diponce_divers
        diponce_admin
        diponce_journalier
    }
  }
`;

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
        avances_details { id username montant }
        doublages_details { id username montant }
        extras_details { id username montant }
        primes_details { id username montant }
        diponce_divers
        diponce_journalier
        diponce_admin
        is_locked
    }
}
`;

const UNLOCK_CHIFFRE = gql`
  mutation UnlockChiffre($date: String!) {
    unlockChiffre(date: $date) {
        id
        is_locked
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

const UNPAY_INVOICE = gql`
  mutation UnpayInvoice($id: Int!) {
    unpayInvoice(id: $id) {
      id
      status
    }
  }
`;

const GET_EMPLOYEES = gql`
  query GetEmployees {
    getEmployees {
      id
      name
      department
    }
  }
`;

const UPSERT_EMPLOYEE = gql`
  mutation UpsertEmployee($name: String!, $department: String) {
    upsertEmployee(name: $name, department: $department) {
      id
      name
      department
    }
  }
`;

const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployee($id: Int!, $name: String!, $department: String) {
    updateEmployee(id: $id, name: $name, department: $department) { id name department }
  }
`;

const DELETE_EMPLOYEE = gql`
  mutation DeleteEmployee($id: Int!) {
    deleteEmployee(id: $id)
  }
`;

const ADD_AVANCE = gql`
  mutation AddAvance($username: String!, $amount: String!, $date: String!) {
    addAvance(username: $username, amount: $amount, date: $date) { id username montant }
  }
`;
const DELETE_AVANCE = gql`
  mutation DeleteAvance($id: Int!) { deleteAvance(id: $id) }
`;

const ADD_DOUBLAGE = gql`
  mutation AddDoublage($username: String!, $amount: String!, $date: String!) {
    addDoublage(username: $username, amount: $amount, date: $date) { id username montant }
  }
`;
const DELETE_DOUBLAGE = gql`
  mutation DeleteDoublage($id: Int!) { deleteDoublage(id: $id) }
`;

const ADD_EXTRA = gql`
  mutation AddExtra($username: String!, $amount: String!, $date: String!) {
    addExtra(username: $username, amount: $amount, date: $date) { id username montant }
  }
`;
const DELETE_EXTRA = gql`
  mutation DeleteExtra($id: Int!) { deleteExtra(id: $id) }
`;

const ADD_PRIME = gql`
  mutation AddPrime($username: String!, $amount: String!, $date: String!) {
    addPrime(username: $username, amount: $amount, date: $date) { id username montant }
  }
`;
const DELETE_PRIME = gql`
  mutation DeletePrime($id: Int!) { deletePrime(id: $id) }
`;

const EntryModal = ({ isOpen, onClose, onSubmit, type, employees = [], initialData = null }: any) => {
    const [search, setSearch] = useState('');
    const [amount, setAmount] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setSearch(initialData.username);
                setAmount(initialData.montant);
            } else {
                setSearch('');
                setAmount('');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const filteredEmployees = employees.filter((e: any) =>
        e.name.toLowerCase().includes(search.toLowerCase())
    );

    const titleMap: any = {
        avance: initialData ? 'Mettre à jour Accompte' : 'Ajouter Accompte',
        doublage: initialData ? 'Mettre à jour Doublage' : 'Ajouter Doublage',
        extra: initialData ? 'Mettre à jour Extra' : 'Ajouter Extra',
        prime: initialData ? 'Mettre à jour Prime' : 'Ajouter Prime'
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-[#e6dace]"
                >
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-[#4a3426] uppercase tracking-tighter">{titleMap[type]}</h3>
                            <button onClick={onClose} className="p-2 hover:bg-[#f9f6f2] rounded-xl transition-colors text-[#bba282]"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-[10px] font-black text-[#bba282] uppercase tracking-[0.2em] mb-2 block ml-1">Employé</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bba282]"><User size={18} /></div>
                                    <input
                                        type="text"
                                        placeholder="Rechercher un employé..."
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                                        onFocus={() => setShowDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                        className="w-full h-14 bg-[#fcfaf8] border border-[#e6dace] rounded-2xl pl-12 pr-4 font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all"
                                    />
                                    {showDropdown && search && filteredEmployees.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-[#e6dace] max-h-48 overflow-y-auto z-[410] custom-scrollbar">
                                            {filteredEmployees.map((emp: any) => (
                                                <button
                                                    key={emp.id}
                                                    onClick={() => { setSearch(emp.name); setShowDropdown(false); }}
                                                    className="w-full text-left px-5 py-3 hover:bg-[#fcfaf8] font-bold text-[#4a3426] border-b border-[#f9f6f2] last:border-0 transition-colors"
                                                >
                                                    {emp.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="relative">
                                <label className="text-[10px] font-black text-[#bba282] uppercase tracking-[0.2em] mb-2 block ml-1">Montant (DT)</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bba282] font-black">DT</div>
                                    <input
                                        type="number"
                                        placeholder="0.000"
                                        step="0.001"
                                        value={amount}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full h-14 bg-[#fcfaf8] border border-[#e6dace] rounded-2xl pl-12 pr-4 font-black text-2xl text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={!search || !amount || parseFloat(amount) <= 0 || !employees.some((e: any) => e.name === search)}
                            onClick={() => {
                                onSubmit(type, search, amount);
                                onClose();
                            }}
                            className="w-full h-14 bg-[#4a3426] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-[#4a3426]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:grayscale disabled:scale-100"
                        >
                            Valider l'entrée
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

interface ChiffrePageProps {
    role: 'admin' | 'caissier';
    onLogout: () => void;
}

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, color = 'brown', alert = false }: any) => {
    if (!isOpen) return null;
    const colors: { [key: string]: string } = {
        brown: 'bg-[#4a3426] hover:bg-[#38261b]',
        red: 'bg-red-500 hover:bg-red-600',
        green: 'bg-[#2d6a4f] hover:bg-[#1b4332]'
    };
    const backdropColors: { [key: string]: string } = {
        brown: 'bg-black/40',
        red: 'bg-red-600/90',
        green: 'bg-[#2d6a4f]/60'
    };
    const headerColors: { [key: string]: string } = {
        brown: 'bg-[#4a3426]',
        red: 'bg-red-500',
        green: 'bg-[#2d6a4f]'
    };
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-[300] ${backdropColors[color]} backdrop-blur-md flex items-center justify-center p-4 text-left`}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl border border-white/20"
                >
                    <div className={`p-6 ${headerColors[color]} text-white`}>
                        <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <p className="text-sm font-bold text-[#8c8279] uppercase tracking-wide leading-relaxed">
                            {message}
                        </p>
                        <div className="flex gap-3">
                            {!alert && (
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-12 bg-[#f9f6f2] text-[#8c8279] rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#ece6df] transition-all"
                                >
                                    Annuler
                                </button>
                            )}
                            <button
                                onClick={() => { if (onConfirm) onConfirm(); onClose(); }}
                                className={`flex-1 h-12 ${colors[color]} text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg`}
                            >
                                {alert ? 'OK' : 'Confirmer'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const HistoryModal = ({ isOpen, onClose, type, startDate, endDate, targetName }: any) => {
    const { data: historyData, loading, error } = useQuery(GET_CHIFFRES_RANGE, {
        variables: { startDate, endDate },
        skip: !isOpen,
        fetchPolicy: 'network-only'
    });

    if (!isOpen) return null;

    if (error) {
        console.error("History Query Error:", error);
    }

    const titleMap: any = {
        avance: 'Liste des Accomptes',
        doublage: 'Liste des Doublages',
        extra: 'Liste des Extras',
        prime: 'Liste des Primes',
        divers: 'Dépenses Divers',
        admin: 'Dépenses Administratif',
        journalier: 'Dépenses Journalier',
        supplier: 'Dépenses Fournisseur'
    };

    const detailsKeyMap: any = {
        avance: 'avances_details',
        doublage: 'doublages_details',
        extra: 'extras_details',
        prime: 'primes_details',
        divers: 'diponce_divers',
        admin: 'diponce_admin',
        journalier: 'diponce_journalier',
        supplier: 'diponce'
    };

    // Grouping logic
    const groupedData: any = {};
    let globalTotal = 0;

    historyData?.getChiffresByRange?.forEach((chiffre: any) => {
        let details = [];
        const isJsonType = ['divers', 'admin', 'journalier', 'supplier'].includes(type);

        if (isJsonType) {
            try {
                details = JSON.parse(chiffre[detailsKeyMap[type]] || '[]');
            } catch (e) { details = []; }
            // Normalize for logic reuse (some use 'supplier', some 'designation')
            details = details.map((d: any) => ({
                ...d,
                username: d.designation || d.supplier,
                montant: d.amount
            }));
        } else {
            details = chiffre[detailsKeyMap[type]] || [];
        }

        details.forEach((item: any) => {
            if (!item.username || !item.montant) return;

            if (!groupedData[item.username]) {
                groupedData[item.username] = {
                    username: item.username,
                    total: 0,
                    dates: []
                };
            }
            const amount = parseFloat(item.montant);
            groupedData[item.username].total += amount;
            globalTotal += amount;

            // Safe Date Formatting (YYYY-MM-DD -> DD/MM/YYYY)
            const dateParts = chiffre.date.split('T')[0].split('-');
            const formattedDate = dateParts.length === 3
                ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
                : chiffre.date;

            if (!groupedData[item.username].dates.includes(formattedDate)) {
                groupedData[item.username].dates.push(formattedDate);
            }
        });
    });

    let employeesList = Object.values(groupedData).map((emp: any) => ({
        ...emp,
        dates: emp.dates.sort((a: string, b: string) => {
            const [da, ma, ya] = a.split('/').map(Number);
            const [db, mb, yb] = b.split('/').map(Number);
            return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime();
        })
    })).sort((a: any, b: any) => b.total - a.total);

    if (targetName) {
        employeesList = employeesList.filter((e: any) => e.username.toLowerCase() === targetName.toLowerCase());
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-[#e6dace] flex flex-col max-h-[90vh]"
                >
                    <div className="p-8 space-y-4 border-b border-[#f9f6f2]">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-[#fcfaf8] rounded-2xl text-[#c69f6e]">
                                    <LayoutDashboard size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-[#4a3426] tracking-tighter uppercase">
                                    {targetName ? `Historique: ${targetName}` : titleMap[type]}
                                </h3>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-[#f9f6f2] rounded-xl transition-colors text-[#bba282]"><X size={24} /></button>
                        </div>
                        <p className="text-[#8c8279] font-medium pl-1">{type?.charAt(0).toUpperCase() + type?.slice(1)}s groupés par employé</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4 bg-[#fcfaf8]/50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="animate-spin text-[#c69f6e]" size={40} />
                                <p className="text-[#8c8279] font-bold uppercase tracking-widest text-xs">Chargement de l'historique...</p>
                            </div>
                        ) : employeesList.length > 0 ? (
                            employeesList.map((emp: any, i: number) => (
                                <div key={i} className="bg-white p-6 rounded-[2rem] border border-[#e6dace]/50 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-[#f9f6f2] rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                                                <span className="text-xl font-black text-[#c69f6e] uppercase">{emp.username.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-[#4a3426] capitalize">{emp.username}</h4>
                                                <p className="text-[10px] font-black text-[#bba282] uppercase tracking-[0.1em] mt-1">Dates travaillées:</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-[#c69f6e]">{emp.total.toFixed(3)} <span className="text-xs">DT</span></span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {emp.dates.map((dateStr: string, di: number) => (
                                            <span key={di} className="px-4 py-2 bg-[#fcfaf8] border border-[#e6dace] rounded-xl text-xs font-bold text-[#4a3426] shadow-sm">
                                                {dateStr}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 opacity-40 italic">Aucune donnée trouvée pour cette période</div>
                        )}
                    </div>

                    <div className="p-8 bg-white border-t border-[#f9f6f2] flex justify-between items-center">
                        <span className="text-sm font-black text-[#8c8279] uppercase tracking-widest">Total Global</span>
                        <span className="text-3xl font-black text-[#4a3426]">{globalTotal.toFixed(3)} <span className="text-sm font-bold">DT</span></span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default function ChiffrePage({ role, onLogout }: ChiffrePageProps) {
    // Global State
    const [date, setDate] = useState<string>('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        setDate(`${y}-${m}-${d}`);
    }, []);

    // GraphQL
    const { data: chiffreData, refetch: refetchChiffre } = useQuery(GET_CHIFFRE, {
        variables: { date },
        skip: !date
    });
    const { data: suppliersData, refetch: refetchSuppliers } = useQuery(GET_SUPPLIERS);
    const { data: designationsData, refetch: refetchDesignations } = useQuery(GET_DESIGNATIONS);
    const [saveChiffre, { loading: saving }] = useMutation(SAVE_CHIFFRE);
    const [unlockChiffre, { loading: unlocking }] = useMutation(UNLOCK_CHIFFRE);
    const [upsertSupplier] = useMutation(UPSERT_SUPPLIER);
    const [upsertDesignation] = useMutation(UPSERT_DESIGNATION);
    const [unpayInvoice] = useMutation(UNPAY_INVOICE);
    const { data: employeesData, refetch: refetchEmployees } = useQuery(GET_EMPLOYEES);

    const [upsertEmployee] = useMutation(UPSERT_EMPLOYEE);
    const [updateEmployee] = useMutation(UPDATE_EMPLOYEE);
    const [deleteEmployee] = useMutation(DELETE_EMPLOYEE);
    const [addAvance] = useMutation(ADD_AVANCE);
    const [deleteAvance] = useMutation(DELETE_AVANCE);
    const [addDoublage] = useMutation(ADD_DOUBLAGE);
    const [deleteDoublage] = useMutation(DELETE_DOUBLAGE);
    const [addExtra] = useMutation(ADD_EXTRA);
    const [deleteExtra] = useMutation(DELETE_EXTRA);
    const [addPrime] = useMutation(ADD_PRIME);
    const [deletePrime] = useMutation(DELETE_PRIME);

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
        invoiceId?: number,
        doc_type?: string,
        doc_number?: string
    }[]>([
        { supplier: '', amount: '0', details: '', invoices: [], photo_cheque: '', photo_verso: '', paymentMethod: 'Espèces', doc_type: 'BL' }
    ]);
    const [expensesDivers, setExpensesDivers] = useState<{
        designation: string,
        amount: string,
        details: string,
        invoices: string[],
        paymentMethod: string,
        doc_type?: string
    }[]>([
        { designation: '', amount: '0', details: '', invoices: [], paymentMethod: 'Espèces', doc_type: 'BL' }
    ]);
    const [expensesJournalier, setExpensesJournalier] = useState<{
        designation: string,
        amount: string,
        details: string,
        invoices: string[],
        paymentMethod: string,
        doc_type?: string
    }[]>([
        { designation: '', amount: '0', details: '', invoices: [], paymentMethod: 'Espèces', doc_type: 'BL' }
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

    // Bey Details (Now Local)
    const [avancesList, setAvancesList] = useState<{ id?: number, username: string, montant: string }[]>([]);
    const [doublagesList, setDoublagesList] = useState<{ id?: number, username: string, montant: string }[]>([]);
    const [extrasList, setExtrasList] = useState<{ id?: number, username: string, montant: string }[]>([]);
    const [primesList, setPrimesList] = useState<{ id?: number, username: string, montant: string }[]>([]);

    // UI States
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [showConfirm, setShowConfirm] = useState<any>(null);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [designationSearch, setDesignationSearch] = useState('');
    const [showSupplierDropdown, setShowSupplierDropdown] = useState<number | null>(null);
    const [showJournalierDropdown, setShowJournalierDropdown] = useState<number | null>(null);
    const [showDiversDropdown, setShowDiversDropdown] = useState<number | null>(null);
    const [showEntryModal, setShowEntryModal] = useState<any>(null); // { type: 'avance' | 'doublage' | 'extra' | 'prime', data: any }
    const [showEmployeeList, setShowEmployeeList] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState<any>(null); // { type: 'avance' | 'doublage' | 'extra' | 'prime' }
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [employeeDepartment, setEmployeeDepartment] = useState('');
    const [viewingInvoices, setViewingInvoices] = useState<string[] | null>(null);
    const [viewingInvoicesTarget, setViewingInvoicesTarget] = useState<{ index: number, type: 'expense' | 'divers' | 'journalier' } | null>(null);
    const [imgZoom, setImgZoom] = useState(1);
    const [imgRotation, setImgRotation] = useState(0);

    const resetView = () => {
        setImgZoom(1);
        setImgRotation(0);
    };

    useEffect(() => {
        if (!viewingInvoices) resetView();
    }, [viewingInvoices]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showJournalierModal, setShowJournalierModal] = useState(false);
    const [showDiversModal, setShowDiversModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [hideRecetteCaisse, setHideRecetteCaisse] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

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
            setIsLocked(c.is_locked || false);
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
            setIsLocked(false);
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

    const handleAddExpense = () => {
        if (isLocked) {
            setShowConfirm({
                type: 'alert',
                title: 'INTERDIT',
                message: 'Cette date est verrouillée. Impossible d’ajouter des dépenses.',
                color: 'red',
                alert: true
            });
            return;
        }
        setHasInteracted(true);
        setExpenses([...expenses, { supplier: '', amount: '0', details: '', invoices: [], photo_cheque: '', photo_verso: '', paymentMethod: 'Espèces', doc_type: 'BL' }]);
    };
    const handleAddDivers = (designation?: string) => {
        if (isLocked) {
            setShowConfirm({
                type: 'alert',
                title: 'INTERDIT',
                message: 'Cette date est verrouillée. Impossible d’ajouter des dépenses.',
                color: 'red',
                alert: true
            });
            return;
        }
        setHasInteracted(true);
        setExpensesDivers([...expensesDivers, { designation: designation || '', amount: '0', details: '', invoices: [], paymentMethod: 'Espèces', doc_type: 'BL' }]);
    };
    const handleAddJournalier = (designation?: string) => {
        if (isLocked) {
            setShowConfirm({
                type: 'alert',
                title: 'INTERDIT',
                message: 'Cette date est verrouillée. Impossible d’ajouter des dépenses.',
                color: 'red',
                alert: true
            });
            return;
        }
        setHasInteracted(true);
        setExpensesJournalier([...expensesJournalier, { designation: designation || '', amount: '0', details: '', invoices: [], paymentMethod: 'Espèces', doc_type: 'PHOTO' }]);
    };

    const handleEntrySubmit = async (type: string, username: string, amount: string) => {
        if (isLocked) return;
        try {
            // New employees are now added only via the dedicated "Ajouter Employé" button
            // So we don't upsert here anymore to maintain a clean directory

            if (type === 'avance') await addAvance({ variables: { username, amount, date } });
            if (type === 'doublage') await addDoublage({ variables: { username, amount, date } });
            if (type === 'extra') await addExtra({ variables: { username, amount, date } });
            if (type === 'prime') await addPrime({ variables: { username, amount, date } });

            refetchChiffre();
            setToast({ msg: 'Ajouté avec succès', type: 'success' });
            setTimeout(() => setToast(null), 3000);
        } catch (e) {
            console.error(e);
            setToast({ msg: 'Erreur lors de l’ajout', type: 'error' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleDeleteEntry = async (type: string, id: number) => {
        if (isLocked) {
            setShowConfirm({
                type: 'alert',
                title: 'INTERDIT',
                message: 'Cette date est verrouillée. Impossible de supprimer.',
                color: 'red',
                alert: true
            });
            return;
        }

        setShowConfirm({
            type: 'delete',
            title: 'Supprimer',
            message: 'Voulez-vous vraiment supprimer cet élément ?',
            color: 'red',
            onConfirm: async () => {
                try {
                    if (type === 'avance') await deleteAvance({ variables: { id } });
                    if (type === 'doublage') await deleteDoublage({ variables: { id } });
                    if (type === 'extra') await deleteExtra({ variables: { id } });
                    if (type === 'prime') await deletePrime({ variables: { id } });

                    refetchChiffre();
                    setToast({ msg: 'Supprimé avec succès', type: 'success' });
                    setTimeout(() => setToast(null), 3000);
                } catch (e) {
                    console.error(e);
                }
            }
        });
    };
    const handleRemoveExpense = (index: number) => {
        if (isLocked) {
            setShowConfirm({
                type: 'alert',
                title: 'INTERDIT',
                message: 'Cette date est verrouillée. Impossible de supprimer cette dépense.',
                color: 'red',
                alert: true
            });
            return;
        }

        const expense = expenses[index];
        if (expense.isFromFacturation && expense.invoiceId) {
            setShowConfirm({
                type: 'unpay',
                title: 'Annuler Payement',
                message: `Cette dépense provient d'une facture. Voulez-vous vraiment l'enlever ? Elle redeviendra "Impayée" dans la facturation.`,
                color: 'red',
                onConfirm: async () => {
                    try {
                        await unpayInvoice({ variables: { id: expense.invoiceId } });
                        setHasInteracted(true);
                        setExpenses(expenses.filter((_, i) => i !== index));
                    } catch (e) {
                        console.error(e);
                    }
                }
            });
        } else {
            setHasInteracted(true);
            setExpenses(expenses.filter((_, i) => i !== index));
        }
    };
    const handleRemoveDivers = (index: number) => {
        if (isLocked) {
            setShowConfirm({
                type: 'alert',
                title: 'INTERDIT',
                message: 'Cette date est verrouillée. Impossible de supprimer cette dépense.',
                color: 'red',
                alert: true
            });
            return;
        }
        setHasInteracted(true);
        setExpensesDivers(expensesDivers.filter((_, i) => i !== index));
    };
    const handleRemoveJournalier = (index: number) => {
        if (isLocked) {
            setShowConfirm({
                type: 'alert',
                title: 'INTERDIT',
                message: 'Cette date est verrouillée. Impossible de supprimer cette dépense.',
                color: 'red',
                alert: true
            });
            return;
        }
        setHasInteracted(true);
        setExpensesJournalier(expensesJournalier.filter((_, i) => i !== index));
    };

    const handleShareInvoice = async (img: string) => {
        try {
            const response = await fetch(img);
            const blob = await response.blob();
            const file = new File([blob], 'recu.png', { type: blob.type });

            // 1. Try Native Share (Best for Mobile: WhatsApp, FB, etc.)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Reçu Riadh Bey',
                    text: 'Voici un reçu de la caisse Riadh Bey'
                });
                return;
            }

            // 2. Try Clipboard Copy (Best for Desktop: allows Ctrl+V into WhatsApp/FB)
            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    const data = [new ClipboardItem({ [blob.type]: blob })];
                    await navigator.clipboard.write(data);
                    setToast({ msg: '📸 Image copiée ! Collez-la (Ctrl+V) dans WhatsApp/FB', type: 'success' });
                    setTimeout(() => setToast(null), 3000);
                    return;
                } catch (err) {
                    console.warn('Clipboard write failed', err);
                }
            }

            // 3. Fallback: Download
            const link = document.createElement('a');
            link.href = img;
            link.download = 'recu.png';
            link.click();
            setToast({ msg: 'Téléchargement lancé', type: 'success' });
            setTimeout(() => setToast(null), 3000);
        } catch (e) {
            console.error('Share failed', e);
            setToast({ msg: 'Échec du partage', type: 'error' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleDeleteInvoice = (idx: number) => {
        if (!viewingInvoicesTarget || !viewingInvoices) return;
        const newInvoices = [...viewingInvoices];
        newInvoices.splice(idx, 1);

        if (viewingInvoicesTarget.type === 'journalier') {
            const list = [...expensesJournalier];
            list[viewingInvoicesTarget.index].invoices = newInvoices;
            setExpensesJournalier(list);
        } else if (viewingInvoicesTarget.type === 'divers') {
            const list = [...expensesDivers];
            list[viewingInvoicesTarget.index].invoices = newInvoices;
            setExpensesDivers(list);
        } else {
            const list = [...expenses];
            list[viewingInvoicesTarget.index].invoices = newInvoices;
            setExpenses(list);
        }
        setViewingInvoices(newInvoices.length > 0 ? newInvoices : null);
        if (newInvoices.length === 0) setViewingInvoicesTarget(null);
    };

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
        if (isLocked) {
            setShowConfirm({
                type: 'alert',
                title: 'INTERDIT',
                message: 'Cette session est verrouillée. Impossible de modifier les données.',
                color: 'red',
                alert: true
            });
            return;
        }
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
        const parts = date.split('-');
        const curr = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        curr.setMonth(curr.getMonth() + delta);

        const y = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, '0');
        const dd = String(curr.getDate()).padStart(2, '0');
        setDate(`${y}-${mm}-${dd}`);
    };

    const shiftDate = (daysCount: number) => {
        const parts = date.split('-');
        const current = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        current.setDate(current.getDate() + daysCount);

        const y = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        const newDateStr = `${y}-${mm}-${dd}`;
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const getDepartment = (name: string) => {
        if (!employeesData?.getEmployees) return null;
        const emp = employeesData.getEmployees.find((e: any) => e.name.toLowerCase() === name.toLowerCase());
        return emp?.department;
    };

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
                                    className={`p-2 rounded-full hover:bg-[#ebdccf] text-[#8c8279] hover:text-[#4a3426] transition-all ${role !== 'admin' && (() => {
                                        const now = new Date();
                                        const ty = now.getFullYear();
                                        const tm = String(now.getMonth() + 1).padStart(2, '0');
                                        const td = String(now.getDate()).padStart(2, '0');
                                        return date >= `${ty}-${tm}-${td}`;
                                    })() ? 'opacity-0 pointer-events-none w-0 p-0 overflow-hidden' : ''}`}
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
                                    <div className="flex items-center justify-center md:justify-start gap-3">
                                        <div className="text-[#2d6a4f] text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-40">Session du</div>
                                        {isLocked && (
                                            <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-black uppercase tracking-widest">
                                                <LockIcon size={12} /> Verrouillée
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-3xl md:text-4xl lg:text-5xl font-black text-[#2d6a4f] leading-none tracking-tighter flex items-center gap-4">
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
                                            <button
                                                onClick={() => setHideRecetteCaisse(!hideRecetteCaisse)}
                                                className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors text-[#bba282]"
                                            >
                                                {hideRecetteCaisse ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                        {hideRecetteCaisse ? (
                                            <div className="text-6xl md:text-7xl lg:text-8xl font-black text-[#4a3426] py-1">
                                                ********
                                            </div>
                                        ) : (
                                            <div
                                                className="flex items-baseline justify-center md:justify-end gap-3"
                                                onClick={() => {
                                                    if (isLocked) {
                                                        setShowConfirm({
                                                            type: 'alert',
                                                            title: 'INTERDIT',
                                                            message: 'Cette date est verrouillée. Impossible de modifier la recette.',
                                                            color: 'red',
                                                            alert: true
                                                        });
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="number"
                                                    value={recetteCaisse}
                                                    disabled={isLocked}
                                                    onWheel={(e) => e.currentTarget.blur()}
                                                    onChange={(e) => { setRecetteCaisse(e.target.value); setHasInteracted(true); }}
                                                    className={`text-6xl md:text-7xl lg:text-8xl font-black bg-transparent text-[#4a3426] outline-none placeholder-[#e6dace] text-center md:text-right w-full md:w-auto min-w-[150px] ${isLocked ? 'cursor-not-allowed opacity-50 pointer-events-none' : ''}`}
                                                    placeholder="0"
                                                />
                                                <span className="text-xl md:text-2xl lg:text-3xl font-black text-[#c69f6e] shrink-0">DT</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 1. Dépenses Journalier */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3
                                    className="text-lg font-bold text-[#4a3426] flex items-center gap-2 cursor-pointer group/title"
                                    onClick={() => setShowHistoryModal({ type: 'journalier' })}
                                >
                                    <div className="bg-[#4a3426] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs group-hover/title:bg-[#c69f6e] transition-colors">1</div>
                                    <span className="group-hover/title:text-[#c69f6e] transition-colors">Dépenses Journalier</span>
                                </h3>
                                <button
                                    onClick={() => {
                                        if (isLocked) {
                                            setShowConfirm({
                                                type: 'alert',
                                                title: 'INTERDIT',
                                                message: 'Cette date est verrouillée. Impossible d’ajouter des dépenses.',
                                                color: 'red',
                                                alert: true
                                            });
                                            return;
                                        }
                                        setShowJournalierModal(true);
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e6dace] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#c69f6e] hover:bg-[#fcfaf8] transition-all`}
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
                                                <div
                                                    className="w-full md:w-32 relative"
                                                    onClick={() => {
                                                        if (isLocked) {
                                                            setShowConfirm({
                                                                type: 'alert',
                                                                title: 'INTERDIT',
                                                                message: 'Cette date est verrouillée. Impossible de modifier cette dépense.',
                                                                color: 'red',
                                                                alert: true
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={journalier.amount}
                                                        disabled={isLocked}
                                                        onWheel={(e) => e.currentTarget.blur()}
                                                        onChange={(e) => handleJournalierChange(index, 'amount', e.target.value)}
                                                        className={`w-full bg-white border border-[#e6dace] rounded-xl h-12 px-3 font-black text-xl outline-none focus:border-[#c69f6e] text-center ${isLocked ? 'cursor-not-allowed opacity-50 pointer-events-none' : ''}`}
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bba282] text-xs font-black">DT</span>
                                                </div>

                                                <div
                                                    className="flex-1 w-full relative"
                                                    onClick={(e) => {
                                                        if (isLocked) {
                                                            const target = e.target as HTMLElement;
                                                            if (!target.closest('.doc-type-toggle')) {
                                                                setShowConfirm({
                                                                    type: 'alert',
                                                                    title: 'INTERDIT',
                                                                    message: 'Cette date est verrouillée. Impossible de modifier cette dépense.',
                                                                    color: 'red',
                                                                    alert: true
                                                                });
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <Search className="text-[#bba282] cursor-pointer hover:text-[#c69f6e] transition-colors" size={16} onClick={() => journalier.designation && setShowHistoryModal({ type: "journalier", targetName: journalier.designation })} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Désignation Journalière..."
                                                        value={journalier.designation}
                                                        disabled={isLocked}
                                                        onFocus={() => {
                                                            setShowJournalierDropdown(index);
                                                            setDesignationSearch(journalier.designation);
                                                        }}
                                                        onBlur={() => setTimeout(() => setShowJournalierDropdown(null), 200)}
                                                        onChange={(e) => {
                                                            handleJournalierChange(index, 'designation', e.target.value);
                                                            setDesignationSearch(e.target.value);
                                                        }}
                                                        className={`w-full bg-white border border-[#e6dace] rounded-xl h-12 pl-12 pr-10 focus:border-[#c69f6e] outline-none font-medium transition-all ${isLocked ? 'cursor-not-allowed opacity-50 pointer-events-none' : ''}`}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (isLocked) {
                                                                setShowConfirm({
                                                                    type: 'alert',
                                                                    title: 'INTERDIT',
                                                                    message: 'Cette date est verrouillée. Impossible de modifier ce document.',
                                                                    color: 'red',
                                                                    alert: true
                                                                });
                                                                return;
                                                            }
                                                            setShowJournalierDropdown(showJournalierDropdown === index ? null : index);
                                                        }}
                                                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-[#bba282] hover:text-[#c69f6e] transition-colors`}
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
                                                            {commonDesignations.filter((d: string) => d.toLowerCase().includes(designationSearch.toLowerCase())).length === 0 && designationSearch && (
                                                                <div className="p-4 text-center text-[#bba282] text-xs italic">
                                                                    Aucune désignation trouvée
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setModalDetailsTarget({ index, type: 'journalier' });
                                                        setTempDetails(journalier.details || '');
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className={`h-12 w-32 rounded-xl border flex items-center justify-center gap-2 transition-all ${journalier.details ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : 'bg-[#fcfaf8] text-[#bba282] border-[#e6dace] hover:border-[#c69f6e] hover:text-[#c69f6e]'} ${isLocked && !journalier.details ? 'cursor-not-allowed opacity-50' : ''}`}
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
                                                            } else if (isLocked) {
                                                                setShowConfirm({
                                                                    type: 'alert',
                                                                    title: 'INTERDIT',
                                                                    message: 'Cette date est verrouillée. Impossible d\'ajouter des photos.',
                                                                    color: 'red',
                                                                    alert: true
                                                                });
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className={`h-12 w-24 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-colors relative whitespace-nowrap text-[10px] ${journalier.invoices.length > 0 ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : 'border-dashed border-[#bba282] text-[#bba282] hover:bg-[#f9f6f2]'} ${isLocked && journalier.invoices.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <UploadCloud size={14} />
                                                        <span className="font-black uppercase tracking-widest">
                                                            PHOTO {journalier.invoices.length > 0 ? `(${journalier.invoices.length})` : ''}
                                                        </span>
                                                        <input type="file" multiple disabled={isLocked} className="hidden" onChange={(e) => handleFileUpload(index, e, 'invoice', 'journalier' as any)} />
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
                                <button
                                    onClick={() => handleAddJournalier()}
                                    disabled={isLocked}
                                    className={`mt-4 w-full py-3 border-2 border-dashed border-[#e6dace] rounded-xl text-[#bba282] font-bold flex items-center justify-center gap-2 hover:border-[#c69f6e] hover:text-[#c69f6e] transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Plus size={18} /> Nouvelle Ligne (Journalier)
                                </button>
                                <div
                                    className="mt-4 p-4 bg-[#fcfaf8] rounded-2xl flex justify-between items-center border border-[#e6dace]/50 cursor-pointer hover:bg-[#f9f6f2] transition-colors"
                                    onClick={() => setShowHistoryModal({ type: 'journalier' })}
                                >
                                    <span className="text-xs font-black text-[#8c8279] uppercase tracking-widest">Total Dépenses Journalier</span>
                                    <span className="text-2xl font-black text-[#4a3426]">{totalExpensesJournalier.toFixed(3)} <span className="text-sm">DT</span></span>
                                </div>
                            </section>
                        </div>

                        {/* 2. Dépenses Fournisseur */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3
                                    className="text-lg font-bold text-[#4a3426] flex items-center gap-2 cursor-pointer group/title"
                                    onClick={() => setShowHistoryModal({ type: 'supplier' })}
                                >
                                    <div className="bg-[#4a3426] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs group-hover/title:bg-[#c69f6e] transition-colors">2</div>
                                    <span className="group-hover/title:text-[#c69f6e] transition-colors">Dépenses Fournisseur</span>
                                </h3>
                                <button
                                    onClick={() => {
                                        if (isLocked) return;
                                        setNewSupplierName('');
                                        setShowSupplierModal(true);
                                    }}
                                    className={`flex items-center gap-2 px-6 py-2 bg-white border border-[#e6dace] rounded-full text-[11px] font-bold uppercase tracking-widest text-[#c69f6e] shadow-sm hover:shadow-md hover:bg-[#fcfaf8] transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Plus size={14} />
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
                                                        disabled={expense.isFromFacturation || isLocked}
                                                        value={expense.amount}
                                                        onWheel={(e) => e.currentTarget.blur()}
                                                        onChange={(e) => handleDetailChange(index, 'amount', e.target.value)}
                                                        className={`w-full bg-white border border-[#e6dace] rounded-xl h-12 px-3 font-black text-xl outline-none focus:border-[#c69f6e] text-center ${(expense.isFromFacturation || isLocked) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bba282] text-xs font-black">DT</span>
                                                </div>

                                                <div className="flex-1 w-full relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <Search className="text-[#bba282] cursor-pointer hover:text-[#c69f6e] transition-colors" size={16} onClick={() => expense.supplier && setShowHistoryModal({ type: "supplier", targetName: expense.supplier })} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Fournisseur..."
                                                        value={expense.supplier}
                                                        disabled={expense.isFromFacturation || isLocked}
                                                        onFocus={() => {
                                                            if (!expense.isFromFacturation) {
                                                                setShowSupplierDropdown(index);
                                                                setSupplierSearch(expense.supplier);
                                                                setLastFocusedValue(expense.supplier);
                                                            }
                                                        }}
                                                        onBlur={() => setTimeout(() => setShowSupplierDropdown(null), 200)}
                                                        onChange={(e) => { handleDetailChange(index, 'supplier', e.target.value); setSupplierSearch(e.target.value); }}
                                                        className={`w-full bg-white border border-[#e6dace] rounded-xl h-12 pl-12 pr-10 focus:border-[#c69f6e] outline-none font-medium transition-all ${(expense.isFromFacturation || isLocked) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    />
                                                    {!expense.isFromFacturation && (
                                                        <button
                                                            onClick={() => {
                                                                if (isLocked) return;
                                                                setShowSupplierDropdown(showSupplierDropdown === index ? null : index);
                                                            }}
                                                            className={`absolute right-3 top-1/2 -translate-y-1/2 text-[#bba282] hover:text-[#c69f6e] transition-colors ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
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
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setModalDetailsTarget({ index, type: 'expense' });
                                                        setTempDetails(expense.details || '');
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className={`h-12 w-32 rounded-xl border flex items-center justify-center gap-2 transition-all ${expense.details ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : 'bg-[#fcfaf8] text-[#bba282] border-[#e6dace] hover:border-[#c69f6e] hover:text-[#c69f6e]'} ${isLocked && !expense.details ? 'cursor-not-allowed opacity-50' : ''}`}
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
                                                            } else if (isLocked) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className={`h-12 w-24 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-colors relative whitespace-nowrap text-[10px] ${expense.invoices.length > 0 ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : (expense.isFromFacturation ? 'border-dashed border-red-600 text-red-600 bg-red-50' : 'border-dashed border-[#bba282] text-[#bba282] hover:bg-[#f9f6f2]')} ${isLocked && expense.invoices.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                                                    >
                                                        <UploadCloud size={14} />
                                                        <span className="font-black uppercase tracking-widest">
                                                            PHOTO {expense.invoices.length > 0 ? `(${expense.invoices.length})` : ''}
                                                        </span>
                                                        {!expense.isFromFacturation && <input type="file" multiple disabled={isLocked} className="hidden" onChange={(e) => handleFileUpload(index, e, 'invoice')} />}
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
                                                                    {!expense.isFromFacturation && <input type="file" disabled={isLocked} className="hidden" onChange={(e) => handleFileUpload(index, e, 'recto')} />}
                                                                </label>
                                                                <label
                                                                    onClick={(e) => {
                                                                        if (expense.photo_verso) {
                                                                            setViewingInvoices([expense.photo_verso]);
                                                                            e.preventDefault();
                                                                        }
                                                                        if (isLocked) e.preventDefault();
                                                                    }}
                                                                    className={`h-12 w-20 rounded-xl border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-colors relative whitespace-nowrap text-[10px] ${expense.photo_verso ? 'border-[#c69f6e] text-[#c69f6e] bg-[#c69f6e]/5' : 'border-red-200 text-red-300 hover:bg-red-50'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <UploadCloud size={14} />
                                                                    <span className="font-black uppercase tracking-widest">{expense.photo_verso ? 'Verso OK' : 'Verso'}</span>
                                                                    {!expense.isFromFacturation && <input type="file" disabled={isLocked} className="hidden" onChange={(e) => handleFileUpload(index, e, 'verso')} />}
                                                                </label>
                                                            </>
                                                        )}

                                                        <div className="w-12 flex justify-center">
                                                            {(!isLocked || role === 'admin') && (
                                                                <button
                                                                    onClick={() => handleRemoveExpense(index)}
                                                                    className="h-12 w-12 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                                >
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
                                <button
                                    onClick={handleAddExpense}
                                    disabled={isLocked}
                                    className={`mt-4 w-full py-3 border-2 border-dashed border-[#e6dace] rounded-xl text-[#bba282] font-bold flex items-center justify-center gap-2 hover:border-[#c69f6e] hover:text-[#c69f6e] transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Plus size={18} /> Nouvelle Ligne
                                </button>
                                <div
                                    className="mt-4 p-4 bg-[#fcfaf8] rounded-2xl flex justify-between items-center border border-[#e6dace]/50 cursor-pointer hover:bg-[#f9f6f2] transition-colors"
                                    onClick={() => setShowHistoryModal({ type: 'supplier' })}
                                >
                                    <span className="text-xs font-black text-[#8c8279] uppercase tracking-widest">Total Dépenses Fournisseur</span>
                                    <span className="text-2xl font-black text-[#4a3426]">{totalExpensesDynamic.toFixed(3)} <span className="text-sm">DT</span></span>
                                </div>
                            </section>
                        </div>

                        {/* 3. Dépenses Divers */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3
                                    className="text-lg font-bold text-[#4a3426] flex items-center gap-2 cursor-pointer group/title"
                                    onClick={() => setShowHistoryModal({ type: 'divers' })}
                                >
                                    <div className="bg-[#4a3426] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs group-hover/title:bg-[#c69f6e] transition-colors">3</div>
                                    <span className="group-hover/title:text-[#c69f6e] transition-colors">Dépenses divers</span>
                                </h3>
                                <button
                                    onClick={() => {
                                        if (isLocked) return;
                                        setShowDiversModal(true);
                                    }}
                                    className={`flex items-center gap-2 px-6 py-2 bg-white border border-[#e6dace] rounded-full text-[11px] font-bold uppercase tracking-widest text-[#c69f6e] shadow-sm hover:shadow-md hover:bg-[#fcfaf8] transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Plus size={14} />
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
                                                        disabled={isLocked}
                                                        onWheel={(e) => e.currentTarget.blur()}
                                                        onChange={(e) => handleDiversChange(index, 'amount', e.target.value)}
                                                        className={`w-full bg-white border border-[#e6dace] rounded-xl h-12 px-3 font-black text-xl outline-none focus:border-[#c69f6e] text-center ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bba282] text-xs font-black">DT</span>
                                                </div>

                                                <div className="flex-1 w-full relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <Search className="text-[#bba282] cursor-pointer hover:text-[#c69f6e] transition-colors" size={16} onClick={() => divers.designation && setShowHistoryModal({ type: "divers", targetName: divers.designation })} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Désignation Divers..."
                                                        value={divers.designation}
                                                        disabled={isLocked}
                                                        onFocus={() => {
                                                            setShowDiversDropdown(index);
                                                            setDesignationSearch(divers.designation);
                                                        }}
                                                        onBlur={() => setTimeout(() => setShowDiversDropdown(null), 200)}
                                                        onChange={(e) => {
                                                            handleDiversChange(index, 'designation', e.target.value);
                                                            setDesignationSearch(e.target.value);
                                                        }}
                                                        className={`w-full bg-white border border-[#e6dace] rounded-xl h-12 pl-12 pr-10 focus:border-[#c69f6e] outline-none font-medium transition-all ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (isLocked) return;
                                                            setShowDiversDropdown(showDiversDropdown === index ? null : index);
                                                        }}
                                                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-[#bba282] hover:text-[#c69f6e] transition-colors ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
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
                                                            {commonDesignations.filter((d: string) => d.toLowerCase().includes(designationSearch.toLowerCase())).length === 0 && designationSearch && (
                                                                <div className="p-4 text-center text-[#bba282] text-xs italic">
                                                                    Aucune désignation trouvée
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setModalDetailsTarget({ index, type: 'divers' });
                                                        setTempDetails(divers.details || '');
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className={`h-12 w-32 rounded-xl border flex items-center justify-center gap-2 transition-all ${divers.details ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : 'bg-[#fcfaf8] text-[#bba282] border-[#e6dace] hover:border-[#c69f6e] hover:text-[#c69f6e]'} ${isLocked && !divers.details ? 'cursor-not-allowed opacity-50' : ''}`}
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
                                                            } else if (isLocked) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className={`h-12 w-24 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-colors relative whitespace-nowrap text-[10px] ${divers.invoices.length > 0 ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : 'border-dashed border-[#bba282] text-[#bba282] hover:bg-[#f9f6f2]'} ${isLocked && divers.invoices.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                        <UploadCloud size={14} />
                                                        <span className="font-black uppercase tracking-widest">
                                                            PHOTO {divers.invoices.length > 0 ? `(${divers.invoices.length})` : ''}
                                                        </span>
                                                        <input type="file" multiple disabled={isLocked} className="hidden" onChange={(e) => handleFileUpload(index, e, 'invoice', true)} />
                                                    </label>
                                                    <div className="w-12 flex justify-center">
                                                        {(!isLocked || role === 'admin') && (index > 0 || expensesDivers.length > 1) && (
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
                                <button
                                    onClick={() => handleAddDivers()}
                                    disabled={isLocked}
                                    className={`mt-4 w-full py-3 border-2 border-dashed border-[#e6dace] rounded-xl text-[#bba282] font-bold flex items-center justify-center gap-2 hover:border-[#c69f6e] hover:text-[#c69f6e] transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Plus size={18} /> Nouvelle Ligne (Divers)
                                </button>
                                <div
                                    className="mt-4 p-4 bg-[#fcfaf8] rounded-2xl flex justify-between items-center border border-[#e6dace]/50 cursor-pointer hover:bg-[#f9f6f2] transition-colors"
                                    onClick={() => setShowHistoryModal({ type: 'divers' })}
                                >
                                    <span className="text-xs font-black text-[#8c8279] uppercase tracking-widest">Total Dépenses Divers</span>
                                    <span className="text-2xl font-black text-[#4a3426]">{totalExpensesDivers.toFixed(3)} <span className="text-sm">DT</span></span>
                                </div>
                            </section>
                        </div>

                        {/* 3. Fixes Grid */}
                        {/* 4. Dépenses Administratif */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3
                                    className="text-lg font-bold text-[#4a3426] flex items-center gap-2 cursor-pointer group/title"
                                    onClick={() => setShowHistoryModal({ type: 'admin' })}
                                >
                                    <div className="bg-[#4a3426] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs group-hover/title:bg-[#c69f6e] transition-colors">4</div>
                                    <span className="group-hover/title:text-[#c69f6e] transition-colors">Dépenses Administratif</span>
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
                                                        disabled={isLocked}
                                                        onWheel={(e) => e.currentTarget.blur()}
                                                        onChange={(e) => handleAdminChange(index, 'amount', e.target.value)}
                                                        className={`w-full bg-white border border-[#e6dace] rounded-xl h-12 px-3 font-black text-xl outline-none focus:border-[#c69f6e] text-center ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bba282] text-xs font-black">DT</span>
                                                </div>

                                                <div className="flex-1 w-full relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <Users
                                                            className="text-[#bba282] cursor-pointer hover:text-[#c69f6e] transition-colors"
                                                            size={16}
                                                            onClick={() => admin.designation && setShowHistoryModal({ type: 'admin', targetName: admin.designation })}
                                                        />
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
                                <div
                                    className="mt-4 p-4 bg-[#fcfaf8] rounded-2xl flex justify-between items-center border border-[#e6dace]/50 cursor-pointer hover:bg-[#f9f6f2] transition-colors"
                                    onClick={() => setShowHistoryModal({ type: 'admin' })}
                                >
                                    <span className="text-xs font-black text-[#8c8279] uppercase tracking-widest">Total Dépenses Administratif</span>
                                    <span className="text-2xl font-black text-[#4a3426]">{totalExpensesAdmin.toFixed(3)} <span className="text-sm">DT</span></span>
                                </div>
                            </section>
                        </div>
                        {/* Employee Related Actions Section */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[#4a3426] flex items-center gap-2">
                                <div className="bg-[#4a3426] text-white w-8 h-8 rounded-full flex items-center justify-center text-xs">3</div>
                                Personnels
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowEmployeeList(true)}
                                    className="flex items-center gap-2 px-6 py-2 bg-white border border-[#e6dace] rounded-full text-[11px] font-bold uppercase tracking-widest text-[#8c8279] shadow-sm hover:shadow-md hover:bg-[#fcfaf8] transition-all"
                                >
                                    <List size={14} />
                                    Liste
                                </button>
                                <button
                                    onClick={() => {
                                        if (isLocked) return;
                                        setEmployeeSearch('');
                                        setShowEmployeeModal(true);
                                    }}
                                    className={`flex items-center gap-2 px-6 py-2 bg-white border border-[#e6dace] rounded-full text-[11px] font-bold uppercase tracking-widest text-[#c69f6e] shadow-sm hover:shadow-md hover:bg-[#fcfaf8] transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Plus size={14} />
                                    Ajouter Employé
                                </button>
                            </div>
                        </div>

                        {/* 3. Fixes Grid (2x2) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 2.2 Accompte */}
                            <div className="bg-white rounded-[2rem] p-6 luxury-shadow relative overflow-hidden border border-[#e6dace]/50">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="cursor-pointer group/title"
                                            onClick={() => setShowHistoryModal({ type: 'avance' })}
                                        >
                                            <h4 className="font-bold text-[#4a3426] text-xs uppercase tracking-wider group-hover/title:text-[#c69f6e] transition-colors">ACCOMPTE</h4>
                                            <p className="text-[9px] font-bold text-[#8c8279] uppercase tracking-tighter opacity-70">Avances sur salaires</p>
                                        </div>
                                        <button
                                            disabled={isLocked}
                                            onClick={() => setShowEntryModal({ type: 'avance' })}
                                            className="text-[#c69f6e] hover:scale-110 transition-transform disabled:opacity-30"
                                        >
                                            <PlusCircle size={22} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                    <span
                                        className="bg-[#f4ece4] text-[#4a3426] px-4 py-2 rounded-2xl font-black text-xl cursor-pointer hover:bg-[#e6dace] transition-colors"
                                        onClick={() => setShowHistoryModal({ type: 'avance' })}
                                    >
                                        {acompte.toFixed(3)} <span className="text-xs">DT</span>
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm text-[#4a3426] max-h-48 overflow-y-auto custom-scrollbar">
                                    {avancesList.length > 0 ? avancesList.map((a, i) => (
                                        <div key={i} className="flex justify-between p-3 bg-[#f9f6f2] rounded-2xl items-center group">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="font-bold text-[#4a3426] cursor-pointer hover:text-[#c69f6e] transition-colors"
                                                    onClick={() => setShowHistoryModal({ type: 'avance', targetName: a.username })}
                                                >
                                                    {a.username}
                                                </span>
                                                {getDepartment(a.username) && (
                                                    <span className="text-[10px] font-black text-[#8c8279] uppercase tracking-wider bg-[#f4ece4] px-2 py-0.5 rounded-lg border border-[#e6dace]/50">
                                                        {getDepartment(a.username)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <b className="font-black text-[#4a3426]">{parseFloat(a.montant).toFixed(3)}</b>
                                                {!isLocked && (
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => setShowEntryModal({ type: 'avance', data: a })}
                                                            className="text-[#c69f6e] hover:text-[#4a3426] transition-colors"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => a.id && handleDeleteEntry('avance', a.id)}
                                                            className="text-red-300 hover:text-red-500 transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center py-4 text-[#8c8279] italic opacity-50">Aucune avance</p>
                                    )}
                                </div>
                            </div>

                            {/* 2.3 Doublage */}
                            <div className="bg-white rounded-[2rem] p-6 luxury-shadow relative overflow-hidden border border-[#e6dace]/50">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="cursor-pointer group/title"
                                            onClick={() => setShowHistoryModal({ type: 'doublage' })}
                                        >
                                            <h4 className="font-bold text-[#4a3426] text-xs uppercase tracking-wider group-hover/title:text-[#c69f6e] transition-colors">DOUBLAGE</h4>
                                            <p className="text-[9px] font-bold text-[#8c8279] uppercase tracking-tighter opacity-70">Heures supplémentaires</p>
                                        </div>
                                        <button
                                            disabled={isLocked}
                                            onClick={() => setShowEntryModal({ type: 'doublage' })}
                                            className="text-[#c69f6e] hover:scale-110 transition-transform disabled:opacity-30"
                                        >
                                            <PlusCircle size={22} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                    <span
                                        className="bg-[#f4ece4] text-[#4a3426] px-4 py-2 rounded-2xl font-black text-xl cursor-pointer hover:bg-[#e6dace] transition-colors"
                                        onClick={() => setShowHistoryModal({ type: 'doublage' })}
                                    >
                                        {doublage.toFixed(3)} <span className="text-xs">DT</span>
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm text-[#4a3426] max-h-48 overflow-y-auto custom-scrollbar">
                                    {doublagesList.length > 0 ? doublagesList.map((a, i) => (
                                        <div key={i} className="flex justify-between p-3 bg-[#f9f6f2] rounded-2xl items-center group">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="font-bold text-[#4a3426] cursor-pointer hover:text-[#c69f6e] transition-colors"
                                                    onClick={() => setShowHistoryModal({ type: 'doublage', targetName: a.username })}
                                                >
                                                    {a.username}
                                                </span>
                                                {getDepartment(a.username) && (
                                                    <span className="text-[10px] font-black text-[#8c8279] uppercase tracking-wider bg-[#f4ece4] px-2 py-0.5 rounded-lg border border-[#e6dace]/50">
                                                        {getDepartment(a.username)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <b className="font-black text-[#4a3426]">{parseFloat(a.montant).toFixed(3)}</b>
                                                {!isLocked && (
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => setShowEntryModal({ type: 'doublage', data: a })}
                                                            className="text-[#c69f6e] hover:text-[#4a3426] transition-colors"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => a.id && handleDeleteEntry('doublage', a.id)}
                                                            className="text-red-300 hover:text-red-500 transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center py-4 text-[#8c8279] italic opacity-50">Aucun doublage</p>
                                    )}
                                </div>
                            </div>

                            {/* 2.4 Extra */}
                            <div className="bg-white rounded-[2rem] p-6 luxury-shadow relative overflow-hidden border border-[#e6dace]/50">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <Zap size={16} className="text-[#c69f6e]" />
                                        <div
                                            className="cursor-pointer group/title"
                                            onClick={() => setShowHistoryModal({ type: 'extra' })}
                                        >
                                            <h4 className="font-bold text-[#4a3426] text-xs uppercase tracking-wider group-hover/title:text-[#c69f6e] transition-colors">EXTRA</h4>
                                            <p className="text-[9px] font-bold text-[#8c8279] uppercase tracking-tighter opacity-70">Main d'œuvre occasionnelle</p>
                                        </div>
                                        <button
                                            disabled={isLocked}
                                            onClick={() => setShowEntryModal({ type: 'extra' })}
                                            className="text-[#c69f6e] hover:scale-110 transition-transform disabled:opacity-30"
                                        >
                                            <PlusCircle size={22} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                    <span
                                        className="bg-[#f4ece4] text-[#4a3426] px-4 py-2 rounded-2xl font-black text-xl cursor-pointer hover:bg-[#e6dace] transition-colors"
                                        onClick={() => setShowHistoryModal({ type: 'extra' })}
                                    >
                                        {extraTotal.toFixed(3)} <span className="text-xs">DT</span>
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm text-[#4a3426] max-h-48 overflow-y-auto custom-scrollbar">
                                    {extrasList.length > 0 ? extrasList.map((a, i) => (
                                        <div key={i} className="flex justify-between p-3 bg-[#f9f6f2] rounded-2xl items-center group">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="font-bold text-[#4a3426] cursor-pointer hover:text-[#c69f6e] transition-colors"
                                                    onClick={() => setShowHistoryModal({ type: 'extra', targetName: a.username })}
                                                >
                                                    {a.username}
                                                </span>
                                                {getDepartment(a.username) && (
                                                    <span className="text-[10px] font-black text-[#8c8279] uppercase tracking-wider bg-[#f4ece4] px-2 py-0.5 rounded-lg border border-[#e6dace]/50">
                                                        {getDepartment(a.username)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <b className="font-black text-[#4a3426]">{parseFloat(a.montant).toFixed(3)}</b>
                                                {!isLocked && (
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => setShowEntryModal({ type: 'extra', data: a })}
                                                            className="text-[#c69f6e] hover:text-[#4a3426] transition-colors"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => a.id && handleDeleteEntry('extra', a.id)}
                                                            className="text-red-300 hover:text-red-500 transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center py-4 text-[#8c8279] italic opacity-50">Aucun extra</p>
                                    )}
                                </div>
                            </div>

                            {/* 2.5 Primes */}
                            <div className="bg-white rounded-[2rem] p-6 luxury-shadow relative overflow-hidden border border-[#e6dace]/50">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={16} className="text-[#2d6a4f]" />
                                        <div
                                            className="cursor-pointer group/title"
                                            onClick={() => setShowHistoryModal({ type: 'prime' })}
                                        >
                                            <h4 className="font-bold text-[#4a3426] text-xs uppercase tracking-wider group-hover/title:text-[#c69f6e] transition-colors">PRIMES</h4>
                                            <p className="text-[9px] font-bold text-[#8c8279] uppercase tracking-tighter opacity-70">Récompenses & bonus</p>
                                        </div>
                                        <button
                                            disabled={isLocked}
                                            onClick={() => setShowEntryModal({ type: 'prime' })}
                                            className="text-[#c69f6e] hover:scale-110 transition-transform disabled:opacity-30"
                                        >
                                            <PlusCircle size={22} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                    <span
                                        className="bg-[#f1f8f4] text-[#2d6a4f] px-4 py-2 rounded-2xl font-black text-xl cursor-pointer hover:bg-[#d8e9df] transition-colors"
                                        onClick={() => setShowHistoryModal({ type: 'prime' })}
                                    >
                                        {primesTotal.toFixed(3)} <span className="text-xs">DT</span>
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm text-[#4a3426] max-h-48 overflow-y-auto custom-scrollbar">
                                    {primesList.length > 0 ? primesList.map((p, i) => (
                                        <div key={i} className="flex justify-between p-3 bg-[#f9f6f2] rounded-2xl items-center group">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="font-bold text-[#4a3426] cursor-pointer hover:text-[#c69f6e] transition-colors"
                                                    onClick={() => setShowHistoryModal({ type: 'prime', targetName: p.username })}
                                                >
                                                    {p.username}
                                                </span>
                                                {getDepartment(p.username) && (
                                                    <span className="text-[10px] font-black text-[#8c8279] uppercase tracking-wider bg-[#f4ece4] px-2 py-0.5 rounded-lg border border-[#e6dace]/50">
                                                        {getDepartment(p.username)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <b className="font-black text-[#4a3426]">{parseFloat(p.montant).toFixed(3)}</b>
                                                {!isLocked && (
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => setShowEntryModal({ type: 'prime', data: p })}
                                                            className="text-[#c69f6e] hover:text-[#4a3426] transition-colors"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => p.id && handleDeleteEntry('prime', p.id)}
                                                            className="text-red-300 hover:text-red-500 transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
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
                                            <button
                                                onClick={() => setHideRecetteCaisse(!hideRecetteCaisse)}
                                                className="ml-auto p-1 hover:bg-white/10 rounded-full transition-colors"
                                            >
                                                {hideRecetteCaisse ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                        <div className="flex items-baseline gap-3 text-white mt-1">
                                            {hideRecetteCaisse ? (
                                                <span className="text-5xl md:text-6xl font-black tracking-tighter">********</span>
                                            ) : (
                                                <span className="text-5xl md:text-6xl font-black tracking-tighter">{totalExpenses.toFixed(3)}</span>
                                            )}
                                            <span className="text-xl md:text-2xl font-medium opacity-50 uppercase">DT</span>
                                        </div>
                                        {!hideRecetteCaisse && (
                                            <div className="text-[10px] md:text-xs opacity-40 mt-1 text-white">
                                                (Fournisseurs: {totalExpensesDynamic.toFixed(3)} + Journalier: {totalExpensesJournalier.toFixed(3)} + Divers: {totalExpensesDivers.toFixed(3)} + Admin: {totalExpensesAdmin.toFixed(3)} + Fixes: {(acompte + doublage + extraTotal + primesTotal).toFixed(3)})
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 md:pt-0 md:pl-4">
                                        <div className="flex items-center gap-2 opacity-70 mb-2 text-white">
                                            <TrendingUp size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Recette Nette</span>
                                        </div>
                                        <div className="flex items-baseline gap-3 mt-1">
                                            {hideRecetteCaisse ? (
                                                <span className={`text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-[#c69f6e]`}>
                                                    ********
                                                </span>
                                            ) : (
                                                <span className={`text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter transition-all duration-500 ${recetteNett >= 0 ? 'text-[#c69f6e]' : 'text-red-400'}`}>
                                                    {recetteNett.toFixed(3)}
                                                </span>
                                            )}
                                            <span className="text-2xl md:text-3xl font-medium opacity-50 text-white uppercase font-black">DT</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Répartition Section */}
                            <div className="p-8 pt-6 relative z-10">
                                <h3 className="font-black text-white/80 mb-6 flex items-center gap-3 uppercase text-xs tracking-[0.2em]">
                                    <Receipt size={16} /> Répartition Finale
                                    <button
                                        onClick={() => setHideRecetteCaisse(!hideRecetteCaisse)}
                                        className="ml-auto p-1 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        {hideRecetteCaisse ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
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
                                                {hideRecetteCaisse ? (
                                                    <div className="w-full h-20 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center font-black text-2xl text-white">
                                                        ********
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        disabled={m.label === 'Espèces' || isLocked}
                                                        value={m.val}
                                                        onWheel={(e) => e.currentTarget.blur()}
                                                        onChange={(e) => m.set(e.target.value)}
                                                        className={`w-full h-20 rounded-2xl pl-11 pr-3 font-black text-2xl md:text-3xl text-white outline-none transition-all shadow-inner ${(m.label === 'Espèces' || isLocked) ? 'bg-white/20 border-white/30 cursor-not-allowed' : 'bg-white/10 border border-white/10 focus:bg-white/20 focus:border-white/40'}`}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div >

                        {/* Centered Save Button (Integrated in content) */}
                        < div className="flex flex-col items-center gap-4 pt-8" >
                            {isLocked && (
                                <div className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 font-bold animate-pulse">
                                    <LockIcon size={18} />
                                    Cette session est clôturée et verrouillée
                                </div>
                            )
                            }
                            <div className="flex gap-4 w-full max-w-md">
                                {isLocked && role === 'admin' && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await unlockChiffre({ variables: { date } });
                                                setToast({ msg: 'Session déverrouillée', type: 'success' });
                                                setTimeout(() => setToast(null), 3000);
                                                refetchChiffre();
                                            } catch (e) {
                                                setToast({ msg: 'Échec du déverrouillage', type: 'error' });
                                                setTimeout(() => setToast(null), 3000);
                                            }
                                        }}
                                        disabled={unlocking}
                                        className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white px-8 py-5 rounded-[2.5rem] flex items-center gap-3 font-black text-lg transition-all border border-white/20 shadow-xl"
                                    >
                                        {unlocking ? <Loader2 className="animate-spin" /> : <UnlockIcon size={24} />} Déverrouiller
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    className={`${isLocked ? 'bg-gray-500/50 opacity-50 hover:bg-red-500' : 'gold-gradient'} text-white px-12 py-5 rounded-[2.5rem] shadow-2xl shadow-[#c69f6e]/30 flex items-center gap-3 font-black text-xl hover:scale-105 active:scale-95 transition-all flex-1 justify-center border border-white/20`}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : (isLocked ? <LockIcon size={24} /> : <Save size={24} />)}
                                    {isLocked ? 'Session Clôturée' : 'Enregistrer la Session'}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {
                    toast && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-6 left-0 right-0 mx-auto w-max z-50 px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 ${toast.type === 'success' ? 'bg-[#2d6a4f] text-white' : 'bg-red-600 text-white'}`}>{toast.msg}</motion.div>
                    )
                }
            </AnimatePresence >

            {/* Image Modal */}
            <AnimatePresence>
                {
                    viewingInvoices && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-2" onClick={() => { setViewingInvoices(null); setViewingInvoicesTarget(null); }}>
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#fcfaf8] rounded-[2.5rem] p-6 max-w-[98vw] w-full h-[95vh] overflow-y-auto relative border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                                <button onClick={() => { setViewingInvoices(null); setViewingInvoicesTarget(null); }} className="absolute top-6 right-6 p-3 bg-white hover:bg-red-50 text-[#4a3426] hover:text-red-500 rounded-full transition-all z-50 shadow-lg border border-[#e6dace]"><LogOut size={24} className="rotate-180" /></button>
                                <div className="flex items-center justify-between mb-8 px-2">
                                    <h3 className="text-3xl font-black text-[#4a3426] flex items-center gap-4 uppercase tracking-tight"><Receipt size={32} className="text-[#c69f6e]" /> Reçus & Factures</h3>
                                    {viewingInvoicesTarget && (
                                        <div className="flex items-center gap-4 mr-16">
                                            <label className={`flex items-center gap-3 px-6 py-3 ${isLocked && role !== 'admin' ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-[#2d6a4f] hover:bg-[#1b4332] cursor-pointer'} text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#2d6a4f]/20`}>
                                                <Plus size={18} /> Ajouter Photo
                                                <input
                                                    type="file"
                                                    multiple
                                                    disabled={isLocked && role !== 'admin'}
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
                                            <div className="flex bg-white rounded-2xl p-1.5 gap-1 border border-[#e6dace] shadow-lg">
                                                <button onClick={() => setImgZoom(prev => Math.max(0.5, prev - 0.25))} className="w-10 h-10 hover:bg-[#fcfaf8] rounded-xl flex items-center justify-center transition-all text-[#4a3426]" title="Zoom Arrière"><ZoomOut size={20} /></button>
                                                <button onClick={() => setImgZoom(prev => Math.min(4, prev + 0.25))} className="w-10 h-10 hover:bg-[#fcfaf8] rounded-xl flex items-center justify-center transition-all text-[#4a3426]" title="Zoom Avant"><ZoomIn size={20} /></button>
                                                <button onClick={() => setImgRotation(prev => prev + 90)} className="w-10 h-10 hover:bg-[#fcfaf8] rounded-xl flex items-center justify-center transition-all text-[#4a3426]" title="Tourner"><RotateCcw size={20} /></button>
                                                <button onClick={resetView} className="w-10 h-10 hover:bg-[#fcfaf8] rounded-xl flex items-center justify-center transition-all text-[#4a3426]" title="Réinitialiser"><Maximize2 size={20} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {viewingInvoices.length > 0 ? (
                                    <div className={`grid grid-cols-1 ${viewingInvoices.length > 1 ? 'md:grid-cols-2' : ''} gap-8`}>
                                        {viewingInvoices.map((img, idx) => (
                                            <div
                                                key={idx}
                                                className="relative group rounded-[2.5rem] overflow-hidden border border-white/10 bg-black shadow-2xl h-[75vh]"
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
                                                        src={img}
                                                        draggable="false"
                                                        className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
                                                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                                                    />
                                                </motion.div>
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                    <a href={img} download target="_blank" className="p-2 bg-white/90 hover:bg-white text-[#4a3426] rounded-lg shadow-lg backdrop-blur-sm transition-all hover:scale-110"><Download size={16} /></a>
                                                    <button onClick={() => handleShareInvoice(img)} className="p-2 bg-white/90 hover:bg-white text-[#4a3426] rounded-lg shadow-lg backdrop-blur-sm transition-all hover:scale-110"><Share2 size={16} /></button>
                                                    <button
                                                        onClick={() => {
                                                            if (isLocked && role !== 'admin') {
                                                                setShowConfirm({
                                                                    type: 'alert',
                                                                    title: 'INTERDIT',
                                                                    message: 'Cette date est verrouillée. Impossible de supprimer ce reçu.',
                                                                    color: 'red',
                                                                    alert: true
                                                                });
                                                                return;
                                                            }
                                                            handleDeleteInvoice(idx);
                                                        }}
                                                        className={`p-2 bg-white/90 hover:bg-white text-red-600 rounded-lg shadow-lg backdrop-blur-sm transition-all hover:scale-110 ${isLocked && role !== 'admin' ? 'opacity-50' : ''}`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md text-[#c69f6e] text-[10px] font-black px-3 py-1.5 rounded-full border border-[#c69f6e]/20 uppercase tracking-widest">Reçu {idx + 1} • Zoom: {Math.round(imgZoom * 100)}%</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="text-center py-20 text-gray-400"><UploadCloud size={60} className="mx-auto mb-4 opacity-20" /><p>Aucun reçu attaché</p></div>}
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Admin Calendar Modal */}
            <AnimatePresence>
                {
                    showCalendar && role === 'admin' && (
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
                                        return (<button key={i} onClick={() => {
                                            const parts = date.split('-');
                                            const newD = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, day);
                                            const ny = newD.getFullYear();
                                            const nm = String(newD.getMonth() + 1).padStart(2, '0');
                                            const nd = String(newD.getDate()).padStart(2, '0');
                                            setDate(`${ny}-${nm}-${nd}`);
                                            setShowCalendar(false);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }} className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${isSelected ? 'bg-[#4a3426] text-white shadow-lg' : 'text-[#4a3426] hover:bg-[#f4ece4] hover:text-[#c69f6e]'}`}>{day}</button>);
                                    })}
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

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
                                            readOnly={isLocked}
                                            onChange={(e) => !isLocked && setTempDetails(e.target.value)}
                                            onClick={() => {
                                                if (isLocked) {
                                                    setShowConfirm({
                                                        type: 'alert',
                                                        title: 'INTERDIT',
                                                        message: 'Cette date est verrouillée. Impossible de modifier les détails.',
                                                        color: 'red',
                                                        alert: true
                                                    });
                                                }
                                            }}
                                            placeholder={isLocked ? "Aucun détail supplémentaire." : "Notez ici les détails de la dépense..."}
                                            className={`w-full bg-[#fcfaf8] border border-[#e6dace] rounded-3xl p-6 text-base font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none min-h-[160px] resize-none transition-all shadow-inner placeholder-[#bba282]/30 ${isLocked ? 'cursor-default opacity-80' : ''}`}
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
                                            if (isLocked) {
                                                setShowDetailsModal(false);
                                                setModalDetailsTarget(null);
                                                return;
                                            }
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
                                            setHasInteracted(true);
                                        }}
                                        className={`flex-[2] py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] text-white shadow-xl transition-all ${isLocked ? 'bg-[#8c8279] hover:bg-[#4a3426]' : 'bg-[#c69f6e] hover:bg-[#b08d5d] shadow-[#c69f6e]/20'}`}
                                    >
                                        {isLocked ? 'Fermer' : 'Enregistrer les détails'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {/* Removed old showSupplierModal */}
            </AnimatePresence>

            {/* Selection Modals Journalier/Divers */}
            <AnimatePresence>
                {(showSupplierModal || showJournalierModal || showDiversModal || showEmployeeModal) && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md"
                            onClick={() => {
                                setShowSupplierModal(false);
                                setShowJournalierModal(false);
                                setShowDiversModal(false);
                                setShowEmployeeModal(false);
                                setDesignationSearch('');
                                setNewSupplierName('');
                                setEmployeeSearch('');
                            }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl border border-white/20 p-10"
                        >
                            <div className="space-y-8">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-[#fcfaf8] border border-[#e6dace] rounded-3xl flex items-center justify-center text-[#c69f6e]">
                                        <Plus size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-[#4a3426]">
                                            {showSupplierModal ? 'Nouveau Fournisseur' : showEmployeeModal ? 'Nouveau Employé' : 'Nouvelle Désignation'}
                                        </h3>
                                        <p className="text-sm font-bold text-[#8c8279] opacity-60">
                                            {showSupplierModal ? 'Ajoutez un nouveau partenaire à votre liste.' : showEmployeeModal ? 'Ajoutez un nouveau collaborateur à votre liste.' : 'Ajoutez une nouvelle désignation à votre liste.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#bba282]" size={20} />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder={showSupplierModal ? "Nom du fournisseur..." : showEmployeeModal ? "Nom de l'employé..." : "Nom de la désignation..."}
                                                value={showSupplierModal ? newSupplierName : showEmployeeModal ? employeeSearch : designationSearch}
                                                onChange={(e) => showSupplierModal ? setNewSupplierName(e.target.value) : showEmployeeModal ? setEmployeeSearch(e.target.value) : setDesignationSearch(e.target.value)}
                                                className="w-full h-16 bg-[#fcfaf8] border border-[#e6dace] rounded-2xl pl-14 pr-6 font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all placeholder-[#bba282]/50"
                                            />
                                        </div>

                                        {showEmployeeModal && (
                                            <div className="relative animate-in fade-in slide-in-from-top-4 duration-300">
                                                <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-[#bba282]" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder="Département (optionnel)..."
                                                    value={employeeDepartment}
                                                    onChange={(e) => setEmployeeDepartment(e.target.value)}
                                                    className="w-full h-16 bg-[#fcfaf8] border border-[#e6dace] rounded-2xl pl-14 pr-6 font-bold text-[#4a3426] focus:border-[#c69f6e] outline-none transition-all placeholder-[#bba282]/50"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => {
                                                setShowSupplierModal(false);
                                                setShowJournalierModal(false);
                                                setShowDiversModal(false);
                                                setShowEmployeeModal(false);
                                                setDesignationSearch('');
                                                setNewSupplierName('');
                                                setEmployeeSearch('');
                                                setEmployeeDepartment('');
                                            }}
                                            className="flex-1 h-14 rounded-2xl border border-[#e6dace] text-[#8c8279] font-black uppercase text-xs tracking-[0.2em] hover:bg-[#fcfaf8] transition-all"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const val = showSupplierModal ? newSupplierName : showEmployeeModal ? employeeSearch : designationSearch;
                                                if (!val.trim()) return;

                                                try {
                                                    if (showSupplierModal) {
                                                        await upsertSupplier({ variables: { name: val.trim() } });
                                                        refetchSuppliers();
                                                        setShowSupplierModal(false);
                                                        setNewSupplierName('');
                                                    } else if (showEmployeeModal) {
                                                        await upsertEmployee({ variables: { name: val.trim(), department: employeeDepartment.trim() || null } });
                                                        refetchEmployees();
                                                        setShowEmployeeModal(false);
                                                        setEmployeeSearch('');
                                                        setEmployeeDepartment('');
                                                    } else {
                                                        await upsertDesignation({ variables: { name: val.trim() } });
                                                        refetchDesignations();
                                                        if (showJournalierModal) {
                                                            handleAddJournalier(val.trim());
                                                            setShowJournalierModal(false);
                                                        } else {
                                                            handleAddDivers(val.trim());
                                                            setShowDiversModal(false);
                                                        }
                                                        setDesignationSearch('');
                                                    }
                                                    setToast({ msg: 'Ajouté avec succès', type: 'success' });
                                                    setTimeout(() => setToast(null), 3000);
                                                } catch (e) {
                                                    setToast({ msg: 'Erreur lors de l’ajout', type: 'error' });
                                                    setTimeout(() => setToast(null), 3000);
                                                }
                                            }}
                                            disabled={showSupplierModal ? !newSupplierName.trim() : showEmployeeModal ? !employeeSearch.trim() : !designationSearch.trim()}
                                            className="flex-1 h-14 rounded-2xl bg-[#e2d6c9] text-[#4a3426] font-black uppercase text-xs tracking-[0.2em] hover:bg-[#d6c7b8] transition-all shadow-md disabled:opacity-50"
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
            <EntryModal
                isOpen={!!showEntryModal}
                onClose={() => setShowEntryModal(null)}
                onSubmit={handleEntrySubmit}
                type={showEntryModal?.type}
                initialData={showEntryModal?.data}
                employees={employeesData?.getEmployees}
            />

            <HistoryModal
                isOpen={!!showHistoryModal}
                onClose={() => setShowHistoryModal(null)}
                type={showHistoryModal?.type}
                targetName={showHistoryModal?.targetName}
                startDate={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`}
                endDate={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()).padStart(2, '0')}`}
            />

            <AnimatePresence>
                {showEmployeeList && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowEmployeeList(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-[#e6dace]"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-black text-[#4a3426] uppercase tracking-tighter">Annuaire Employés</h3>
                                    <button onClick={() => setShowEmployeeList(false)} className="p-2 hover:bg-[#f9f6f2] rounded-xl transition-colors text-[#bba282]"><X size={20} /></button>
                                </div>

                                <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                                    {employeesData?.getEmployees?.map((emp: any) => (
                                        <div key={emp.id} className="flex justify-between items-center p-4 bg-[#fcfaf8] rounded-2xl border border-[#e6dace]/30 group hover:border-[#c69f6e]/30 transition-all">
                                            <span className="font-bold text-[#4a3426]">{emp.name}</span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={async () => {
                                                        const { value: formValues } = await MySwal.fire({
                                                            title: 'Modifier Employé',
                                                            html:
                                                                `<input id="swal-input1" class="swal2-input" placeholder="Nom" value="${emp.name}">` +
                                                                `<input id="swal-input2" class="swal2-input" placeholder="Département" value="${emp.department || ''}">`,
                                                            focusConfirm: false,
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Enregistrer',
                                                            cancelButtonText: 'Annuler',
                                                            confirmButtonColor: '#4a3426',
                                                            background: '#fff',
                                                            customClass: {
                                                                title: 'text-lg font-black uppercase text-[#4a3426]',
                                                                confirmButton: 'rounded-xl font-bold uppercase tracking-widest text-xs py-3',
                                                                cancelButton: 'rounded-xl font-bold uppercase tracking-widest text-xs py-3'
                                                            },
                                                            preConfirm: () => {
                                                                return [
                                                                    (document.getElementById('swal-input1') as HTMLInputElement).value,
                                                                    (document.getElementById('swal-input2') as HTMLInputElement).value
                                                                ]
                                                            }
                                                        });

                                                        if (formValues) {
                                                            const [newName, newDept] = formValues;
                                                            if (newName && (newName.trim() !== emp.name || newDept.trim() !== (emp.department || ''))) {
                                                                try {
                                                                    await updateEmployee({ variables: { id: emp.id, name: newName.trim(), department: newDept.trim() || null } });
                                                                    await refetchEmployees();
                                                                    await MySwal.fire({
                                                                        icon: 'success',
                                                                        title: 'Succès',
                                                                        text: 'Employé mis à jour avec succès',
                                                                        timer: 1500,
                                                                        showConfirmButton: false
                                                                    });
                                                                } catch (error) {
                                                                    console.error('Update error:', error);
                                                                    await MySwal.fire({
                                                                        icon: 'error',
                                                                        title: 'Erreur',
                                                                        text: 'Une erreur est survenue lors de la mise à jour'
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    className="p-2 text-[#c69f6e] hover:bg-[#f4ece4] rounded-lg transition-colors"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const result = await MySwal.fire({
                                                            title: 'Supprimer ?',
                                                            text: "Cette action est irréversible.",
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Oui, supprimer',
                                                            cancelButtonText: 'Annuler',
                                                            confirmButtonColor: '#ef4444',
                                                            background: '#fff',
                                                            customClass: {
                                                                title: 'text-lg font-black uppercase text-[#4a3426]',
                                                                confirmButton: 'rounded-xl font-bold uppercase tracking-widest text-xs py-3',
                                                                cancelButton: 'rounded-xl font-bold uppercase tracking-widest text-xs py-3'
                                                            }
                                                        });
                                                        if (result.isConfirmed) {
                                                            await deleteEmployee({ variables: { id: emp.id } });
                                                            refetchEmployees();
                                                        }
                                                    }}
                                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!employeesData?.getEmployees || employeesData.getEmployees.length === 0) && (
                                        <div className="text-center py-12 opacity-40 italic">Aucun employé enregistré</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={!!showConfirm}
                onClose={() => setShowConfirm(null)}
                onConfirm={showConfirm?.onConfirm}
                title={showConfirm?.title || ''}
                message={showConfirm?.message || ''}
                color={showConfirm?.color || 'blue'}
                alert={showConfirm?.alert || showConfirm?.type === 'alert'}
            />
        </div >
    );
}
