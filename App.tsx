
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
import { Menu, X } from 'lucide-react';

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
  const [view, setView] = useState<'home' | 'mail' | 'admin'>('home'); // Set default to home
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('mailflow_theme') as 'light' | 'dark') || 'light');
  
  // Sidebar Modes: expanded, collapsed, hover
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
    if (!isSupabaseConfigured) return;
    if (refreshSelected) setIsLoading(true);

    try {
      // Always fetch stats for dashboard/sidebar counts
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
    return `/**
MailFlow Secure Bridge Worker (Bangla Support Edition)
Security: Only accepts emails for REGISTERED addresses.
Decoding: Enhanced support for base64 and quoted-printable UTF-8 content.
*/
export default {
  async email(message, env, ctx) {
    const to = message.to;
    const [local, domain] = to.split('@');
    const domainId = "${selectedDomain.id}";
    const userId = "${currentUser.id}";
    const headers = {
      "Content-Type": "application/json",
      "apikey": "${supabaseKey}",
      "Authorization": "Bearer ${supabaseKey}",
    };

    // 1. Helpers for Decoding UTF-8
    const decodeBase64 = (b64) => {
      try {
        const binString = atob(b64.replace(/\\s/g, ""));
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) {
          bytes[i] = binString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
      } catch(e) { return b64; }
    };

    const decodeQP = (str) => {
      const bytes = [];
      const clean = str.replace(/=\\r?\\n/g, '');
      for (let i = 0; i < clean.length; i++) {
        if (clean[i] === '=' && /^[0-9A-F]{2}$/i.test(clean.substr(i+1, 2))) {
          bytes.push(parseInt(clean.substr(i+1, 2), 16));
          i += 2;
        } else {
          bytes.push(clean.charCodeAt(i));
        }
      }
      return new TextDecoder().decode(new Uint8Array(bytes));
    };

    const cleanContent = (content, encoding) => {
      let result = content.trim();
      const enc = encoding.toLowerCase();
      if (enc === 'base64') result = decodeBase64(result);
      else if (enc === 'quoted-printable') result = decodeQP(result);
      return result;
    };

    // 2. Security Check: Validate Address
    const addrCheck = await fetch("${supabaseUrl}/rest/v1/email_addresses?local_part=eq." + local + "&domain_id=eq." + domainId + "&select=id,is_active", {
      method: "GET",
      headers
    });
    
    const addresses = await addrCheck.json();
    if (addresses.length === 0) return; 
    
    const addrRecord = addresses[0];
    const from = message.from;
    const subject = message.headers.get("subject") || "No Subject";
    
    // 3. MIME Parsing
    const raw = await new Response(message.raw).text();
    let finalBodyText = "";
    let finalBodyHtml = null;

    const separatorMatch = raw.match(/(\\r?\\n\\r?\\n)/);
    if (separatorMatch) {
      const separator = separatorMatch[1];
      const separatorIndex = raw.indexOf(separator);
      const headerBlock = raw.substring(0, separatorIndex);
      const bodyBlock = raw.substring(separatorIndex + separator.length);
      
      const boundaryMatch = headerBlock.match(/boundary="?([^";\\r\\n]+)"?/i);
      
      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const parts = bodyBlock.split("--" + boundary);
        
        for (let part of parts) {
          part = part.trim();
          if (!part || part === "--") continue;
          
          const partSepMatch = part.match(/(\\r?\\n\\r?\\n)/);
          if (partSepMatch) {
            const partSep = partSepMatch[1];
            const partSepIdx = part.indexOf(partSep);
            const partHeader = part.substring(0, partSepIdx);
            const partContent = part.substring(partSepIdx + partSep.length).trim();
            
            const encMatch = partHeader.match(/Content-Transfer-Encoding:\\s*([^\\r\\n]+)/i);
            const encoding = encMatch ? encMatch[1].trim() : "7bit";
            
            if (partHeader.match(/Content-Type:\\s*text\\/html/i)) {
              finalBodyHtml = cleanContent(partContent, encoding);
            } else if (partHeader.match(/Content-Type:\\s*text\\/plain/i) && !finalBodyText) {
              finalBodyText = cleanContent(partContent, encoding);
            }
          }
        }
      } else {
        const encMatch = headerBlock.match(/Content-Transfer-Encoding:\\s*([^\\r\\n]+)/i);
        const encoding = encMatch ? encMatch[1].trim() : "7bit";
        const ctMatch = headerBlock.match(/Content-Type:\\s*([^;\\r\\n]+)/i);
        const contentType = ctMatch ? ctMatch[1].trim() : "text/plain";
        
        if (contentType.includes("text/html")) finalBodyHtml = cleanContent(bodyBlock, encoding);
        else finalBodyText = cleanContent(bodyBlock, encoding);
      }
    }
    
    if (!finalBodyText && !finalBodyHtml) finalBodyText = raw.substring(0, 1000);

    // 4. Persistence
    await fetch("${supabaseUrl}/rest/v1/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from_address: from,
        to_address: to,
        subject,
        body_text: finalBodyText,
        body_html: finalBodyHtml,
        folder: "inbox",
        is_read: false,
        thread_id: "thread_" + Date.now(),
        user_id: userId,
        domain_id: domainId
      })
    });

    if (!addrRecord.is_active) {
      await fetch("${supabaseUrl}/rest/v1/email_addresses?id=eq." + addrRecord.id, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ is_active: true })
      });
    }

    await fetch("${supabaseUrl}/rest/v1/email_domains?id=eq." + domainId, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ is_verified: true, is_active: true })
    });
  }
};`;
  }, [selectedDomain, currentUser.id, supabaseUrl, supabaseKey]);

  const handleNavigate = (newView: 'home' | 'mail' | 'admin', folder?: EmailFolder) => {
    setView(newView);
    if (folder) setCurrentFolder(folder);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-200 transition-colors duration-300 relative">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
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
        {/* Mobile Header Toggle */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-black text-xl text-blue-600">MailFlow</span>
          <div className="w-10" /> {/* Spacer */}
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
