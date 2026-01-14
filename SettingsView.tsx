import React, { useState } from 'react';
import { Save, AlertCircle, CheckCircle2, Link, Database, Copy } from 'lucide-react';
import { getSupabaseConfig, getStoredSchema } from './services/supabaseClient';
import { INITIAL_SQL } from './services/sqlBlueprint';

interface SettingsViewProps {
  settingsUrl: string;
  settingsKey: string;
  onSettingsUrlChange: (url: string) => void;
  onSettingsKeyChange: (key: string) => void;
  onSave: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settingsUrl,
  settingsKey,
  onSettingsUrlChange,
  onSettingsKeyChange,
  onSave
}) => {
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'cloud' | 'sql'>('credentials');
  const [copySuccess, setCopySuccess] = useState<string>('');
  
  const { url: currentUrl, key: currentKey } = getSupabaseConfig();
  const storedSchema = getStoredSchema();

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  
  const showCopySuccess = (message: string) => {
    setCopySuccess(message);
    setTimeout(() => setCopySuccess(''), 3000);
  };
  
  const handleCopySQL = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(INITIAL_SQL);
        showCopySuccess('✅ SQL Blueprint copied!');
      } else {
        // Fallback method for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = INITIAL_SQL;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopySuccess('✅ SQL Blueprint copied!');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      alert('❌ Failed to copy. Please manually select and copy the SQL code below.');
    }
  };
  
  const handleCopyCloudUrl = async () => {
    try {
      const urlToCopy = settingsUrl || currentUrl || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(urlToCopy);
        showCopySuccess('✅ Cloud URL copied!');
      } else {
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = urlToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopySuccess('✅ Cloud URL copied!');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      alert('❌ Failed to copy. Please manually select and copy the URL.');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 overflow-y-auto custom-scrollbar transition-colors relative">
      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="fixed top-8 right-8 z-50 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm">{copySuccess}</span>
        </div>
      )}
      
      <header className="sticky top-0 z-40 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900/95 dark:to-slate-900 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-6 lg:px-12 lg:py-8 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <span className="text-white font-black text-lg">⚙️</span>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Settings</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Configure cloud and database</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-3 mt-8 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-5 py-3 rounded-t-xl font-black text-xs uppercase tracking-wider transition-all relative ${
              activeTab === 'credentials'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Credentials
            {activeTab === 'credentials' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-300 rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-5 py-3 rounded-t-xl font-black text-xs uppercase tracking-wider transition-all relative flex items-center gap-2 ${
              activeTab === 'cloud'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Link className="w-4 h-4" />
            Cloud Link
            {activeTab === 'cloud' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-300 rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-5 py-3 rounded-t-xl font-black text-xs uppercase tracking-wider transition-all relative flex items-center gap-2 ${
              activeTab === 'sql'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            SQL Blueprint
            {activeTab === 'sql' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-300 rounded-t-full" />}
          </button>
        </div>
      </header>

      <div className="p-6 lg:p-12 max-w-4xl w-full mx-auto space-y-8">{activeTab === 'credentials' && (
        <>
        {/* Warning */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex gap-4 shadow-md hover:shadow-lg transition-shadow">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-amber-900 dark:text-amber-200 mb-2">⚡ Important</h3>
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              Update these settings and copy the new Worker Code from System Setup. The Worker code will be regenerated automatically with your new credentials.
            </p>
          </div>
        </div>

        {/* Supabase URL */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 mb-4 tracking-widest">
            🔗 Supabase Project URL
          </label>
          <input
            type="text"
            placeholder="https://yourproject.supabase.co"
            value={settingsUrl}
            onChange={(e) => onSettingsUrlChange(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/50 transition-all"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            📍 Found in your Supabase dashboard URL
          </p>
        </div>

        {/* Supabase Key */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 mb-4 tracking-widest">
            🔐 Supabase Anon Key
          </label>
          <input
            type="password"
            placeholder="eyJhbGc..."
            value={settingsKey}
            onChange={(e) => onSettingsKeyChange(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/50 transition-all"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            📋 Get this from Supabase Settings → API → anon public key
          </p>
        </div>

        {/* Current Values Display */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 space-y-3 shadow-md border border-slate-300 dark:border-slate-700">
          <h3 className="font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2">✓ Current Configuration</h3>
          <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 font-mono text-xs space-y-3">
            <div className="break-all">
              <span className="text-slate-500 dark:text-slate-400 font-bold">URL: </span>
              <span className="text-slate-700 dark:text-slate-300">{settingsUrl || '(not set)'}</span>
            </div>
            <div className="break-all">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Key: </span>
              <span className="text-slate-700 dark:text-slate-300">{settingsKey ? settingsKey.substring(0, 20) + '...' : '(not set)'}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white font-black px-8 py-5 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <Save className="w-6 h-6" />
          <span className="text-lg">Save Settings</span>
        </button>

        {/* Success Message */}
        {saved && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 flex gap-4 animate-in fade-in shadow-lg">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                ✅ Settings saved! Go to System Setup to copy the updated Worker Code.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 space-y-4 shadow-md">
          <h3 className="font-black text-blue-900 dark:text-blue-200 flex items-center gap-2 text-lg">📚 Next Steps:</h3>
          <ol className="text-sm text-blue-900 dark:text-blue-200 space-y-3 list-decimal list-inside">
            <li className="flex gap-3"><span>✓</span> Save your Supabase credentials above</li>
            <li className="flex gap-3"><span>✓</span> Go to <strong>System Setup</strong> tab</li>
            <li className="flex gap-3"><span>✓</span> Select your domain</li>
            <li className="flex gap-3"><span>✓</span> Click <strong>"Copy Logic"</strong> to copy the updated Worker Code</li>
            <li className="flex gap-3"><span>✓</span> Paste into your Cloudflare Worker and Deploy</li>
          </ol>
        </div>
        </>
      )}

      {activeTab === 'cloud' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-8 shadow-md">
            <h3 className="font-black text-blue-900 dark:text-blue-200 mb-4 flex items-center gap-3 text-lg">
              <Link className="w-6 h-6" />
              Current Cloud Connection
            </h3>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 font-mono text-sm break-all shadow-sm border border-slate-200 dark:border-slate-800">
              {settingsUrl || currentUrl || '(Not configured)'}
            </div>
            <button
              onClick={handleCopyCloudUrl}
              className="mt-6 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
            >
              <Copy className="w-5 h-5" />
              Copy Cloud URL
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 shadow-md border border-slate-300 dark:border-slate-700">
            <h3 className="font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2 text-lg">🔌 Connection Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-lg p-4">
                <div className={`w-3 h-3 rounded-full ${(settingsUrl || currentUrl) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {(settingsUrl || currentUrl) ? '✓ Connected' : '✗ Not configured'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sql' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex gap-4 shadow-md">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-amber-900 dark:text-amber-200 mb-2">⚙️ Setup Instructions</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                Run this SQL in your Supabase SQL Editor to create the required database tables and structure.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-8 shadow-xl border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-white flex items-center gap-3 text-lg">
                <Database className="w-6 h-6 text-blue-400" />
                Database Schema
              </h3>
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
              >
                <Copy className="w-4 h-4" />
                Copy SQL
              </button>
            </div>
            <div className="bg-black/60 rounded-xl p-5 max-h-96 overflow-y-auto custom-scrollbar border border-slate-700">
              <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap break-words leading-relaxed">
                {INITIAL_SQL}
              </pre>
            </div>
          </div>

          {storedSchema && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 shadow-md">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mb-3 animate-bounce" />
              <h3 className="font-black text-emerald-900 dark:text-emerald-200 text-lg">✓ Schema Initialized</h3>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-3">
                Your database schema was successfully set up on <strong>{new Date(storedSchema).toLocaleDateString()}</strong>
              </p>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-8 space-y-4 shadow-md">
            <h3 className="font-black text-blue-900 dark:text-blue-200 flex items-center gap-2 text-lg">📖 How to use:</h3>
            <ol className="text-sm text-blue-900 dark:text-blue-200 space-y-3 list-decimal list-inside">
              <li className="flex gap-3"><span>1️⃣</span> Copy the SQL Blueprint above</li>
              <li className="flex gap-3"><span>2️⃣</span> Go to your Supabase Dashboard</li>
              <li className="flex gap-3"><span>3️⃣</span> Open <strong>SQL Editor</strong></li>
              <li className="flex gap-3"><span>4️⃣</span> Paste the SQL and click <strong>Run</strong></li>
              <li className="flex gap-3"><span>5️⃣</span> All tables and policies will be created automatically</li>
            </ol>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
