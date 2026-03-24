import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, Unlock, Plus, Trash2, Copy, Eye, EyeOff, Search, 
  Download, Upload, Shield, LogOut, Key, Check, AlertCircle, ChevronDown, ChevronRight, Folder,
  ExternalLink
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [isNewVault, setIsNewVault] = useState(false);
  const [passwords, setPasswords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showPass, setShowPass] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // New entry form state
  const [newEntry, setNewEntry] = useState({ title: '', username: '', password: '', project: '', website: '' });

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
        setError('Mínimo 4 caracteres');
        return;
      }
      if (masterPassword !== confirmPassword) {
        setError('No coinciden');
        return;
      }
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
      setError('Contraseña incorrecta');
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
    setNewEntry({ title: '', username: '', password: '', project: '', website: '' });
    setIsAdding(false);
  };

  const deleteEntry = (id) => {
    if (confirm('¿Eliminar entrada?')) {
      const updated = passwords.filter(p => p.id !== id);
      handleSaveVault(updated);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const groupedPasswords = useMemo(() => {
    const filtered = passwords.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.website?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups = filtered.reduce((acc, p) => {
      const project = p.project?.trim() || 'General';
      if (!acc[project]) acc[project] = [];
      acc[project].push(p);
      return acc;
    }, {});

    return groups;
  }, [passwords, searchTerm]);

  const uniqueProjects = useMemo(() => {
    const projects = passwords.map(p => p.project?.trim()).filter(Boolean);
    return [...new Set(projects)].sort();
  }, [passwords]);

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const exportVault = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().slice(0,10)}.updb`;
    a.click();
  };

  if (!isLogged) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-sm border-slate-800/50">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <Shield className="w-6 h-6 text-primary-500" />
            <span className="font-bold text-xl tracking-tight">Ultima Parole</span>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder={isNewVault ? "Nueva Contraseña Maestra" : "Contraseña Maestra"}
              className="input-field"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              autoFocus
              required
            />
            {isNewVault && (
              <input
                type="password"
                placeholder="Confirma la Contraseña"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button type="submit" className="btn-primary w-full shadow-none border border-primary-500/20">
              {isNewVault ? "Inicializar Vault" : "Desbloquear"}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-900 flex justify-center">
             <label className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-300 transition-colors flex items-center gap-1">
               <Upload size={10} /> Importar Backup (.updb)
               <input type="file" hidden accept=".updb" onChange={(e) => {
                 const file = e.target.files[0];
                 if (!file) return;
                 const reader = new FileReader();
                 reader.onload = (ev) => {
                   localStorage.setItem(STORAGE_KEY, ev.target.result);
                   window.location.reload();
                 };
                 reader.readAsText(file);
               }} />
             </label>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 font-sans">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600/10 rounded-lg flex items-center justify-center border border-primary-500/20">
            <Shield size={18} className="text-primary-500" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Vault</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportVault} className="btn-secondary px-3 py-1.5 text-xs">
            <Download size={14} /> Exportar
          </button>
          <button onClick={() => setIsLogged(false)} className="btn-icon">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
          <input
            type="text"
            placeholder="Buscar en el baúl..."
            className="input-field pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="btn-primary px-3 h-10">
          <Plus size={18} /> <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={addEntry} className="glass-card mb-8 border-slate-800/40 p-5 space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <input placeholder="Nombre (Ej: GitHub)" className="input-field" value={newEntry.title} onChange={e => setNewEntry({...newEntry, title: e.target.value})} required />
              <input placeholder="Usuario / Email" className="input-field" value={newEntry.username} onChange={e => setNewEntry({...newEntry, username: e.target.value})} />
              <input placeholder="URL de acceso" className="input-field" value={newEntry.website} onChange={e => setNewEntry({...newEntry, website: e.target.value})} />
              <div className="relative">
                <input 
                  placeholder="Proyecto / Tag" 
                  list="project-suggestions"
                  className="input-field" 
                  value={newEntry.project} 
                  onChange={e => setNewEntry({...newEntry, project: e.target.value})} 
                />
                <datalist id="project-suggestions">
                  {uniqueProjects.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>
            </div>
            <div className="relative group">
              <input placeholder="Contraseña" type="text" className="input-field pr-24" value={newEntry.password} onChange={e => setNewEntry({...newEntry, password: e.target.value})} required />
              <button type="button" onClick={() => setNewEntry({...newEntry, password: generatePassword()})} className="absolute right-2 top-1.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors">
                GENERAR
              </button>
            </div>
            <button type="submit" className="btn-primary w-full h-10">Guardar Seguro</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {Object.entries(groupedPasswords).length === 0 ? (
          <div className="text-center py-20 opacity-20">
            <Lock size={40} className="mx-auto mb-3" />
            <p className="text-sm">El baúl está vacío</p>
          </div>
        ) : (
          Object.entries(groupedPasswords).sort().map(([group, items]) => (
            <div key={group} className="space-y-1">
              <button 
                onClick={() => toggleGroup(group)}
                className="flex items-center gap-2 w-full text-left py-2 px-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {expandedGroups[group] === false ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                <Folder size={14} className={cn(group === 'General' ? "text-slate-600" : "text-primary-500/50")} />
                <span className="text-xs font-semibold uppercase tracking-widest">{group}</span>
                <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 rounded-full">{items.length}</span>
              </button>
              
              <AnimatePresence initial={false}>
                {expandedGroups[group] !== false && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1 pl-2">
                    {items.map(p => (
                      <div key={p.id} className="compact-row group">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover:bg-primary-500/40 transition-colors" />
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium text-slate-200 truncate">{p.title}</h3>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-slate-500 truncate">{p.username || '—'}</p>
                              {p.website && (
                                <a 
                                  href={p.website.startsWith('http') ? p.website : `https://${p.website}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-primary-500/60 hover:text-primary-400 flex items-center gap-0.5 transition-colors"
                                >
                                  <ExternalLink size={8} /> URL
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <div className="hidden sm:flex items-center bg-slate-950/50 border border-slate-900 px-2 py-1 rounded mr-2">
                             <input
                               type={showPass[p.id] ? "text" : "password"}
                               readOnly value={p.password}
                               className="bg-transparent border-none text-[11px] font-mono text-slate-400 w-24 focus:ring-0 text-center"
                             />
                          </div>
                          
                          <button onClick={() => setShowPass({...showPass, [p.id]: !showPass[p.id]})} className="btn-icon">
                            {showPass[p.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          
                          <button onClick={() => copyToClipboard(p.password, p.id)} className={cn("btn-icon", copiedId === p.id && "text-green-500")}>
                            {copiedId === p.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>

                          <button onClick={() => deleteEntry(p.id)} className="btn-icon hover:text-red-500 opacity-0 group-hover:opacity-100">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      <footer className="mt-20 border-t border-slate-900 pt-10 text-center">
        <div className="flex items-center justify-center gap-1.5 text-slate-600 text-[10px] uppercase tracking-tighter">
          <Shield size={10} />
          <span>Ultima Parole V2 • Zero Knowledge Architecture</span>
        </div>
      </footer>
    </div>
  );
}
