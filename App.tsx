
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, EmailFolder, Email, EmailDomain, EmailAddress } from './types';
import { mockCurrentUser } from './services/mockData';
import { api } from './services/apiService';
import { 
  supabase, 
  isSupabaseConfigured, 
  getSupabaseConfig, 
  getStoredSchema 
} from './services/supabaseClient';
import { INITIAL_SQL } from './services/sqlBlueprint';
import { Menu } from 'lucide-react';

// Import Modular Components
import { Sidebar } from './Sidebar';
import { MailView } from './MailView';
import { InfrastructureView } from './InfrastructureView';
import { DashboardView } from './DashboardView';
import { Modals } from './Modals';

const App: React.FC = () => {
  // Central State
  const [currentUser] = useState<User>(mockCurrentUser);
  const [currentFolder, setCurrentFolder] = useState<EmailFolder>(EmailFolder.INBOX);
  const [emails, setEmails] = useState<Email[]>([]);
  const [domains, setDomains] = useState<EmailDomain[]>([]);
  const [addresses, setAddresses] = useState<EmailAddress[]>([]);
  const [stats, setStats] = useState({ domains: 0, addresses: 0, emails: 0 });
  const [selectedDomain, setSelectedDomain] = useState<EmailDomain | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'mail' | 'admin'>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('mailflow_theme') as 'light' | 'dark') || 'light');
  const [sidebarMode, setSidebarMode] = useState<'expanded' | 'collapsed' | 'hover'>(() => (localStorage.getItem('mailflow_sidebar_mode') as any) || 'expanded');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modal States
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<any>(null);

  const { key: supabaseKey, url: supabaseUrl } = getSupabaseConfig();

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mailflow_theme', theme);
  }, [theme]);

  // Persist Sidebar Mode
  useEffect(() => {
    localStorage.setItem('mailflow_sidebar_mode', sidebarMode);
  }, [sidebarMode]);

  const loadData = useCallback(async (refreshSelected = true) => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    if (refreshSelected) setIsLoading(true);

    try {
      const sysStats = await api.getStats(currentUser.id);
      setStats(sysStats);

      if (view === 'mail' || view === 'home') {
        const data = await api.fetchEmails(view === 'home' ? EmailFolder.INBOX : currentFolder, currentUser.id);
        setEmails(data);
      } 
      
      if (view === 'admin' || view === 'home') {
        const domainData = await api.fetchDomains(currentUser.id);
        setDomains(domainData);

        let activeDomain = selectedDomain;
        if (!activeDomain && domainData.length > 0) {
          activeDomain = domainData[0];
          setSelectedDomain(activeDomain);
        } else if (activeDomain) {
          const fresh = domainData.find(d => d.id === activeDomain?.id);
          if (fresh) {
            activeDomain = fresh;
            setSelectedDomain(fresh);
          }
        }

        if (activeDomain) {
          const addrData = await api.fetchAddresses(activeDomain.id);
          setAddresses(addrData);
        }
      }
    } catch (err: any) { 
      console.error("LoadData Error:", err); 
    } finally { 
      setIsLoading(false); 
    }
  }, [currentFolder, view, currentUser.id, selectedDomain?.id]);

  useEffect(() => {
    loadData();
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public' }, () => { 
      loadData(false);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const workerCode = useMemo(() => {
    if (!selectedDomain) return '';
    return `export default { async email(message, env, ctx) { } };`;
  }, [selectedDomain, currentUser.id, supabaseUrl, supabaseKey]);

  const handleNavigate = (newView: 'home' | 'mail' | 'admin', folder?: EmailFolder) => {
    setView(newView);
    if (folder) setCurrentFolder(folder);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-200 transition-colors duration-300 relative">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          currentUser={currentUser} 
          currentFolder={currentFolder} 
          view={view} 
          sidebarMode={sidebarMode}
          onSetSidebarMode={setSidebarMode}
          unreadCount={emails.filter(e => e.folder === EmailFolder.INBOX && !e.is_read).length}
          onSetView={(v) => handleNavigate(v as any)} 
          onSetFolder={(f) => handleNavigate('mail', f)} 
          onOpenConfig={() => { setIsConfigOpen(true); setIsMobileMenuOpen(false); }}
          onOpenCompose={() => { setIsComposeOpen(true); setIsMobileMenuOpen(false); }}
          theme={theme}
          onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-black text-xl text-blue-600">MailFlow</span>
          <div className="w-10" />
        </div>

        {view === 'home' && (
          <DashboardView 
            currentUser={currentUser}
            stats={stats}
            unreadCount={emails.filter(e => e.folder === EmailFolder.INBOX && !e.is_read).length}
            recentEmails={emails}
            onNavigate={handleNavigate}
            onCompose={() => setIsComposeOpen(true)}
          />
        )}

        {view === 'mail' && (
          <MailView 
            emails={emails} 
            selectedThreadId={selectedThreadId} 
            onSelectThread={setSelectedThreadId}
            onToggleStar={(email) => api.toggleStar(email.id, email.is_starred).then(() => loadData(false))}
            isLoading={isLoading}
            onReload={loadData}
            currentUser={currentUser}
            currentFolder={currentFolder}
          />
        )}

        {view === 'admin' && (
          <InfrastructureView 
            currentUser={currentUser}
            domains={domains}
            stats={stats}
            selectedDomain={selectedDomain}
            addresses={addresses}
            workerCode={workerCode}
            isUpdatingLimit={false}
            onSelectDomain={setSelectedDomain}
            onAddDomain={() => setIsAddDomainOpen(true)}
            onAddAddress={async (localPart) => {
              if(!selectedDomain) return;
              try {
                await api.addAddress(selectedDomain.id, localPart, currentUser.id);
                loadData();
              } catch (err) {
                alert("Failed to create route. Check address limit.");
              }
            }}
            onUpdateLimit={async (limit) => {
              if (!selectedDomain) return;
              await supabase.from('email_domains').update({ address_limit: limit }).eq('id', selectedDomain.id);
              loadData();
            }}
            onDeleteDomain={(d) => { setConfirmModalConfig({type:'domain', id:d.id, label:d.domain}); setShowConfirmModal(true); }}
            onSimulateEmail={api.simulateIncomingEmail}
            onDeleteAddress={(a) => { setConfirmModalConfig({type:'address', id:a.id, label:`${a.local_part}@${selectedDomain?.domain}`}); setShowConfirmModal(true); }}
          />
        )}
      </main>

      <Modals 
        isComposeOpen={isComposeOpen} onCloseCompose={() => setIsComposeOpen(false)}
        isConfigOpen={isConfigOpen} onCloseConfig={() => setIsConfigOpen(false)}
        isAddDomainOpen={isAddDomainOpen} onCloseAddDomain={() => setIsAddDomainOpen(false)}
        showConfirmModal={showConfirmModal} onCloseConfirm={() => setShowConfirmModal(false)}
        confirmConfig={confirmModalConfig}
        initialSql={INITIAL_SQL}
        currentUser={currentUser}
        onReload={loadData}
      />
    </div>
  );
};

export default App;
