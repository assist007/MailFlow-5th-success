
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
import { InfoView } from './InfoView';
import { SettingsView } from './SettingsView';
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
  const [view, setView] = useState<'info' | 'home' | 'mail' | 'admin' | 'settings'>('info');
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
  
  // Settings State - for dynamic Supabase config
  const [settingsUrl, setSettingsUrl] = useState<string>(() => 
    localStorage.getItem('mailflow_supabase_url') || supabaseUrl || ''
  );
  const [settingsKey, setSettingsKey] = useState<string>(() => 
    localStorage.getItem('mailflow_supabase_key') || supabaseKey || ''
  );

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

  // Handle Settings Save
  const handleSettingsSave = () => {
    localStorage.setItem('mailflow_supabase_url', settingsUrl);
    localStorage.setItem('mailflow_supabase_key', settingsKey);
  };

  // Handle URL hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/info' || hash === '') {
        setView(hash === '' ? 'info' : 'info');
      } else if (hash === '#/' || hash === '') {
        setView('home');
      } else if (hash.startsWith('#/mail/')) {
        const folder = hash.replace('#/mail/', '').toUpperCase() as EmailFolder;
        setView('mail');
        setCurrentFolder(folder);
      } else if (hash === '#/system-setup') {
        setView('admin');
      } else if (hash === '#/settings') {
        setView('settings');
      }
    };

    // Handle initial load
    handleHashChange();

    // Listen for hash changes (back/forward button)
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
    
    // Real-time subscription for new emails
    const channel = supabase
      .channel('email-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'emails' 
      }, (payload) => { 
        console.log('✉️ New email received!', payload);
        loadData(false);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'email_domains' 
      }, () => { 
        loadData(false);
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const workerCode = useMemo(() => {
    if (!selectedDomain) return '';
    const url = settingsUrl || supabaseUrl;
    const key = settingsKey || supabaseKey;
    
    if (!url || !key) {
      return "// ⚠️ Error: Supabase URL or Key not configured! Go to Settings to configure.";
    }
    
    return `
const SUPABASE_URL = "${url}";
const SUPABASE_KEY = "${key}";

function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return text.replace(/[&<>"']/g, m => map[m]);
}

export default {
  async fetch(request) {
    return new Response("Email Worker is running", { status: 200 });
  },

  async email(message, env, ctx) {
    console.log("📧 Email received:", message.from, "→", message.to);
    
    try {
      // Parse email
      const from = message.from;
      const to = message.to;
      const subject = message.headers.get("subject") || "(No subject)";
      
      // Get email content - read the raw email first
      let bodyText = "";
      let bodyHtml = "";
      
      try {
        // Read raw email as text
        const rawEmail = await new Response(message.raw).text();
        
        // Helper function to decode base64 with UTF-8 support
        function decodeBase64UTF8(str) {
          try {
            // Remove whitespace
            const cleaned = str.replace(/\\s/g, '');
            // Decode base64 to binary
            const binary = atob(cleaned);
            // Convert binary to UTF-8
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            // Decode UTF-8 bytes to string
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(bytes);
          } catch (e) {
            console.log("Base64 decode error:", e.message);
            return str;
          }
        }
        
        // Extract plain text body (between Content-Type: text/plain and next boundary)
        let textMatch = rawEmail.match(/Content-Type: text\\/plain[^\\r\\n]*(?:\\r?\\n[^:\\r\\n]+:[^\\r\\n]*)*\\r?\\n\\r?\\n([\\s\\S]*?)(?=\\r?\\n--)/i);
        if (textMatch && textMatch[1]) {
          let textContent = textMatch[1].trim();
          // Check if this section uses base64 encoding
          if (rawEmail.includes("Content-Transfer-Encoding: base64")) {
            textContent = decodeBase64UTF8(textContent);
          }
          bodyText = textContent;
        }
        
        // Extract HTML body (between Content-Type: text/html and next boundary)
        let htmlMatch = rawEmail.match(/Content-Type: text\\/html[^\\r\\n]*(?:\\r?\\n[^:\\r\\n]+:[^\\r\\n]*)*\\r?\\n\\r?\\n([\\s\\S]*?)(?=\\r?\\n--)/i);
        if (htmlMatch && htmlMatch[1]) {
          let htmlContent = htmlMatch[1].trim();
          // Check if this section uses base64 encoding
          if (rawEmail.includes("Content-Transfer-Encoding: base64")) {
            htmlContent = decodeBase64UTF8(htmlContent);
          }
          bodyHtml = htmlContent;
        } else if (bodyText) {
          bodyHtml = \`<div style="font-family: sans-serif; padding: 20px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; max-width: 100%; overflow-wrap: break-word;">\${escapeHtml(bodyText)}</div>\`;
        } else {
          bodyText = "(No content)";
          bodyHtml = "<p style='color: #888;'>(No content)</p>";
        }
        
        console.log("✅ Email body extracted, length:", bodyText.length);
      } catch (e) {
        console.log("Could not parse email body:", e.message);
        bodyText = "Could not parse email content";
        bodyHtml = "<p style='color: #888;'>Could not parse email content</p>";
      }

      // Extract domain from recipient
      const toParts = to.split("@");
      if (!toParts[1]) {
        console.error("Invalid recipient address:", to);
        return;
      }
      
      const domain = toParts[1];

      // Get domain ID from Supabase
      console.log("Querying Supabase for domain:", domain);
      const domainRes = await fetch(
        \`\${SUPABASE_URL}/rest/v1/email_domains?domain=eq.\${encodeURIComponent(domain)}\`,
        {
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": \`Bearer \${SUPABASE_KEY}\`,
            "Accept": "application/json"
          }
        }
      );

      if (!domainRes.ok) {
        console.error("Domain query failed:", domainRes.status, await domainRes.text());
        return;
      }

      const domains = await domainRes.json();
      if (!domains || !Array.isArray(domains) || domains.length === 0) {
        console.log("Domain not found in database:", domain);
        return;
      }

      const domainId = domains[0].id;
      const ownerId = domains[0].owner_id;
      const isVerified = domains[0].is_verified;

      console.log("Domain found:", domainId, "Owner:", ownerId);

      // Auto-verify domain on first successful email
      if (!isVerified) {
        console.log("🔐 Auto-verifying domain...");
        await fetch(\`\${SUPABASE_URL}/rest/v1/email_domains?id=eq.\${domainId}\`, {
          method: "PATCH",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": \`Bearer \${SUPABASE_KEY}\`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ is_verified: true })
        });
      }

      // Auto-activate email address on first email received
      const localPart = toParts[0];
      console.log("🔍 Looking for address:", localPart);
      const addressRes = await fetch(
        \`\${SUPABASE_URL}/rest/v1/email_addresses?domain_id=eq.\${domainId}&local_part=eq.\${encodeURIComponent(localPart)}\`,
        {
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": \`Bearer \${SUPABASE_KEY}\`,
            "Accept": "application/json"
          }
        }
      );

      if (addressRes.ok) {
        const addresses = await addressRes.json();
        if (addresses && addresses.length > 0 && !addresses[0].is_active) {
          console.log("✅ Activating address:", addresses[0].id);
          await fetch(\`\${SUPABASE_URL}/rest/v1/email_addresses?id=eq.\${addresses[0].id}\`, {
            method: "PATCH",
            headers: {
              "apikey": SUPABASE_KEY,
              "Authorization": \`Bearer \${SUPABASE_KEY}\`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ is_active: true })
          });
        }
      }

      // Insert email into database
      const insertRes = await fetch(\`\${SUPABASE_URL}/rest/v1/emails\`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": \`Bearer \${SUPABASE_KEY}\`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          from_address: from,
          to_address: to,
          subject: subject,
          body_text: bodyText || "",
          body_html: bodyHtml || "",
          folder: "inbox",
          is_read: false,
          thread_id: \`thread_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
          user_id: ownerId,
          domain_id: domainId
        })
      });

      if (!insertRes.ok) {
        const errorText = await insertRes.text();
        console.error("❌ Failed to insert email:", insertRes.status, errorText);
      } else {
        const inserted = await insertRes.json();
        console.log("✅ Email stored in database:", inserted[0]?.id);
      }
    } catch (error) {
      console.error("🔴 Worker error:", error.message, error.stack);
    }
  }
};
    `.trim();
  }, [selectedDomain, currentUser.id, supabaseUrl, supabaseKey, settingsUrl, settingsKey]);

  const handleNavigate = (newView: 'info' | 'home' | 'mail' | 'admin' | 'settings', folder?: EmailFolder) => {
    setView(newView);
    if (folder) setCurrentFolder(folder);
    setIsMobileMenuOpen(false);
    
    // Update URL hash
    if (newView === 'info') {
      window.history.pushState({}, '', '#/info');
    } else if (newView === 'home') {
      window.history.pushState({}, '', '#/');
    } else if (newView === 'mail' && folder) {
      window.history.pushState({}, '', `#/mail/${folder.toLowerCase()}`);
    } else if (newView === 'admin') {
      window.history.pushState({}, '', '#/system-setup');
    } else if (newView === 'settings') {
      window.history.pushState({}, '', '#/settings');
    }
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
        ${view === 'info' ? 'hidden' : ''}
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
          <button onClick={() => handleNavigate('info')} className="font-black text-xl text-blue-600 hover:opacity-70 transition-opacity">
            MailFlow
          </button>
          <div className="w-10" />
        </div>

        {view === 'info' && (
          <InfoView stats={stats} onNavigate={handleNavigate} />
        )}

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

        {view === 'settings' && (
          <SettingsView 
            settingsUrl={settingsUrl}
            settingsKey={settingsKey}
            onSettingsUrlChange={setSettingsUrl}
            onSettingsKeyChange={setSettingsKey}
            onSave={handleSettingsSave}
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
