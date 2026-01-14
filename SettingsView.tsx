import React, { useState } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

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

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar transition-colors">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 p-6 lg:px-12 lg:py-8">
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Settings</h1>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Configure Supabase credentials</p>
      </header>

      <div className="p-6 lg:p-12 max-w-2xl w-full space-y-8">
        {/* Warning */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-amber-900 dark:text-amber-200 mb-1">Important</h3>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Update these settings and copy the new Worker Code from System Setup. The Worker code will be regenerated automatically with your new credentials.
            </p>
          </div>
        </div>

        {/* Supabase URL */}
        <div>
          <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 mb-3 tracking-widest">
            Supabase Project URL
          </label>
          <input
            type="text"
            placeholder="https://yourproject.supabase.co"
            value={settingsUrl}
            onChange={(e) => onSettingsUrlChange(e.target.value)}
            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Found in your Supabase dashboard URL
          </p>
        </div>

        {/* Supabase Key */}
        <div>
          <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 mb-3 tracking-widest">
            Supabase Anon Key
          </label>
          <input
            type="password"
            placeholder="eyJhbGc..."
            value={settingsKey}
            onChange={(e) => onSettingsKeyChange(e.target.value)}
            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Get this from Supabase Settings → API → anon public key
          </p>
        </div>

        {/* Current Values Display */}
        <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-6 space-y-3">
          <h3 className="font-black text-slate-900 dark:text-white mb-4">Current Configuration</h3>
          <div className="font-mono text-xs space-y-2">
            <div className="break-all">
              <span className="text-slate-500 dark:text-slate-400">URL: </span>
              <span className="text-slate-700 dark:text-slate-300">{settingsUrl || '(not set)'}</span>
            </div>
            <div className="break-all">
              <span className="text-slate-500 dark:text-slate-400">Key: </span>
              <span className="text-slate-700 dark:text-slate-300">{settingsKey ? settingsKey.substring(0, 20) + '...' : '(not set)'}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black px-8 py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <Save className="w-5 h-5" />
          <span>Save Settings</span>
        </button>

        {/* Success Message */}
        {saved && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 flex gap-4 animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                ✅ Settings saved! Go to System Setup to copy the updated Worker Code.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 space-y-3">
          <h3 className="font-black text-blue-900 dark:text-blue-200">Next Steps:</h3>
          <ol className="text-sm text-blue-900 dark:text-blue-200 space-y-2 list-decimal list-inside">
            <li>Save your Supabase credentials above</li>
            <li>Go to <strong>System Setup</strong> tab</li>
            <li>Select your domain</li>
            <li>Click <strong>"Copy Logic"</strong> to copy the updated Worker Code</li>
            <li>Paste into your Cloudflare Worker and Deploy</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
