import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Brain, X, Send, ChevronDown, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

const PAGE_CONTEXT = {
  '/overview': { label: 'Overview', hint: 'Ask about your reminders, calendar or upcoming events…' },
  '/calendar': { label: 'Calendar', hint: 'Ask about your schedule, events or dates…' },
  '/memories': { label: 'Memories', hint: 'Ask about your people, goals or important dates…' },
  '/profile': { label: 'Profile', hint: 'Ask about your account or settings…' },
  '/': { label: 'Chat', hint: "What's on your mind?" },
};

const QUICK_CHIPS = {
  '/overview': ["What's today?", "Any birthdays soon?", "Show my goals"],
  '/calendar': ["What's next on my calendar?", "Any events this week?", "Add an event"],
  '/memories': ["Who have I saved?", "Show my active goals", "Add a person"],
  '/profile': ["How many memories do I have?", "What's connected?"],
  '/': ["Remind me about…", "Save a birthday", "What do I have coming up?"],
};

export default function SoreliaFAB() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const ctx = PAGE_CONTEXT[location.pathname] || PAGE_CONTEXT['/'];
  const chips = QUICK_CHIPS[location.pathname] || QUICK_CHIPS['/'];

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  useEffect(() => {
    // Reset messages when page changes
    setMessages([]);
    setOpen(false);
  }, [location.pathname]);

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const memories = await base44.entities.Memory.list('-created_date', 50);
      const memoryContext = memories.slice(0, 20).map(m =>
        `[${m.type}] ${m.title}${m.description ? ': ' + m.description : ''}${m.date ? ' (date: ' + m.date + ')' : ''}`
      ).join('\n');

      const systemPrompt = `You are Sorelia, a warm and intelligent personal memory assistant. 
The user is currently on the ${ctx.label} page of the app.
Keep responses concise and helpful (2-4 sentences max). Use emojis sparingly.
If the user wants to add something, encourage them to say it naturally and you'll remember it.

User's saved memories:
${memoryContext || 'No memories saved yet.'}`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nUser: ${userMsg}`,
      });

      const reply = typeof res === 'string' ? res : res?.response || "I'm here to help!";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      // If user wants to save something, offer to go to full chat
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that right now. Try the full chat for more help!" }]);
    }
    setLoading(false);
  }

  function openFullChat() {
    navigate('/', { state: { prefill: input || messages[messages.length - 1]?.content } });
    setOpen(false);
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[55] bg-black/20 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-up drawer */}
      <div
        className={`fixed left-0 right-0 z-[60] bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 transition-all duration-300 ease-out ${
          open ? 'bottom-0' : '-bottom-full'
        }`}
        style={{ maxHeight: '70vh' }}
      >
        {/* Handle & header */}
        <div className="flex flex-col">
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Sorelia</p>
                <p className="text-[10px] text-gray-400">{ctx.label} · Quick chat</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openFullChat}
                className="text-[11px] text-violet-500 font-semibold bg-violet-50 px-2.5 py-1 rounded-full"
              >
                Full chat
              </button>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: '38vh' }}>
          {messages.length === 0 && (
            <div className="py-2">
              <p className="text-xs text-gray-400 text-center mb-3">{ctx.hint}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {chips.map(chip => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="text-xs bg-violet-50 text-violet-600 font-medium px-3 py-1.5 rounded-full border border-violet-100 active:scale-95 transition-transform"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <Brain className="w-3 h-3 text-white" />
                </div>
              )}
              <div
                className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {m.role === 'assistant'
                  ? <ReactMarkdown className="text-sm prose prose-sm max-w-none">{m.content}</ReactMarkdown>
                  : m.content
                }
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0">
                <Brain className="w-3 h-3 text-white" />
              </div>
              <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-md flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2 items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={ctx.hint}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none text-gray-800 placeholder:text-gray-400"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        {/* Safe area padding */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>

      {/* FAB button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-[18px] left-1/2 -translate-x-1/2 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 shadow-xl flex items-center justify-center active:scale-95 transition-transform border-4 border-white"
        title="Chat with Sorelia"
      >
        {open
          ? <ChevronDown className="w-6 h-6 text-white" />
          : <Brain className="w-6 h-6 text-white" />
        }
        {!open && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />}
      </button>
    </>
  );
}