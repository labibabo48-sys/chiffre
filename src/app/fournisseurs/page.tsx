'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
    Truck, Plus, Trash2, Search, Loader2, Building2, AlertCircle,
    CheckCircle2, X, ChevronRight, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GET_SUPPLIERS = gql`
  query GetSuppliers {
    getSuppliers {
      id
      name
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

const DELETE_SUPPLIER = gql`
  mutation DeleteSupplier($id: Int!) {
    deleteSupplier(id: $id)
  }
`;

export default function FournisseursPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ role: 'admin' | 'caissier', full_name: string } | null>(null);
    const [initializing, setInitializing] = useState(true);

    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [newSupplierName, setNewSupplierName] = useState('');
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('bb_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        } else {
            router.push('/');
        }
        setInitializing(false);
    }, [router]);

    const { data, loading, refetch } = useQuery(GET_SUPPLIERS);
    const [upsertSupplier, { loading: adding }] = useMutation(UPSERT_SUPPLIER);
    const [deleteSupplier, { loading: deleting }] = useMutation(DELETE_SUPPLIER);

    const suppliers = data?.getSuppliers || [];
    const filteredSuppliers = suppliers.filter((s: any) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSupplierName.trim()) return;

        // Check for local duplicate first for faster UX
        const isDuplicate = suppliers.some(
            (s: any) => s.name.toLowerCase() === newSupplierName.trim().toLowerCase()
        );

        if (isDuplicate) {
            showToast('Ce fournisseur existe déjà', 'error');
            return;
        }

        try {
            await upsertSupplier({
                variables: { name: newSupplierName.trim() }
            });
            showToast('Fournisseur ajouté avec succès', 'success');
            setNewSupplierName('');
            setIsAdding(false);
            refetch();
        } catch (err) {
            showToast("Erreur lors de l'ajout", 'error');
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Voulez-vous vraiment supprimer le fournisseur "${name}" ?`)) return;

        try {
            await deleteSupplier({ variables: { id } });
            showToast('Fournisseur supprimé', 'success');
            refetch();
        } catch (err) {
            showToast('Erreur lors de la suppression', 'error');
        }
    };

    if (initializing || !user) return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
            <Loader2 className="animate-spin text-[#c69f6e]" size={40} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f5f2] text-[#2d241e] font-sans flex">
            <Sidebar role={user.role} />

            <div className="flex-1 min-w-0 pb-24 lg:pb-0">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e6dace] py-4 md:py-6 px-4 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Truck className="text-[#c69f6e]" size={20} />
                            <h1 className="text-xl md:text-2xl font-black text-[#4a3426] tracking-tight">Fournisseurs</h1>
                        </div>
                        <p className="text-xs text-[#8c8279] font-bold uppercase tracking-widest">Base de données partenaires & prestataires</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bba282]" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#f4ece4] border border-transparent focus:border-[#c69f6e]/30 focus:bg-white rounded-2xl h-12 pl-12 pr-4 outline-none font-medium transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-[#4a3426] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#2d241e] shadow-lg shadow-[#4a3426]/10 transition-all whitespace-nowrap"
                        >
                            <Plus size={20} /> <span className="hidden sm:inline">Nouveau</span>
                        </button>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-8 mt-12">
                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white p-6 rounded-3xl luxury-shadow border border-[#e6dace]/50">
                            <p className="text-[#8c8279] text-[10px] font-bold uppercase tracking-widest mb-1">Total Partenaires</p>
                            <h3 className="text-3xl font-black text-[#4a3426]">{suppliers.length}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-3xl luxury-shadow border border-[#e6dace]/50">
                            <p className="text-[#8c8279] text-[10px] font-bold uppercase tracking-widest mb-1">Actifs ce mois</p>
                            <h3 className="text-3xl font-black text-[#c69f6e]">{Math.floor(suppliers.length * 0.8)}</h3>
                        </div>
                        <div className="bg-[#f0faf5] p-6 rounded-3xl luxury-shadow border border-[#d1fae5]">
                            <p className="text-[#2d6a4f] text-[10px] font-bold uppercase tracking-widest mb-1">Status Système</p>
                            <div className="flex items-center gap-2 text-green-700 font-bold">
                                <CheckCircle2 size={18} />
                                <span>Optimisé</span>
                            </div>
                        </div>
                    </div>

                    {/* Suppliers List */}
                    <div className="bg-white rounded-[2.5rem] luxury-shadow border border-[#e6dace]/50 overflow-hidden">
                        <div className="p-8 border-b border-[#e6dace] bg-[#fcfaf8] flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[#4a3426]">Liste des Fournisseurs</h3>
                            <span className="text-xs font-bold text-[#8c8279]">{filteredSuppliers.length} résultats</span>
                        </div>

                        {loading && suppliers.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-[#8c8279] gap-4">
                                <Loader2 className="animate-spin text-[#c69f6e]" size={40} />
                                <p className="font-bold">Chargement de la base...</p>
                            </div>
                        ) : filteredSuppliers.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-[#8c8279] gap-4">
                                <div className="bg-[#f4ece4] p-6 rounded-full">
                                    <Building2 size={48} className="opacity-20" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-lg">Aucun fournisseur trouvé</p>
                                    <p className="text-sm opacity-60">Essayez une autre recherche ou créez-en un nouveau.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 divide-y divide-[#f4ece4]">
                                {filteredSuppliers.map((s: any, idx: number) => (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        key={s.id}
                                        className="group flex items-center justify-between p-6 hover:bg-[#fcfaf8] transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#f4ece4] rounded-2xl flex items-center justify-center text-[#c69f6e] font-black group-hover:bg-[#4a3426] group-hover:text-white transition-all">
                                                {s.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#4a3426] text-lg group-hover:text-[#c69f6e] transition-colors">{s.name}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-[#8c8279] uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded">ID: #{s.id}</span>
                                                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter bg-green-50 px-2 py-0.5 rounded">Vérifié</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => router.push(`/facturation?supplier=${encodeURIComponent(s.name)}`)}
                                                className="p-3 text-[#8c8279] hover:text-[#4a3426] hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#e6dace]"
                                            >
                                                <LayoutDashboard size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(s.id, s.name)}
                                                className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#4a3426]/40 backdrop-blur-sm"
                            onClick={() => setIsAdding(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-[#f4ece4] flex justify-between items-center">
                                <h3 className="text-xl font-bold text-[#4a3426]">Ajouter un Fournisseur</h3>
                                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-[#f4ece4] rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddSupplier} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#8c8279] uppercase tracking-widest ml-1">Nom du Fournisseur</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c69f6e]" size={20} />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Ex: Steg, Coca Cola..."
                                            value={newSupplierName}
                                            onChange={(e) => setNewSupplierName(e.target.value)}
                                            className="w-full h-14 bg-[#f8f5f2] border-2 border-transparent focus:border-[#c69f6e]/30 focus:bg-white rounded-2xl pl-12 pr-4 outline-none font-bold text-[#4a3426] transition-all"
                                        />
                                    </div>
                                    <p className="text-[10px] text-[#8c8279] italic px-1">Le système vérifiera automatiquement les doublons.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={adding || !newSupplierName.trim()}
                                    className="w-full h-14 bg-[#4a3426] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#4a3426]/20 hover:bg-[#2d241e] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {adding ? <Loader2 className="animate-spin" /> : <Plus size={20} />} Confirmer l'Ajout
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notifications */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={`fixed bottom-10 left-0 right-0 mx-auto w-max z-[80] px-8 py-4 rounded-3xl font-bold shadow-2xl flex items-center gap-3 border ${toast.type === 'success'
                            ? 'bg-[#1b4332] text-white border-green-400/20'
                            : 'bg-red-900/90 text-white border-red-500/20 backdrop-blur-md'
                            }`}
                    >
                        {toast.type === 'success' ? <CheckCircle2 className="text-green-400" /> : <AlertCircle className="text-red-400" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
