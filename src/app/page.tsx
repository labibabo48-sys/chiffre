'use client';

import { ApolloProvider } from '@apollo/client';
import client from '@/lib/apollo-client';
import ChiffrePage from '@/components/ChiffrePage';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Lock, User, CheckCircle2, Loader2 } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<{ role: 'admin' | 'caissier' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('bb_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('bb_user');
      }
    }
    setInitializing(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API delay for smoothness
    setTimeout(() => {
      // Mock validation matching the user's previous request context 
      // (simple check, admin vs caissier)
      if (username.toLowerCase() === 'admin' && password.length > 0) {
        const userData = { role: 'admin' as const };
        setUser(userData);
        localStorage.setItem('bb_user', JSON.stringify(userData));
      } else if (username.toLowerCase() === 'caissier' && password.length > 0) {
        const userData = { role: 'caissier' as const };
        setUser(userData);
        localStorage.setItem('bb_user', JSON.stringify(userData));
      } else {
        setError('Identifiants incorrects');
        setLoading(false);
        return;
      }
      setLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    localStorage.removeItem('bb_user');
    setUser(null);
    setUsername('');
    setPassword('');
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="relative w-20 h-20">
            <Image src="/logo.jpeg" alt="Loading" fill className="rounded-full object-cover opacity-50" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#fdfbf7]">
        {/* Decorative background elements */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-[var(--accent)] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute top-40 -left-20 w-72 h-72 bg-[var(--primary)] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        </div>

        <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(92,58,33,0.15)] overflow-hidden min-h-[600px] border border-[rgba(196,154,108,0.2)]">

          {/* Left Side - Visual/Brand */}
          <div className="hidden md:flex flex-col items-center justify-center relative p-12 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('/logo.jpeg')] bg-cover bg-center mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

            <div className="relative z-10 text-center space-y-6">
              <div className="w-32 h-32 relative mx-auto rounded-full p-1 bg-white/20 backdrop-blur-sm">
                <Image src="/logo.jpeg" alt="Business Bey" fill className="rounded-full object-cover border-4 border-transparent" />
              </div>
              <div>
                <h2 className="text-4xl font-serif tracking-tight mb-2">Business Bey</h2>
                <p className="text-[var(--accent-light)] uppercase tracking-[0.2em] text-xs font-semibold">Luxury Restaurant & Coffee</p>
              </div>
              <div className="w-12 h-0.5 bg-[var(--accent)] mx-auto opacity-50"></div>
              <p className="text-white/80 font-light italic max-w-xs mx-auto">
                "Excellence et raffinement au service de notre clientèle."
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 relative">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">Bienvenue</h1>
              <p className="text-[var(--text-muted)]">Connectez-vous à votre espace de gestion.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider ml-1">Utilisateur</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--accent)] transition-colors group-focus-within:text-[var(--primary)]" size={20} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-premium w-full py-4 rounded-xl text-lg bg-[#fcfaf8]"
                    style={{ paddingLeft: '3.5rem' }}
                    placeholder="Identifiant"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider ml-1">Mot de passe</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--accent)] transition-colors group-focus-within:text-[var(--primary)]" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium w-full py-4 rounded-xl text-lg bg-[#fcfaf8]"
                    style={{ paddingLeft: '3.5rem' }}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" /> : <span>Se connecter</span>}
              </button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-xs text-[var(--text-muted)]">© 2026 Expertise Bey. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChiffrePage role={user.role} onLogout={handleLogout} />
  );
}
