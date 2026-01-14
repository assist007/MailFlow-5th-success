
import React, { useState, useEffect } from 'react';
import { 
  Globe, AtSign, Activity, CheckCircle2, Clock, CloudLightning, 
  Terminal, CopyCheck, Sliders, Loader2, Save, Trash2, ShieldQuestion, Users, RefreshCw, Server, Zap, Plus
} from 'lucide-react';
import { EmailDomain, User, UserRole, EmailAddress } from './types';

interface InfrastructureViewProps {
  currentUser: User;
  domains: EmailDomain[];
  stats: any;
  selectedDomain: EmailDomain | null;
  addresses: EmailAddress[];
  workerCode: string;
  isUpdatingLimit: boolean;
  onSelectDomain: (domain: EmailDomain) => void;
  onAddDomain: () => void;
  onAddAddress: (localPart: string) => void;
  onUpdateLimit: (limit: number) => void;
  onDeleteDomain: (domain: EmailDomain) => void;
  onSimulateEmail: (address: string) => void;
  onDeleteAddress: (address: EmailAddress) => void;
}

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  currentUser, domains, stats, selectedDomain, addresses, workerCode, isUpdatingLimit,
  onSelectDomain, onAddDomain, onAddAddress, onUpdateLimit, onDeleteDomain, onSimulateEmail, onDeleteAddress
}) => {
  const [localLimit, setLocalLimit] = useState<number>(selectedDomain?.address_limit || 10);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newLocalPart, setNewLocalPart] = useState('');
  const [copySuccess, setCopySuccess] = useState<string>('');

  useEffect(() => {
    if (selectedDomain) {
      setLocalLimit(selectedDomain.address_limit);
      setShowAddressForm(false);
    }
  }, [selectedDomain?.id, selectedDomain?.address_limit]);

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocalPart.trim()) {
      onAddAddress(newLocalPart.trim());
      setNewLocalPart('');
      setShowAddressForm(false);
    }
  };

  const showCopySuccess = (message: string) => {
    setCopySuccess(message);
    setTimeout(() => setCopySuccess(''), 3000);
  };

  const handleCopyWorkerCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(workerCode);
        showCopySuccess('✅ Worker Code copied!');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = workerCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopySuccess('✅ Worker Code copied!');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      alert('❌ Failed to copy. Please manually select and copy the code.');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar transition-colors relative">
      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="fixed top-8 right-8 z-50 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm">{copySuccess}</span>
        </div>
      )}

      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 p-6 lg:px-12 lg:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">System Setup</h1>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Manage your mail domains and routes</p>
        </div>
        {currentUser.role === UserRole.OWNER && (
          <button 
            onClick={onAddDomain} 
            className="flex items-center justify-center gap-3 bg-slate-950 dark:bg-blue-600 text-white font-black px-6 py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" /> 
            <span className="text-xs uppercase tracking-wider">Add Domain</span>
          </button>
        )}
      </header>

      <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full space-y-10 lg:space-y-14">
        {/* Core Status Cards */}
        {currentUser.role === UserRole.OWNER && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0"><Globe className="w-7 h-7" /></div>
                <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Domains</p><p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.domains}</p></div>
             </div>
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0"><Zap className="w-7 h-7" /></div>
                <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mail Routes</p><p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.addresses}</p></div>
             </div>
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shrink-0"><Users className="w-7 h-7" /></div>
                <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Team Size</p><p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{(domains.reduce((acc, d) => acc + (d.user_count || 0), 0))}</p></div>
             </div>
          </div>
        )}

        {/* My Domains Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map(domain => (
            <button 
              key={domain.id} 
              onClick={() => onSelectDomain(domain)} 
              className={`p-8 rounded-[32px] text-left transition-all border-4 relative group ${
                selectedDomain?.id === domain.id 
                  ? 'bg-white dark:bg-slate-900 border-blue-600 shadow-xl' 
                  : 'bg-white dark:bg-slate-900 border-white dark:border-slate-900 hover:border-slate-200 dark:hover:border-slate-800'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${
                domain.is_verified ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {domain.is_verified ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white mb-2 truncate">{domain.domain}</h3>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${
                  domain.is_verified ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30' : 'text-amber-700 bg-amber-50 dark:bg-amber-900/30'
                }`}>
                  {domain.is_verified ? 'Live' : 'Pending'}
                </span>
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                  {domain.address_count}/{domain.address_limit} routes
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Detailed Domain Settings */}
        {selectedDomain && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="lg:col-span-2 space-y-10">
              {currentUser.role === UserRole.OWNER && (
                <section className="bg-slate-950 rounded-[40px] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                       <Terminal className="text-blue-400 w-6 h-6" />
                       <h3 className="font-black text-2xl text-white tracking-tight">Connect to Cloud</h3>
                    </div>
                    <p className="text-slate-400 text-sm mb-10 font-medium leading-relaxed">Paste this logic into your Cloudflare Worker to start receiving emails at <span className="text-white font-bold">@{selectedDomain.domain}</span>.</p>
                    
                    <div className="bg-black/40 rounded-[24px] border border-white/10 p-6 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-6">
                         <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Worker Bridge Code</span>
                         <button 
                           onClick={handleCopyWorkerCode} 
                           className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95"
                         >
                           <CopyCheck className="w-4 h-4" /> Copy Logic
                         </button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar bg-black/60 p-6 rounded-2xl font-mono text-xs text-blue-300/80">
                        <pre className="whitespace-pre">{workerCode}</pre>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <section className="bg-white dark:bg-slate-900 rounded-[40px] p-8 lg:p-12 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                  <div>
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">Active Mail Routes</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Addresses for @{selectedDomain.domain}</p>
                  </div>
                  {addresses.length < selectedDomain.address_limit && (
                    <button 
                      onClick={() => setShowAddressForm(!showAddressForm)} 
                      className="bg-blue-600 text-white font-black px-8 py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all w-full sm:w-auto text-xs uppercase tracking-widest"
                    >
                      {showAddressForm ? 'Cancel' : 'Add New Route'}
                    </button>
                  )}
                </div>

                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="mb-10 p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100/50 animate-in zoom-in duration-300">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 relative">
                        <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
                        <input type="text" placeholder="e.g. info, hello, support" required autoFocus value={newLocalPart} onChange={(e) => setNewLocalPart(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl py-5 pl-14 pr-6 text-base font-bold outline-none transition-all dark:text-white" />
                      </div>
                      <button type="submit" className="bg-slate-950 dark:bg-blue-600 text-white font-black px-8 py-5 rounded-2xl transition-all text-xs uppercase tracking-widest shrink-0">Create Route</button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <p className="font-black text-slate-300 uppercase tracking-widest text-xs">No routes found yet</p>
                    </div>
                  ) : (
                    addresses.map(addr => (
                      <div key={addr.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all">
                        <div className="flex items-center gap-5 min-w-0">
                          <div className={`w-3 h-3 rounded-full ${addr.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="font-black text-slate-800 dark:text-slate-200 text-lg truncate">{addr.local_part}<span className="text-slate-400 font-medium">@{selectedDomain.domain}</span></span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => onSimulateEmail(`${addr.local_part}@${selectedDomain.domain}`)} className="p-3 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all" title="Test Mail"><RefreshCw className="w-5 h-5" /></button>
                          <button onClick={() => onDeleteAddress(addr)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all" title="Delete"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
            
            {/* Sidebar Settings */}
            <div className="space-y-8">
              {currentUser.role === UserRole.OWNER && (
                <section className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="font-black text-xl mb-8 text-slate-900 dark:text-white flex items-center gap-3"><Sliders className="text-blue-600 w-6 h-6" /> Route Limit</h3>
                  <div className="space-y-8">
                     <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-2">Maximum Routes</label>
                       <input type="number" min="1" value={localLimit} onChange={(e) => setLocalLimit(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl py-5 px-8 font-black text-blue-600 text-3xl outline-none transition-all" />
                     </div>
                     <button onClick={() => onUpdateLimit(localLimit)} disabled={isUpdatingLimit} className="w-full py-5 bg-slate-950 dark:bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 text-xs uppercase tracking-widest">
                       {isUpdatingLimit ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Settings
                     </button>
                  </div>
                </section>
              )}

              <section className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <Activity className="w-6 h-6 text-slate-400" />
                  <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Status</h3>
                </div>
                <div className="space-y-5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase">Current Usage</span>
                    <span className="font-black text-slate-900 dark:text-white">{Math.round((selectedDomain.address_count / selectedDomain.address_limit) * 100)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(selectedDomain.address_count / selectedDomain.address_limit) * 100}%` }} />
                  </div>
                  {currentUser.role === UserRole.OWNER && (
                    <button onClick={() => onDeleteDomain(selectedDomain)} className="w-full mt-6 text-red-600 hover:text-red-700 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 py-4 border border-red-50 dark:border-red-900/20 rounded-2xl">
                      <Trash2 className="w-4 h-4" /> Delete Domain
                    </button>
                  )}
                </div>
              </section>
              
              <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[32px] border border-blue-100/50 dark:border-blue-900/20 flex gap-5">
                 <ShieldQuestion className="text-blue-500 shrink-0 w-8 h-8" />
                 <p className="text-xs lg:text-sm text-slate-500 dark:text-blue-300/70 font-bold leading-relaxed">
                   Your mail is private. We never read your content. Administrators only set up the technical cloud routes.
                 </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
