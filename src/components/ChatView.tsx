import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Search,
  Send,
  Paperclip,
  Mic,
  CheckCheck,
  Phone,
  ShieldCheck,
  Info,
  Smile,
  Volume2,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { ChatConversation } from '../types';

export const ChatView: React.FC = () => {
  const {
    user,
    conversations,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
  } = useMboka();

  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConv) return;
    sendMessage(activeConv.id, messageInput.trim());
    setMessageInput('');
  };

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden h-[78vh] min-h-[550px] flex animate-in fade-in duration-150">
      {/* Sidebar Channels & DMs */}
      <div className="w-full sm:w-80 md:w-96 border-r border-slate-200 flex flex-col shrink-0">
        {/* Search */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base font-heading">Mboka Chat & Guilds</h2>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Live Hub
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search groups or agents..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConv?.id;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                  isSelected ? 'bg-emerald-50/70 border-r-4 border-emerald-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                  {conv.isGroup && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">
                      <Users className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[140px]">
                      {conv.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{conv.lastMessageTime}</span>
                  </div>

                  <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>

                  <div className="flex items-center gap-1.5 mt-1">
                    {conv.badge && (
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-sm">
                        {conv.badge}
                      </span>
                    )}
                    {conv.membersCount && (
                      <span className="text-[9px] text-slate-400">{conv.membersCount} members</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Active Window */}
      {activeConv ? (
        <div className="hidden sm:flex flex-1 flex-col bg-slate-50/50">
          {/* Active Chat Header */}
          <div className="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <img
                src={activeConv.avatar}
                alt={activeConv.name}
                className="w-10 h-10 rounded-2xl object-cover ring-1 ring-slate-200"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 font-heading">{activeConv.name}</h3>
                  {activeConv.badge && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                      {activeConv.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate max-w-sm">
                  {activeConv.description || `${activeConv.membersCount || 2} active participants`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => alert(`Connecting with ${activeConv.name}...`)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Call Desk"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => alert(activeConv.description || 'Mboka Community Guild')}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Channel Info"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {activeConv.messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 max-w-[80%] ${m.isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {!m.isMe && (
                  <img
                    src={m.senderAvatar}
                    alt={m.senderName}
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-1"
                  />
                )}

                <div>
                  {!m.isMe && (
                    <span className="text-[10px] font-semibold text-slate-500 block mb-0.5 ml-1">
                      {m.senderName}
                    </span>
                  )}

                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      m.isMe
                        ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs font-medium'
                        : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80 shadow-xs'
                    }`}
                  >
                    {m.text}
                  </div>

                  <div
                    className={`flex items-center gap-1 text-[10px] text-slate-400 mt-1 ${
                      m.isMe ? 'justify-end mr-1' : 'ml-1'
                    }`}
                  >
                    <span>{m.timestamp}</span>
                    {m.isMe && <CheckCheck className="w-3 h-3 text-emerald-600" />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Composer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message ${activeConv.name}...`}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />

              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden sm:flex items-center justify-center text-xs text-slate-400">
          Select a chat to begin messaging
        </div>
      )}
    </div>
  );
};
