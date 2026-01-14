
import React from 'react';
import { 
  LayoutDashboard, Mail, Globe, Zap, ArrowRight, 
  Sparkles, ShieldCheck, Clock, Plus, Settings 
} from 'lucide-react';
import { User, Email, EmailFolder } from './types';

interface DashboardViewProps {
  currentUser: User;
  stats: { emails: number; domains: number; addresses: number };
  unreadCount: number;
  recentEmails: Email[];
  onNavigate: (view: 'info' | 'home' | 'mail' | 'admin', folder?: EmailFolder) => void;
  onCompose: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser, stats, unreadCount, recentEmails, onNavigate, onCompose
}) => {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar transition-colors">
      <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full space-y-8 lg:space-y-12">
        
        {/* Simple Friendly Greeting */}
        <section className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 p-8 lg:p-12 shadow-sm group">
          <div className="absolute top-0 right-0 p-12 opacity-5 lg:opacity-10 pointer-events-none">
            <Sparkles className="w-32 lg:w-48 h-32 lg:h-48 text-blue-600" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Everything is working well</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
              Welcome back, <span className="text-blue-600">{currentUser.email.split('@')[0]}</span>!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm lg:text-lg max-w-2xl leading-relaxed">
              Your system is running. You have <span className="text-slate-900 dark:text-white font-bold">{stats.domains} domains</span> and <span className="text-slate-900 dark:text-white font-bold">{stats.addresses} routes</span> online. 
              {unreadCount > 0 ? ` You've got ${unreadCount} new messages to read.` : " You are all caught up for now!"}
            </p>
          </div>
        </section>

        {/* Quick Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
          <button onClick={() => onNavigate('mail', EmailFolder.INBOX)} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all text-left relative overflow-hidden group">
            <Mail className="absolute -right-4 -bottom-4 w-24 h-24 opacity-5 text-blue-600" />
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6"><Mail className="w-6 h-6" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">New Messages</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{unreadCount}</p>
          </button>

          <button onClick={() => onNavigate('admin')} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all text-left relative overflow-hidden group">
            <Globe className="absolute -right-4 -bottom-4 w-24 h-24 opacity-5 text-emerald-600" />
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6"><Globe className="w-6 h-6" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">My Domains</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.domains}</p>
          </button>

          <button onClick={() => onNavigate('admin')} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all text-left relative overflow-hidden group sm:col-span-2 lg:col-span-1">
            <Zap className="absolute -right-4 -bottom-4 w-24 h-24 opacity-5 text-purple-600" />
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6"><Zap className="w-6 h-6" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Routes</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.addresses}</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pb-12">
          {/* Latest Chats */}
          <section className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-fit">
            <header className="p-8 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Recent Chats</h3>
              <button onClick={() => onNavigate('mail')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                See Inbox <ArrowRight className="w-4 h-4" />
              </button>
            </header>
            <div className="flex-1">
              {recentEmails.length === 0 ? (
                <div className="p-12 text-center">
                  <Mail className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No mail yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {recentEmails.slice(0, 4).map(email => (
                    <button key={email.id} onClick={() => onNavigate('mail')} className="w-full text-left p-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center gap-5 group">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                        {email.from_address.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-black text-slate-900 dark:text-white truncate pr-2">{email.from_address}</span>
                          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" /> {new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold truncate">{email.subject}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Quick Tasks Section */}
          <section className="space-y-6 flex flex-col h-full">
            <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight px-2">Ready to work?</h3>
            <div className="grid grid-cols-1 gap-6 flex-1">
              <button onClick={onCompose} className="group p-8 bg-slate-950 dark:bg-blue-600 rounded-[32px] text-left transition-all hover:scale-[1.01] shadow-xl shadow-blue-500/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10"><Plus className="w-6 h-6 text-white" /></div>
                <h4 className="text-xl font-black text-white mb-2">Write New Mail</h4>
                <p className="text-blue-200/60 text-sm font-medium leading-relaxed">Start a new private talk with anyone safely.</p>
              </button>

              <button onClick={() => onNavigate('admin')} className="group p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] text-left transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all"><Settings className="w-6 h-6" /></div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">System Setup</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">Add domains or change your cloud settings.</p>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
