
import React, { useMemo, useState } from 'react';
import { 
  Search, CheckSquare, Square, Trash2, Loader2, ChevronLeft, 
  Sparkles, Star, Clock, Mail, ShieldCheck, MoreHorizontal, Filter, RefreshCw
} from 'lucide-react';
import { Email, Thread, EmailFolder, User } from './types';
import { summarizeThread } from './services/geminiService';
import { api } from './services/apiService';

interface MailViewProps {
  emails: Email[];
  selectedThreadId: string | null;
  onSelectThread: (id: string | null) => void;
  onToggleStar: (email: Email) => void;
  isLoading: boolean;
  onReload: () => void;
  currentUser: User;
  currentFolder: EmailFolder;
}

export const MailView: React.FC<MailViewProps> = ({ 
  emails, selectedThreadId, onSelectThread, onToggleStar, isLoading, onReload, currentUser, currentFolder 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [threadSummary, setThreadSummary] = useState<string | null>(null);
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const threads = useMemo(() => {
    const grouped: Record<string, Thread> = {};
    const lowerSearch = searchQuery.toLowerCase();
    
    emails.filter(e => 
      (e.subject || "").toLowerCase().includes(lowerSearch) || 
      (e.from_address || "").toLowerCase().includes(lowerSearch)
    ).forEach(email => {
      if (!grouped[email.thread_id]) grouped[email.thread_id] = { id: email.thread_id, subject: email.subject, latest_message: email, unread_count: 0, total_messages: 0 };
      const thread = grouped[email.thread_id];
      thread.total_messages++;
      if (!email.is_read) thread.unread_count++;
      if (new Date(email.created_at) > new Date(thread.latest_message.created_at)) thread.latest_message = email;
    });
    
    return Object.values(grouped).sort((a, b) => new Date(b.latest_message.created_at).getTime() - new Date(a.latest_message.created_at).getTime());
  }, [emails, searchQuery]);

  const selectedThreadEmails = useMemo(() => 
    emails.filter(e => e.thread_id === selectedThreadId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), 
  [emails, selectedThreadId]);

  const handleSummarize = async () => {
    if (!selectedThreadId) return;
    setIsSummarizing(true);
    const summary = await summarizeThread(selectedThreadEmails.map(e => e.body_text));
    setThreadSummary(summary);
    setIsSummarizing(false);
  };

  const toggleSelectAll = () => {
    if (selectedThreadIds.size === threads.length) setSelectedThreadIds(new Set());
    else setSelectedThreadIds(new Set(threads.map(t => t.id)));
  };

  const toggleSelectThread = (id: string) => {
    const next = new Set(selectedThreadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedThreadIds(next);
  };

  const handleBulkDelete = async () => {
    if (selectedThreadIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      if (currentFolder === EmailFolder.TRASH) await api.hardDeleteThreads(Array.from(selectedThreadIds), currentUser.id);
      else await api.moveThreadsToTrash(Array.from(selectedThreadIds), currentUser.id);
      setSelectedThreadIds(new Set());
      onSelectThread(null);
      onReload();
    } catch (err: any) { alert(err.message); } finally { setIsBulkDeleting(false); }
  };

  return (
    <div className="flex flex-1 overflow-hidden transition-colors h-full bg-slate-50 dark:bg-slate-950">
      {/* Thread List */}
      <div className={`
        flex-col bg-white dark:bg-slate-900 transition-all duration-300 shrink-0
        ${selectedThreadId ? 'hidden lg:flex lg:w-[400px]' : 'flex w-full lg:w-[400px]'}
        border-r border-slate-200/60 dark:border-slate-800/60 shadow-sm
      `}>
        <header className="p-5 lg:p-7 border-b border-slate-100 dark:border-slate-800/60 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Conversations</h2>
            <div className="flex gap-2">
              <button 
                onClick={onReload}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                title="Refresh emails"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><Filter className="w-4 h-4" /></button>
              <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><MoreHorizontal className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search mail..." 
              className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          
          <div className="flex items-center justify-between px-1">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-blue-600 transition-all">
              {selectedThreadIds.size === threads.length ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
              {selectedThreadIds.size > 0 ? `${selectedThreadIds.size} Selected` : 'Select All'}
            </button>
            {selectedThreadIds.size > 0 && (
              <button 
                onClick={handleBulkDelete} 
                className="flex items-center gap-2 px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all font-bold text-xs"
              >
                {isBulkDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Delete
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest opacity-50">Syncing Feed...</span>
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mb-6">
                <Mail className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="font-black text-slate-400 dark:text-slate-600 uppercase text-[10px] tracking-widest">Inbox Zero Accomplished</p>
            </div>
          ) : (
            threads.map(thread => (
              <div 
                key={thread.id} 
                onClick={() => { onSelectThread(thread.id); api.markAsRead(thread.id); setThreadSummary(null); }} 
                className={`group relative w-full text-left p-5 border-b border-slate-100 dark:border-slate-800/40 transition-all cursor-pointer ${
                  selectedThreadId === thread.id 
                    ? 'bg-blue-50/60 dark:bg-blue-900/10' 
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-4 mb-2">
                   <div 
                     onClick={(e) => { e.stopPropagation(); toggleSelectThread(thread.id); }} 
                     className="text-slate-300 dark:text-slate-600 hover:text-blue-600 transition-colors"
                   >
                     {selectedThreadIds.has(thread.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                   </div>
                   <span className={`text-sm truncate flex-1 tracking-tight ${thread.unread_count > 0 ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-500 dark:text-slate-400'}`}>
                    {thread.latest_message.from_address}
                   </span>
                   <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(thread.latest_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Star 
                      onClick={(e) => { e.stopPropagation(); onToggleStar(thread.latest_message); }} 
                      className={`w-3.5 h-3.5 transition-all hover:scale-125 ${thread.latest_message.is_starred ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} 
                    />
                   </div>
                </div>
                <div className="pl-8">
                  <h4 className={`text-sm line-clamp-1 leading-tight mb-1 ${thread.unread_count > 0 ? 'font-black text-slate-800 dark:text-slate-200' : 'font-semibold text-slate-600 dark:text-slate-500'}`}>
                    {thread.subject}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 font-medium leading-relaxed">
                    {thread.latest_message.body_text}
                  </p>
                </div>
                {thread.unread_count > 0 && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className={`
        flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden transition-all duration-500
        ${!selectedThreadId ? 'hidden lg:flex' : 'flex w-full'}
      `}>
        {selectedThreadId ? (
          <>
            <header className="px-5 lg:px-10 py-4 lg:py-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-between shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-4 min-w-0">
                <button onClick={() => onSelectThread(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl mr-1 lg:mr-2 transition-all">
                  <ChevronLeft className="w-5 h-5 dark:text-white" />
                </button>
                <div className="min-w-0">
                  <h2 className="font-black text-slate-900 dark:text-white text-lg lg:text-2xl truncate leading-none tracking-tighter mb-1">
                    {selectedThreadEmails[0]?.subject}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">Conversation</span>
                    <span className="text-[10px] font-bold text-slate-400">• {selectedThreadEmails.length} messages</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button 
                  onClick={handleSummarize} 
                  disabled={isSummarizing} 
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl font-black text-xs hover:shadow-lg hover:shadow-blue-500/20 transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} 
                  <span className="hidden sm:inline">AI Summary</span>
                </button>
                <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
                <button onClick={() => { setSelectedThreadIds(new Set([selectedThreadId])); handleBulkDelete(); }} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-5 lg:p-12 custom-scrollbar space-y-12">
              <div className="max-w-4xl mx-auto space-y-10">
                {threadSummary && (
                  <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white rounded-[32px] p-8 lg:p-10 shadow-2xl shadow-blue-500/25 flex gap-6 lg:gap-8 animate-in slide-in-from-top-6 duration-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                      <Sparkles className="w-32 h-32" />
                    </div>
                    <div className="p-3.5 bg-white/10 rounded-2xl h-fit shrink-0 backdrop-blur-md border border-white/20"><Sparkles className="w-6 h-6" /></div>
                    <div className="relative">
                      <h3 className="font-black text-xl mb-3 tracking-tight">Intelligence Briefing</h3>
                      <p className="text-blue-50/90 text-base lg:text-lg font-medium leading-relaxed prose prose-invert max-w-none">{threadSummary}</p>
                    </div>
                  </div>
                )}

                {selectedThreadEmails.map((email, idx) => (
                  <div 
                    key={email.id} 
                    className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[40px] p-8 lg:p-12 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none animate-in fade-in duration-500 delay-${idx * 100}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-50 dark:border-slate-800/40">
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[24px] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/25 shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform">
                          {email.from_address.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-slate-900 dark:text-white text-lg block truncate tracking-tight">{email.from_address}</span>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/40">
                              <ShieldCheck className="w-3 h-3" /> Encrypted
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(email.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onToggleStar(email)} className={`p-3 rounded-2xl transition-all ${email.is_starred ? 'bg-amber-50 text-amber-500 dark:bg-amber-900/20' : 'bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-600 hover:text-amber-500'}`}>
                          <Star className={`w-5 h-5 ${email.is_starred ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="email-body text-slate-700 dark:text-slate-300 text-base lg:text-xl leading-relaxed prose prose-lg dark:prose-invert max-w-none font-medium">
                      {email.body_html ? (
                        <div 
                          className="overflow-x-auto break-words" 
                          style={{ 
                            maxWidth: '100%', 
                            wordWrap: 'break-word', 
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word'
                          }}
                          dangerouslySetInnerHTML={{ __html: email.body_html }} 
                        />
                      ) : (
                        <div className="whitespace-pre-wrap break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                          {email.body_text}
                        </div>
                      )}
                    </div>

                    {idx === selectedThreadEmails.length - 1 && (
                      <div className="mt-12 pt-10 border-t border-slate-50 dark:border-slate-800/40 flex flex-wrap gap-4">
                        <button className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all transform active:scale-95">Reply</button>
                        <button className="px-8 py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all">Forward</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/20 dark:bg-slate-950/20">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-blue-600/10 blur-[80px] rounded-full" />
              <Mail className="w-32 h-32 text-slate-100 dark:text-slate-800 relative z-10" />
            </div>
            <h2 className="text-3xl font-black text-slate-200 dark:text-slate-800 tracking-tighter mb-4">Focus Mode Active</h2>
            <p className="text-slate-400 dark:text-slate-700 font-bold max-w-xs mx-auto text-sm leading-relaxed uppercase tracking-widest">Select a conversation to reveal secured content</p>
          </div>
        )}
      </div>
    </div>
  );
};
