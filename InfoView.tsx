import React from 'react';
import { CheckCircle2, AlertCircle, Zap, Shield, Globe, Users, Mail, Settings, RefreshCw, ArrowRight, LayoutDashboard } from 'lucide-react';

interface InfoViewProps {
  stats: { domains: number; addresses: number; emails: number };
  onNavigate?: (page: 'home' | 'admin' | 'settings') => void;
}

export const InfoView: React.FC<InfoViewProps> = ({ stats, onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar transition-colors">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 p-6 lg:px-12 lg:py-8">
        <div className="flex items-center gap-4 mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">MailFlow</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Easy Cloud Mail System</p>
          </div>
        </div>
      </header>

      <div className="p-6 lg:p-12 max-w-6xl w-full space-y-12 mx-auto">
        {/* CTA Buttons - Top Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate?.('home')}
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white font-black py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl hover:shadow-2xl"
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-lg">Go to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate?.('admin')}
            className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 text-white font-black py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl hover:shadow-2xl"
          >
            <Settings className="w-6 h-6" />
            <span className="text-lg">System Setup</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <button
            onClick={() => onNavigate?.('admin')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                <Globe className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase text-blue-900 dark:text-blue-400">Domains</p>
                <p className="text-3xl font-black text-blue-900 dark:text-blue-300">{stats.domains}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('admin')}
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center group-hover:bg-emerald-700 transition-colors">
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase text-emerald-900 dark:text-emerald-400">Routes</p>
                <p className="text-3xl font-black text-emerald-900 dark:text-emerald-300">{stats.addresses}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('home')}
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center group-hover:bg-purple-700 transition-colors">
                <Mail className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase text-purple-900 dark:text-purple-400">Emails</p>
                <p className="text-3xl font-black text-purple-900 dark:text-purple-300">{stats.emails}</p>
              </div>
            </div>
          </button>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Globe, title: "Custom Domains", desc: "Use your own domain for emails" },
              { icon: Zap, title: "Instant Routes", desc: "Create unlimited email addresses/routes" },
              { icon: Shield, title: "Encrypted Mail", desc: "All emails are encrypted and secure" },
              { icon: RefreshCw, title: "Real-time Sync", desc: "Auto-refresh with Supabase Realtime" },
              { icon: Settings, title: "Worker Settings", desc: "Configure Supabase credentials dynamically" },
              { icon: Mail, title: "Easy Setup", desc: "Step-by-step guided configuration" }
            ].map((feature, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-5 flex gap-4">
                <feature.icon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What It Solves */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            Problems It Solves
          </h2>
          <div className="space-y-3">
            {[
              "🔧 Don't want to expose your main email? Use custom email addresses instead",
              "📧 Need multiple email addresses for different purposes? Create unlimited routes",
              "🛡️ Concerned about email security? Everything is encrypted and stored safely",
              "⚡ Want real-time email updates? Auto-refresh keeps you updated instantly",
              "🌍 Running your own business? Use your domain for professional emails",
              "💾 Need database flexibility? Connect to your own Supabase project"
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-lg flex-shrink-0">{item.substring(0, 2)}</span>
                <p className="text-sm text-slate-700 dark:text-slate-300">{item.substring(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-blue-900 dark:text-blue-200 mb-6">Quick Start Guide</h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Configure Worker Settings", desc: "Add your Supabase URL and Key in Worker Settings page" },
              { step: "2", title: "Go to System Setup", desc: "Add your domain and create email routes (addresses)" },
              { step: "3", title: "Deploy Worker Code", desc: "Copy the Worker Code and deploy it in Cloudflare" },
              { step: "4", title: "Receive Emails", desc: "Send emails to your custom address and they'll appear in your Inbox" },
              { step: "5", title: "Manage & Monitor", desc: "Use Mail View to read, organize, and manage your emails" }
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-black text-blue-900 dark:text-blue-200">{item.title}</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Components */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-600" />
            System Components
          </h2>
          <div className="space-y-3">
            {[
              { name: "Cloudflare Workers", status: "Backend", desc: "Receives incoming emails from any sender" },
              { name: "Supabase Database", status: "Storage", desc: "Stores emails, domains, and configurations" },
              { name: "Real-time Subscriptions", status: "Live", desc: "Pushes updates instantly to your browser" },
              { name: "MailFlow Frontend", status: "UI", desc: "Beautiful interface to manage everything" }
            ].map((comp, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">{comp.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{comp.desc}</p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-600 dark:text-slate-400">
                  {comp.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-amber-900 dark:text-amber-200 mb-2">Made with ❤️</h3>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              MailFlow is a complete email management system built on modern cloud infrastructure. 
              Easy to set up, powerful to use, and completely under your control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
