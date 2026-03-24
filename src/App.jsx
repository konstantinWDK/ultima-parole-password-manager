import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, Unlock, Plus, Trash2, Copy, Eye, EyeOff, Search, 
  Download, Upload, Shield, LogOut, Key, Check, AlertCircle, ChevronDown, ChevronRight, Folder,
  ExternalLink, Edit2, X, Paperclip, FileKey
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
  const [vaultExistsOnServer, setVaultExistsOnServer] = useState(false);
  const [passwords, setPasswords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showPass, setShowPass] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [editingId, setEditingId] = useState(null);
  
  // New entry form state
  const [newEntry, setNewEntry] = useState({ title: '', username: '', password: '', project: '', website: '', attachment: null, notes: '' });

  // CSV Mapping state
  const [csvPreview, setCsvPreview] = useState(null);
  const [mapping, setMapping] = useState({ title: '', username: '', password: '', project: '', website: '', notes: '' });
  const [showMapping, setShowMapping] = useState(false);

  // Persistence Key
  const STORAGE_KEY = 'ultima_parole_vault';
  const API_BASE = `http://${window.location.hostname || 'localhost'}:3021/api`;

  // Check if vault exists
  useEffect(() => {
    const checkVault = async () => {
      const localExists = !!localStorage.getItem(STORAGE_KEY);
      let serverExists = false;
      try {
        const resp = await fetch(`${API_BASE}/vault`);
        serverExists = resp.ok;
      } catch (e) {}
      
      setVaultExistsOnServer(serverExists);
      setIsNewVault(!localExists && !serverExists);
    };
    checkVault();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isNewVault && masterPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      let vaultData = null;

      // 1. Try server
      let serverError = false;
      try {
        const resp = await fetch(`${API_BASE}/vault`);
        if (resp.ok) {
          const encrypted = await resp.json();
          vaultData = decryptData(encrypted, masterPassword);
          console.log('Vault loaded from server');
        } else if (resp.status !== 404) {
          serverError = true;
        }
      } catch (err) {
        console.error("Server connection failed", err);
        serverError = true;
      }

      // 2. Try local fallback if server failed or returned nothing
      if (vaultData === null && saved) {
        try {
          const encrypted = JSON.parse(saved);
          vaultData = decryptData(encrypted, masterPassword);
          console.log('Vault loaded from local storage');
        } catch (err) {
          console.error("Local decrypt failed", err);
          throw new Error("Contraseña incorrecta");
        }
      }

      // 3. If still null, and it's NOT a new vault, then we failed to login
      if (vaultData === null && !isNewVault) {
        throw new Error("Contraseña incorrecta");
      }

      // 4. If still null but isNewVault is true, then it's a fresh start
      if (vaultData === null) {
        // If we couldn't reach the server and have no local data, we can't initialize securely
        // because we might overwrite an existing server vault we can't see right now.
        if (serverError) {
           setError("Aviso: No se pudo contactar con el servidor. Se recomienda no inicializar un nuevo baúl para evitar sobreescrituras accidentales en el servidor.");
        }
        vaultData = [];
      }

      const finalVaultData = Array.isArray(vaultData) ? vaultData : [];
      setPasswords(finalVaultData);
      setIsLogged(true);
    } catch (err) {
      setError(err.message || 'Contraseña incorrecta');
    }
  };
  const handleSaveVault = async (updatedPasswords) => {
    const encrypted = encryptData(updatedPasswords, masterPassword);
    
    // Save to local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
    
    // Save to server
    try {
      await fetch(`${API_BASE}/vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encrypted)
      });
    } catch (e) {
      console.error('Failed to save to server');
    }

    setPasswords(updatedPasswords);
    setIsNewVault(false);
  };

  const addEntry = (e) => {
    e.preventDefault();
    if (!newEntry.title || !newEntry.password) return;
    
    let updated;
    if (editingId) {
      updated = passwords.map(p => p.id === editingId ? { ...newEntry, id: editingId } : p);
      setEditingId(null);
    } else {
      updated = [...passwords, { ...newEntry, id: Date.now() }];
    }

    handleSaveVault(updated);
    setNewEntry({ title: '', username: '', password: '', project: '', website: '', attachment: null, notes: '' });
    setIsAdding(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Limit file size to 5MB (for safety)
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setNewEntry(prev => ({
        ...prev,
        attachment: {
          name: file.name,
          data: e.target.result,
          type: file.type
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const downloadAttachment = (attachment) => {
    const a = document.createElement('a');
    a.href = attachment.data;
    a.download = attachment.name;
    a.click();
  };

  const startEdit = (entry) => {
    setNewEntry({ 
      title: entry.title, 
      username: entry.username || '', 
      password: entry.password, 
      project: entry.project || '', 
      website: entry.website || '',
      attachment: entry.attachment || null,
      notes: entry.notes || ''
    });
    setEditingId(entry.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const list = Array.isArray(passwords) ? passwords : [];
    const filtered = list.filter(p => 
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
    const list = Array.isArray(passwords) ? passwords : [];
    const projects = list.map(p => p.project?.trim()).filter(Boolean);
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

  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        return (values || []).map(v => v.replace(/^"|"$/g, '').trim());
      });

      setCsvPreview({ headers, rows });
      
      // Auto-mapping logic
      const newMapping = { title: '', username: '', password: '', project: '', website: '' };
      headers.forEach((h, i) => {
        const lowerH = h.toLowerCase();
        if (lowerH.includes('nombre') || lowerH.includes('title')) newMapping.title = h;
        if (lowerH.includes('usuario') || lowerH.includes('user') || lowerH.includes('log')) newMapping.username = h;
        if (lowerH.includes('correo') || lowerH.includes('email') && !newMapping.username) newMapping.username = h;
        if (lowerH.includes('contrase') || lowerH.includes('pass')) newMapping.password = h;
        if (lowerH.includes('proyecto') || lowerH.includes('tag') || lowerH.includes('project')) newMapping.project = h;
        if (lowerH.includes('enlace') || lowerH.includes('url') || lowerH.includes('web')) newMapping.website = h;
        if (lowerH.includes('nota') || lowerH.includes('comment') || lowerH.includes('info')) newMapping.notes = h;
      });
      
      setMapping(newMapping);
      setShowMapping(true);
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const executeImport = () => {
    const { headers, rows } = csvPreview;
    const newEntries = [];
    
    rows.forEach((row, i) => {
      const entry = { title: '', username: '', password: '', project: '', website: '' };
      
      Object.entries(mapping).forEach(([field, colName]) => {
        if (!colName) return;
        const colIndex = headers.indexOf(colName);
        if (colIndex !== -1) entry[field] = row[colIndex] || '';
      });

      if (entry.title && entry.password) {
        newEntries.push({
          ...entry,
          id: Date.now() + i
        });
      }
    });

    if (newEntries.length > 0) {
      handleSaveVault([...passwords, ...newEntries]);
      alert(`${newEntries.length} entradas importadas correctamente.`);
      setShowMapping(false);
      setCsvPreview(null);
    } else {
      alert("No se encontraron entradas válidas para importar.");
    }
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
              placeholder={isNewVault ? "Nueva Contraseña Maestra" : (vaultExistsOnServer && !localStorage.getItem(STORAGE_KEY) ? "Contraseña del Servidor" : "Contraseña Maestra")}
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
              {isNewVault ? "Inicializar Vault" : (vaultExistsOnServer && !localStorage.getItem(STORAGE_KEY) ? "Sincronizar y Desbloquear" : "Desbloquear")}
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
          <label className="btn-secondary px-3 py-1.5 text-xs cursor-pointer flex items-center gap-1.5">
            <Upload size={14} /> Importar CSV
            <input type="file" hidden accept=".csv" onChange={handleCSVImport} />
          </label>
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
        <button onClick={() => {
          if (isAdding) {
            setIsAdding(false);
            setEditingId(null);
            setNewEntry({ title: '', username: '', password: '', project: '', website: '', attachment: null, notes: '' });
          } else {
            setIsAdding(true);
          }
        }} className="btn-primary px-3 h-10">
          {isAdding ? <X size={18} /> : <Plus size={18} />} <span className="hidden sm:inline">{isAdding ? "Cancelar" : "Nueva"}</span>
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
            
            <textarea 
              placeholder="Notas / Comentarios adicionales (opcional)" 
              className="input-field min-h-[80px] py-3 resize-none" 
              value={newEntry.notes} 
              onChange={e => setNewEntry({...newEntry, notes: e.target.value})}
            />

            <div className="relative group">
              <input placeholder="Contraseña" type="text" className="input-field pr-24" value={newEntry.password} onChange={e => setNewEntry({...newEntry, password: e.target.value})} required />
              <button type="button" onClick={() => setNewEntry({...newEntry, password: generatePassword()})} className="absolute right-2 top-1.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition-colors">
                GENERAR
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <div className="input-field flex items-center gap-2 cursor-pointer group hover:border-primary-500/50 transition-colors">
                  <Paperclip size={14} className={cn(newEntry.attachment ? "text-primary-500" : "text-slate-500")} />
                  <span className="text-xs text-slate-400 group-hover:text-slate-300">
                    {newEntry.attachment ? `Archivo: ${newEntry.attachment.name}` : "Adjuntar Certificado Digital (P12, CRT...)"}
                  </span>
                  <input type="file" hidden onChange={handleFileChange} />
                </div>
              </label>
              {newEntry.attachment && (
                <button 
                  type="button" 
                  onClick={() => setNewEntry({...newEntry, attachment: null})}
                  className="btn-icon text-red-500/50 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1 h-10">
                {editingId ? "Guardar Cambios" : "Guardar Seguro"}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingId(null);
                    setIsAdding(false);
                    setNewEntry({ title: '', username: '', password: '', project: '', website: '', attachment: null, notes: '' });
                  }} 
                  className="btn-secondary px-4 h-10"
                >
                  Cancelar
                </button>
              )}
            </div>
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
                            {p.notes && (
                              <p className="text-[10px] text-slate-600 mt-1 line-clamp-2 italic border-l border-slate-800 pl-2 leading-relaxed">
                                {p.notes}
                              </p>
                            )}
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
                          
                           {p.attachment && (
                             <button 
                               onClick={() => downloadAttachment(p.attachment)} 
                               className="btn-icon text-primary-500/80 hover:text-primary-400"
                               title={`Descargar ${p.attachment.name}`}
                             >
                               <FileKey size={14} />
                             </button>
                           )}
                           
                           <button onClick={() => setShowPass({...showPass, [p.id]: !showPass[p.id]})} className="btn-icon">
                             {showPass[p.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                           </button>
                          
                          <button onClick={() => copyToClipboard(p.password, p.id)} className={cn("btn-icon", copiedId === p.id && "text-green-500")}>
                            {copiedId === p.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>

                          <button onClick={() => startEdit(p)} className="btn-icon">
                            <Edit2 size={14} />
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

      {/* Mapping Modal */}
      <AnimatePresence>
        {showMapping && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-lg border-slate-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Mapear Columnas CSV</h2>
                <button onClick={() => setShowMapping(false)} className="btn-icon">
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-xs text-slate-400">Selecciona qué columna de tu CSV corresponde a cada campo de Ultima Parole.</p>
              
              <div className="space-y-4">
                {[
                  { key: 'title', label: 'Nombre / Título', required: true },
                  { key: 'username', label: 'Usuario / Email' },
                  { key: 'password', label: 'Contraseña', required: true },
                  { key: 'website', label: 'URL / Sitio Web' },
                  { key: 'project', label: 'Proyecto / Tag' },
                  { key: 'notes', label: 'Notas / Comentarios' }
                ].map(field => (
                  <div key={field.key} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-300">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <select 
                      className="input-field py-1"
                      value={mapping[field.key]}
                      onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    >
                      <option value="">-- No mapear --</option>
                      {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold mb-2 uppercase tracking-widest text-slate-500">Vista Previa (1ª fila)</h3>
                <div className="bg-slate-900/50 rounded p-2 text-[10px] font-mono overflow-x-auto whitespace-nowrap">
                  <div className="flex gap-2 mb-1 border-b border-slate-800 pb-1">
                    {csvPreview.headers.map((h, i) => (
                      <span key={i} className="text-slate-400 min-w-[80px]">{h}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {csvPreview.rows[0]?.map((v, i) => (
                      <span key={i} className="text-slate-200 min-w-[80px]">{v}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={executeImport} className="btn-primary flex-1 py-2">
                  Confirmar Importación
                </button>
                <button onClick={() => setShowMapping(false)} className="btn-secondary px-6">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
