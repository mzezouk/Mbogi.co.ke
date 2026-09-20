import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Headphones, User, Loader2, ArrowRight } from 'lucide-react';
import { useMboka } from '../context/MbokaContext';

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AiAssistantModalProps {
  onClose?: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ onClose }) => {
  const { isAiCopilotOpen, setIsAiCopilotOpen, setActiveTab } = useMboka();
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        'Sasa! 👋 I am your Mboka Support Desk. Ask me anything about deposits, KPLC electricity tokens, affiliate earnings, blogging monetization, or setting up a POS shop!',
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isAiCopilotOpen) return null;

  const quickPrompts = [
    'How do I buy KPLC stima tokens?',
    'How does Mboka Affiliate commission work?',
    'How do I earn money writing on Mboka Blog?',
    'How do I deposit funds via M-Pesa?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: AiMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Mboka assistant is ready to help.';

      const botMsg: AiMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: reply,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          role: 'assistant',
          content: 'Mboka assistant encountered a network hitch. Please try asking again!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl h-[85vh] max-h-[680px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm font-heading">Mboka Support Desk</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                  24/7 Agency Desk
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Operations & Financial Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setIsAiCopilotOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-sm ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Headphones className="w-4 h-4 text-emerald-200" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs font-medium'
                    : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80 shadow-xs'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 text-sm justify-start">
              <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
              </div>
              <div className="bg-white text-slate-500 rounded-2xl rounded-tl-xs px-4 py-2.5 border border-slate-200/80 shadow-xs text-xs flex items-center gap-2">
                <span>Mboka Support is processing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(qp)}
              className="text-xs text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about M-Pesa, KPLC tokens, affiliate, or blogs..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
