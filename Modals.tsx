
import React, { useState, useEffect } from 'react';
import { 
  X, Send, Wand2, Loader2, Database, Link as LinkIcon, 
  Code, Key, Save, AlertTriangle, Edit3, Copy, Mail, ShieldCheck, Server,
  Sparkles, Globe
} from 'lucide-react';
import { User } from './types';
import { api } from './services/apiService';
import { generateEmailDraft } from './services/geminiService';
import { 
  saveSupabaseConfig, 
  getSupabaseConfig, 
  saveStoredSchema, 
  getStoredSchema 
} from './services/supabaseClient';

interface ModalsProps {
  isComposeOpen: boolean;
  onCloseCompose: () => void;
  isConfigOpen: boolean;
  onCloseConfig: () => void;
  isAddDomainOpen: boolean;
  onCloseAddDomain: () => void;
  showConfirmModal: boolean;
  onCloseConfirm: () => void;
  confirmConfig: any;
  initialSql: string;
  currentUser: User;
  onReload: () => void;
}

export const Modals: React.FC<ModalsProps> = ({ 
  isComposeOpen, onCloseCompose, isConfigOpen, onCloseConfig, isAddDomainOpen, 
  onCloseAddDomain, showConfirmModal, onCloseConfirm, confirmConfig, initialSql, currentUser, onReload 
}) => {
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<'connection' | 'sql'>('connection');
  const [isEditingSql, setIsEditingSql] = useState(false);
  const { url: curUrl, key: curKey } = getSupabaseConfig();
  const [url, setUrl] = useState(curUrl);
  const [key, setKey] = useState(curKey);
  const [editableSql, setEditableSql] = useState('');

  useEffect(() => {
    if (isConfigOpen && activeConfigTab === 'sql') setEditableSql(getStoredSchema(initialSql));
  }, [isConfigOpen, activeConfigTab, initialSql]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await api.sendEmail({ 
        ...composeData, 
        user_id: currentUser.id, 
        from_address: currentUser.email, 
        thread_id: `thread_${Date.now()}` 
      });
      setComposeData({ to: '', subject: '', body: '' });
      onCloseCompose();
      onReload();
    } catch (err) { alert("Sending failed, please try again."); } finally { setIsSending(false); }
  };

  const handleSaveSchema = () => {
    saveStoredSchema(editableSql);
    setIsEditingSql(false);
    alert("System logic saved successfully.");
  };

  return (
    <>
      {/* New Mail Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center lg:p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full h-full lg:h-auto lg:max-w-4xl lg:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><Mail className="text-blue-600 dark:text-blue-400 w-6 h-6" /></div>
                <h3 className="font-black text-slate-900 dark:text-white text-2xl tracking-tighter">Write New Mail</h3>
              </div>
              <button onClick={onCloseCompose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><X className="text-slate-400 w-7 h-7" /></button>
            </div>
            <form className="p-8 lg:p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1" onSubmit={handleSend}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 block">To</label>
                  <input type="email" placeholder="friend@example.com" required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-xl p-4 text-sm font-bold outline-none transition-all dark:text-white" value={composeData.to} onChange={e=>setComposeData({...composeData, to:e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 block">Subject</label>
                  <input type="text" placeholder="What's this about?" required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-xl p-4 text-sm font-bold outline-none transition-all dark:text-white" value={composeData.subject} onChange={e=>setComposeData({...composeData, subject:e.target.value})} />
                </div>
              </div>
              
              {/* AI Assistant Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl flex flex-col gap-6 relative overflow-hidden group">
                <Sparkles className="absolute -right-8 -top-8 w-40 h-40 opacity-10 rotate-12" />
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase text-blue-100 tracking-widest flex items-center gap-2 mb-3">
                    <Wand2 className="w-4 h-4" /> Smart Mail Writer
                  </span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      placeholder="Write a thank you mail for a job interview..." 
                      className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-sm font-bold outline-none text-white placeholder:text-blue-100/50" 
                      value={aiPrompt} 
                      onChange={e=>setAiPrompt(e.target.value)} 
                    />
                    <button type="button" onClick={async () => { if(!aiPrompt) return; setIsGenerating(true); const d = await generateEmailDraft(aiPrompt); setComposeData({...composeData, body: d}); setIsGenerating(false); setAiPrompt(''); }} className="bg-white text-blue-600 px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-wider shrink-0 flex items-center justify-center gap-2 hover:scale-105 transition-all">
                      {isGenerating ? <Loader2 className="animate-spin w-4 h-4"/> : <Wand2 className="w-4 h-4" />}
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 block">Message Body</label>
                <textarea placeholder="Start typing your message here..." required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-[32px] p-8 min-h-[300px] outline-none transition-all resize-none font-medium text-base lg:text-lg dark:text-white leading-relaxed" value={composeData.body} onChange={e=>setComposeData({...composeData, body:e.target.value})} />
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-4 pb-4">
                <button type="button" onClick={onCloseCompose} className="font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-8 py-4 uppercase text-xs tracking-widest">Discard</button>
                <button type="submit" disabled={isSending} className="bg-slate-950 dark:bg-blue-600 text-white px-10 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-50 text-sm uppercase tracking-widest">
                  {isSending ? <Loader2 className="animate-spin w-5 h-5"/> : <Send className="w-5 h-5" />} Send Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Settings Modal - FIXED FOR DESKTOP SCREENSHOT 3 */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[300] flex items-center justify-center lg:p-6 animate-in zoom-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full h-full lg:h-[85vh] lg:max-w-6xl lg:rounded-[50px] shadow-3xl overflow-hidden flex flex-col border border-white/5">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-4 mb-1">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><Database className="text-blue-600 dark:text-blue-400 w-7 h-7" /></div>
                  <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tighter">System Setup</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-14">Configure your cloud and database</p>
              </div>
              <button onClick={onCloseConfig} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><X className="w-8 h-8 text-slate-400" /></button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 p-4 lg:p-8 space-y-3 bg-slate-50/30 dark:bg-slate-950/10 shrink-0 flex lg:flex-col gap-2">
                <button onClick={() => setActiveConfigTab('connection')} className={`flex-1 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeConfigTab === 'connection' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-slate-100 dark:border-slate-700' : 'text-slate-400 hover:bg-white/50'}`}>
                  <LinkIcon className="w-4 h-4" /> Cloud Link
                </button>
                <button onClick={() => setActiveConfigTab('sql')} className={`flex-1 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeConfigTab === 'sql' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-slate-100 dark:border-slate-700' : 'text-slate-400 hover:bg-white/50'}`}>
                  <Code className="w-4 h-4" /> SQL Blueprint
                </button>
              </aside>

              <main className="flex-1 p-8 lg:p-14 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                {activeConfigTab === 'connection' ? (
                  <div className="max-w-lg mx-auto space-y-10 py-10">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Cloud URL</label>
                        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl py-5 px-8 text-sm font-bold outline-none transition-all dark:text-white shadow-inner" placeholder="https://abc.supabase.co" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Cloud Secret Key</label>
                        <div className="relative">
                          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl py-5 px-8 text-sm font-bold outline-none transition-all pr-14 dark:text-white shadow-inner" placeholder="Enter key here" />
                          <Key className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600" />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => saveSupabaseConfig(url, key)} className="w-full py-6 bg-slate-950 dark:bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all text-sm uppercase tracking-widest">Update Connection</button>
                  </div>
                ) : (
                  <div className="space-y-6 h-full flex flex-col">
                    <div className="flex justify-between items-center shrink-0">
                      <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Database Script</h4>
                      <div className="flex gap-2">
                        {isEditingSql ? (
                          <button onClick={handleSaveSchema} className="flex items-center gap-2 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg"><Save className="w-4 h-4" /> Save</button>
                        ) : (
                          <button onClick={() => setIsEditingSql(true)} className="flex items-center gap-2 bg-slate-950 dark:bg-slate-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg"><Edit3 className="w-4 h-4" /> Edit</button>
                        )}
                        <button onClick={() => { navigator.clipboard.writeText(editableSql); alert("Copied!"); }} className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 px-6 py-3 rounded-xl"><Copy className="w-4 h-4" /> Copy</button>
                      </div>
                    </div>
                    <div className="flex-1 relative min-h-[400px]">
                      {isEditingSql ? (
                        <textarea value={editableSql} onChange={(e) => setEditableSql(e.target.value)} className="w-full h-full bg-[#0d1117] text-blue-300 font-mono text-sm p-8 rounded-3xl border-2 border-blue-500/30 outline-none resize-none" spellCheck={false} />
                      ) : (
                        <div className="w-full h-full bg-[#0d1117] rounded-3xl p-8 border border-white/5 overflow-y-auto custom-scrollbar"><pre className="text-sm font-mono text-blue-400/70 whitespace-pre">{editableSql}</pre></div>
                      )}
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[400] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-3xl p-10 lg:p-12 text-center border border-white/5">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-red-600"><AlertTriangle className="w-10 h-10" /></div>
            <h3 className="font-black text-2xl lg:text-3xl text-slate-900 dark:text-white mb-4 tracking-tighter">Are you sure?</h3>
            <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">You are about to delete <span className="text-red-600 font-black">{confirmConfig?.label}</span>. This cannot be undone and all data will be lost.</p>
            <div className="flex flex-col-reverse sm:flex-row gap-4">
              <button onClick={onCloseConfirm} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-2xl text-[10px] uppercase tracking-widest">Go Back</button>
              <button onClick={() => { if(confirmConfig.type==='domain') api.deleteDomain(confirmConfig.id).then(()=>{onReload(); onCloseConfirm();}); else api.deleteAddress(confirmConfig.id).then(()=>{onReload(); onCloseConfirm();}); }} className="flex-1 py-5 bg-red-600 text-white font-black rounded-2xl shadow-lg hover:bg-red-700 transition-all text-[10px] uppercase tracking-widest">Delete Forever</button>
            </div>
          </div>
        </div>
      )}
      
      {/* New Domain Modal */}
      {isAddDomainOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg z-[200] flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-3xl p-10 lg:p-14 border border-white/5 relative overflow-hidden">
            <Globe className="absolute -right-12 -top-12 w-48 h-48 opacity-5 text-blue-600 -rotate-12" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><Server className="text-blue-600 dark:text-blue-400 w-7 h-7" /></div>
                <h3 className="font-black text-2xl lg:text-3xl text-slate-900 dark:text-white tracking-tighter">New Domain</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-10 ml-14">Add a new email domain to your system</p>
              <form onSubmit={async(e)=>{
                e.preventDefault(); 
                const d=(e.currentTarget.elements.namedItem('domain') as HTMLInputElement).value; 
                if(d){ await api.addDomain(d, currentUser.id); onCloseAddDomain(); onReload(); }
              }} className="space-y-8">
                <div className="relative">
                  <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
                  <input name="domain" type="text" required placeholder="example.com" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl py-6 pl-16 pr-8 text-lg font-black outline-none transition-all dark:text-white" />
                </div>
                <div className="flex flex-col gap-4">
                  <button type="submit" className="w-full py-6 bg-slate-950 dark:bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all text-sm uppercase tracking-widest">Add Now</button>
                  <button type="button" onClick={onCloseAddDomain} className="w-full text-slate-400 font-black text-[10px] hover:text-slate-600 transition-all uppercase tracking-widest">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
