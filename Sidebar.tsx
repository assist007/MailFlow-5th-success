
import React, { useState, useRef, useEffect } from 'react';
import { 
  Inbox, Send, Star, Trash2, Globe, Settings, Mail, ShieldCheck, Sun, Moon, Plus, ChevronRight, LayoutDashboard, PanelLeft, Circle
} from 'lucide-react';
import { User, UserRole, EmailFolder } from './types';

interface SidebarProps {
  currentUser: User;
  currentFolder: EmailFolder;
  view: 'home' | 'mail' | 'admin';
  sidebarMode: 'expanded' | 'collapsed' | 'hover';
  onSetSidebarMode: (mode: 'expanded' | 'collapsed' | 'hover') => void;
  unreadCount: number;
  onSetView: (view: 'info' | 'home' | 'mail' | 'admin' | 'settings') => void;
  onSetFolder: (folder: EmailFolder) => void;
  onOpenConfig: () => void;
  onOpenCompose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const SidebarItem: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  active?: boolean, 
  onClick: () => void, 
  count?: number,
  isCollapsed?: boolean
}> = ({ icon, label, active, onClick, count, isCollapsed }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
    } ${isCollapsed ? 'justify-center' : ''}`}
    title={isCollapsed ? label : undefined}
  >
    <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
      <span className={`transition-transform duration-300 shrink-0 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
      {!isCollapsed && <span className="text-sm font-semibold tracking-tight truncate animate-in fade-in duration-300">{label}</span>}
    </div>
    {!isCollapsed && count !== undefined && count > 0 && (
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${
        active ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      }`}>
        {count}
      </span>
    )}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentUser, currentFolder, view, sidebarMode, onSetSidebarMode, unreadCount, onSetView, onSetFolder, onOpenConfig, onOpenCompose, theme, onToggleTheme 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isControlMenuOpen, setIsControlMenuOpen] = useState(false);
  const controlMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (controlMenuRef.current && !controlMenuRef.current.contains(event.target as Node)) {
        setIsControlMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCurrentlyCollapsed = sidebarMode === 'collapsed' || (sidebarMode === 'hover' && !isHovered);
  const sidebarWidthClass = isCurrentlyCollapsed ? 'w-20' : 'w-72';

  const handleModeChange = (mode: 'expanded' | 'collapsed' | 'hover') => {
    onSetSidebarMode(mode);
    setIsControlMenuOpen(false);
  };

  return (
    <aside 
      onMouseEnter={() => sidebarMode === 'hover' && setIsHovered(true)}
      onMouseLeave={() => sidebarMode === 'hover' && setIsHovered(false)}
      className={`h-full ${sidebarWidthClass} border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col bg-white dark:bg-slate-900 transition-all duration-300 shadow-xl dark:shadow-none shrink-0 relative z-50`}
    >
      {/* Brand Header */}
      <button
        onClick={() => onSetView('info')}
        className={`p-6 flex items-center gap-3 min-h-[80px] shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isCurrentlyCollapsed ? 'justify-center' : ''} w-full`}
      >
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-blue-600 blur-lg opacity-40 rounded-full animate-pulse" />
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-xl">
            <Mail className="w-6 h-6 text-white" />
          </div>
        </div>
        {!isCurrentlyCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300 truncate">
            <span className="font-black text-xl text-slate-900 dark:text-white tracking-tighter block leading-none">MailFlow</span>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1 block">Easy Cloud Mail</span>
          </div>
        )}
      </button>

      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar overflow-x-hidden p-4 lg:p-5">
        {/* Action Button */}
        <button 
          onClick={onOpenCompose} 
          className={`group w-full flex items-center justify-center gap-3 bg-slate-950 dark:bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 mb-6 shrink-0 ${isCurrentlyCollapsed ? 'px-0' : 'px-4'}`}
          title={isCurrentlyCollapsed ? "Write Mail" : undefined}
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 shrink-0" /> 
          {!isCurrentlyCollapsed && <span className="relative animate-in fade-in duration-300 whitespace-nowrap font-black uppercase text-[10px] tracking-widest">Write Mail</span>}
        </button>
        
        {/* Navigation - CATEGORY LABELS REMOVED AS REQUESTED */}
        <nav className="space-y-1">
          <SidebarItem icon={<LayoutDashboard className="w-5 h-5" />} label="Home" active={view === 'home'} onClick={() => onSetView('home')} isCollapsed={isCurrentlyCollapsed} />
          
          <div className="my-4 h-px bg-slate-100 dark:bg-slate-800/60 mx-2" />
          
          <SidebarItem icon={<Inbox className="w-5 h-5" />} label="Inbox" active={currentFolder === EmailFolder.INBOX && view === 'mail'} onClick={() => { onSetView('mail'); onSetFolder(EmailFolder.INBOX); }} count={unreadCount} isCollapsed={isCurrentlyCollapsed} />
          <SidebarItem icon={<Star className="w-5 h-5" />} label="Starred" active={currentFolder === EmailFolder.STARRED && view === 'mail'} onClick={() => { onSetView('mail'); onSetFolder(EmailFolder.STARRED); }} isCollapsed={isCurrentlyCollapsed} />
          <SidebarItem icon={<Send className="w-5 h-5" />} label="Sent" active={currentFolder === EmailFolder.SENT && view === 'mail'} onClick={() => { onSetView('mail'); onSetFolder(EmailFolder.SENT); }} isCollapsed={isCurrentlyCollapsed} />
          <SidebarItem icon={<Trash2 className="w-5 h-5" />} label="Trash" active={currentFolder === EmailFolder.TRASH && view === 'mail'} onClick={() => { onSetView('mail'); onSetFolder(EmailFolder.TRASH); }} isCollapsed={isCurrentlyCollapsed} />
          
          <div className="my-4 h-px bg-slate-100 dark:bg-slate-800/60 mx-2" />
          
          <SidebarItem 
            icon={<Globe className="w-5 h-5" />} 
            label={currentUser.role === UserRole.OWNER ? "System Setup" : "My Domains"} 
            active={view === 'admin'} 
            onClick={() => onSetView('admin')} 
            isCollapsed={isCurrentlyCollapsed}
          />
          <SidebarItem 
            icon={<Settings className="w-5 h-5" />} 
            label="Worker Settings" 
            active={view === 'settings'}
            onClick={() => onSetView('settings')} 
            isCollapsed={isCurrentlyCollapsed}
          />
        </nav>
        
        {/* Theme Toggle */}
        <div className="mt-auto pt-8 mb-4">
          <button 
            onClick={onToggleTheme} 
            className={`w-full flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all ${isCurrentlyCollapsed ? 'p-3 justify-center' : 'px-4 py-3'}`}
          >
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
              {!isCurrentlyCollapsed && <span className="text-xs font-bold uppercase tracking-wider animate-in fade-in duration-300">{theme === 'light' ? 'Light' : 'Dark'}</span>}
            </div>
            {!isCurrentlyCollapsed && (
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Profile & Sidebar Control - STICKY AT BOTTOM */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 shrink-0">
        <div className={`flex items-center gap-3 mb-4 ${isCurrentlyCollapsed ? 'justify-center' : ''}`}>
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm border border-blue-200/50 dark:border-blue-700/30">
              {currentUser.role.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>
          {!isCurrentlyCollapsed && (
            <div className="flex-1 min-w-0 animate-in fade-in duration-300">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate tracking-tight">{currentUser.email}</p>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{currentUser.role}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Control Button */}
        <div className="relative" ref={controlMenuRef}>
          <button 
            onClick={() => setIsControlMenuOpen(!isControlMenuOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all ${isCurrentlyCollapsed ? 'justify-center' : ''}`}
            title="Sidebar modes"
          >
            <PanelLeft className="w-5 h-5 shrink-0" />
            {!isCurrentlyCollapsed && <span className="text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-300">Sidebar Control</span>}
          </button>

          {/* Mode Selection Menu */}
          {isControlMenuOpen && (
            <div className={`absolute bottom-full mb-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 z-[100] animate-in slide-in-from-bottom-2 duration-200 left-0`}>
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-slate-800 mb-1">
                Sidebar control
              </div>
              
              <button 
                onClick={() => handleModeChange('expanded')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${sidebarMode === 'expanded' ? 'bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Circle className={`w-2 h-2 ${sidebarMode === 'expanded' ? 'fill-blue-600 text-blue-600' : 'text-transparent'}`} />
                Expanded
              </button>

              <button 
                onClick={() => handleModeChange('collapsed')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${sidebarMode === 'collapsed' ? 'bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Circle className={`w-2 h-2 ${sidebarMode === 'collapsed' ? 'fill-blue-600 text-blue-600' : 'text-transparent'}`} />
                Collapsed
              </button>

              <button 
                onClick={() => handleModeChange('hover')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${sidebarMode === 'hover' ? 'bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Circle className={`w-2 h-2 ${sidebarMode === 'hover' ? 'fill-blue-600 text-blue-600' : 'text-transparent'}`} />
                Expand on hover
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
