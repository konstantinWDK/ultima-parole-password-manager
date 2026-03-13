import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, Unlock, Plus, Trash2, Copy, Eye, EyeOff, Search, 
  Download, Upload, Shield, LogOut, Key, Check, AlertCircle, Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { encryptData, decryptData, generatePassword } from './services/crypto';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [masterPassword, setMasterPassword] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [passwords, setPasswords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showPass, setShowPass] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');
  
  // New entry form state
  const [newEntry, setNewEntry] = useState({ title: '', username: '', password: '', website: '' });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewVault, setIsNewVault] = useState(false);
  
  // Persistence Key
  const STORAGE_KEY = 'ultima_parole_vault';

  // Check if vault exists
  useEffect(() => {
    setIsNewVault(!localStorage.getItem(STORAGE_KEY));
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const saved = localStorage.getItem(STORAGE_KEY);
    
    if (!saved) {
      if (masterPassword.length < 4) {
        setError('La contraseña debe tener al menos 4 caracteres');
        return;
      }
      if (masterPassword !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      // Initialize empty vault
      setIsLogged(true);
      setPasswords([]);
      return;
    }

    try {
      const encryptedData = JSON.parse(saved);
      const decrypted = decryptData(encryptedData, masterPassword);
      setPasswords(decrypted);
      setIsLogged(true);
    } catch (err) {
      setError('Contraseña maestra incorrecta');
    }
  };

  const handleSaveVault = (updatedPasswords) => {
    const encrypted = encryptData(updatedPasswords, masterPassword);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
    setPasswords(updatedPasswords);
    setIsNewVault(false);
  };

  const addEntry = (e) => {
    e.preventDefault();
    if (!newEntry.title || !newEntry.password) return;
    
    const updated = [...passwords, { ...newEntry, id: Date.now() }];
    handleSaveVault(updated);
    setNewEntry({ title: '', username: '', password: '', website: '' });
    setIsAdding(false);
  };

  const deleteEntry = (id) => {
    if (confirm('¿Eliminar esta entrada?')) {
      const updated = passwords.filter(p => p.id !== id);
      handleSaveVault(updated);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportVault = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ultima_parole_backup_${new Date().toISOString().slice(0,10)}.updb`;
    a.click();
  };

  const importVault = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        JSON.parse(content); // Test if valid JSON
        localStorage.setItem(STORAGE_KEY, content);
        alert('Vault importado. Por favor, logueate con la contraseña del backup.');
        window.location.reload();
      } catch (err) {
        alert('Archivo de backup inválido');
      }
    };
    reader.readAsText(file);
  };

  const filteredPasswords = useMemo(() => {
    return passwords.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.website?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [passwords, searchTerm]);

  if (!isLogged) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-primary-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Ultima Parole</h1>
          <p className="text-slate-400 mb-8">
            {isNewVault ? "Configura tu Contraseña Maestra" : "Introduce tu Contraseña Maestra"}
          </p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="password"
                placeholder={isNewVault ? "Nueva Contraseña Maestra" : "Contraseña Maestra"}
                className="input-field pl-10"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                autoFocus
                required
              />
            </div>

            {isNewVault && (
              <div className="relative">
                <Unlock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  placeholder="Confirma tu Contraseña"
                  className="input-field pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm flex items-center justify-center gap-1"><AlertCircle size={14} /> {error}</p>}
            <button type="submit" className="btn-primary w-full py-3">
              {isNewVault ? "Crear Vault" : "Desbloquear Vault"}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 mb-4">¿Ya tienes un vault? Impórtalo aquí:</p>
            <label className="btn-secondary text-xs cursor-pointer inline-flex">
              <Upload size={14} /> Importar .updb
              <input type="file" hidden accept=".updb" onChange={importVault} />
            </label>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="text-primary-500" /> Ultima Parole
          </h1>
          <p className="text-slate-400">Tu caja fuerte privada</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportVault} className="btn-secondary" title="Exportar Backup">
            <Download size={18} /> <span className="hidden sm:inline">Exportar</span>
          </button>
          <button onClick={() => setIsLogged(false)} className="btn-secondary border-red-500/30 text-red-400 hover:bg-red-500/10">
            <LogOut size={18} /> <span className="hidden sm:inline">Cerrar</span>
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar contraseñas..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={cn("btn-primary", isAdding && "bg-slate-700 hover:bg-slate-600")}
        >
          {isAdding ? <Trash size={18} /> : <Plus size={18} />}
          {isAdding ? "Cancelar" : "Añadir Nueva"}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={addEntry}
            className="glass-card mb-8 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 ml-1">Título / Servicio</label>
                <input
                  placeholder="Ej: Google, Spotify..."
                  className="input-field mt-1"
                  value={newEntry.title}
                  onChange={e => setNewEntry({...newEntry, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 ml-1">Usuario / Email</label>
                <input
                  placeholder="usuario@email.com"
                  className="input-field mt-1"
                  value={newEntry.username}
                  onChange={e => setNewEntry({...newEntry, username: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-400 ml-1 flex justify-between">
                  Contraseña
                  <button 
                    type="button" 
                    onClick={() => setNewEntry({...newEntry, password: generatePassword()})}
                    className="text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    <Key size={12} /> Generar Fuerte
                  </button>
                </label>
                <input
                  type="text"
                  placeholder="********"
                  className="input-field mt-1"
                  value={newEntry.password}
                  onChange={e => setNewEntry({...newEntry, password: e.target.value})}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full mt-6 py-3">
              Guardar en el Vault
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Password List */}
      <div className="space-y-4">
        {filteredPasswords.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
            <Lock className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400">No hay contraseñas que coincidan</p>
          </div>
        ) : (
          filteredPasswords.map((p) => (
            <motion.div 
              layout
              key={p.id}
              className="glass-card flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-primary-400">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{p.title}</h3>
                  <p className="text-sm text-slate-400">{p.username || 'Sin usuario'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="relative flex-1 sm:w-48">
                  <input
                    type={showPass[p.id] ? "text" : "password"}
                    readOnly
                    value={p.password}
                    className="w-full bg-slate-900/30 border-none text-right pr-2 font-mono text-slate-300 focus:ring-0"
                  />
                </div>
                
                <button 
                  onClick={() => setShowPass({...showPass, [p.id]: !showPass[p.id]})}
                  className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-400"
                >
                  {showPass[p.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                <button 
                  onClick={() => copyToClipboard(p.password, p.id)}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    copiedId === p.id ? "bg-green-500/20 text-green-400" : "hover:bg-slate-700 text-slate-400"
                  )}
                >
                  {copiedId === p.id ? <Check size={18} /> : <Copy size={18} />}
                </button>

                <button 
                  onClick={() => deleteEntry(p.id)}
                  className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <footer className="mt-20 text-center text-slate-500 text-xs">
        <p>Ultima Parole - Cifrado Local AES-256</p>
        <p className="mt-2">Nada se envía al servidor. Tu vault es 100% privado.</p>
      </footer>
    </div>
  );
}
