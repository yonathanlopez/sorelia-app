import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Brain, Sparkles, ChevronLeft } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  { emoji: "📅", text: "What's coming up this week?" },
  { emoji: "🎯", text: "What are my active goals?" },
  { emoji: "👥", text: "Who are the important people in my life?" },
  { emoji: "🎂", text: "Any birthdays coming up soon?" },
  { emoji: "💡", text: "What do you know about me?" },
  { emoji: "📝", text: "Help me set a new goal" },
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[78%]">
          <div className="bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-sm">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          {time && <p className="text-[10px] text-gray-400 text-right mt-1 px-1">{time}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mb-4">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="max-w-[78%]">
        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
          <div className="text-sm leading-relaxed text-gray-800 prose prose-sm prose-p:my-1 prose-ul:my-1 max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
        {time && <p className="text-[10px] text-gray-400 mt-1 px-1">{time}</p>}
      </div>
    </div>
  );
}

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const initialQuestionHandled = useRef(false);

  useEffect(() => {
    async function load() {
      const [me, convos] = await Promise.all([
        base44.auth.me(),
        base44.entities.Conversation.list('-updated_date', 1),
      ]);
      setUser(me);
      if (convos.length > 0) {
        setConversationId(convos[0].id);
        setMessages(convos[0].messages || []);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (initialQuestionHandled.current) return;
    const prefill = location.state?.prefill;
    if (prefill && conversationId !== undefined) {
      initialQuestionHandled.current = true;
      setInput(prefill);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [conversationId, location.state?.prefill]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function sendMessage(text) {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    const userMsg = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const allMemories = await base44.entities.Calendar.list('-created_date', 100);

    let memoryContext = '';
    if (allMemories.length > 0) {
      memoryContext = '\n\nSaved memories:\n' +
        allMemories.map(m =>
          `- [${m.type}] ${m.title}${m.description ? ': ' + m.description : ''}${m.date ? ' (date: ' + m.date + ')' : ''}${m.person_birthday ? ' (birthday: ' + m.person_birthday + ')' : ''}${m.person_relationship ? ' (relationship: ' + m.person_relationship + ')' : ''}${m.status ? ' (status: ' + m.status + ')' : ''}`
        ).join('\n');
    }

    let calendarContext = '';
    try {
      const calRes = await base44.functions.invoke('calendarScanner', { preview: true });
      if (calRes?.data?.events?.length > 0) {
        calendarContext = `\n\nUpcoming calendar events:\n` +
          calRes.data.events.slice(0, 8).map(e => `- ${e.summary || e.title} on ${e.start || e.date}`).join('\n');
      }
    } catch { }

    const historyForAI = newMessages.slice(-20).map(m => `${m.role === 'user' ? 'User' : 'Sorelia'}: ${m.content}`).join('\n');
    const firstName = user?.full_name?.split(' ')[0] || 'there';

    const replyPrompt = `You are Sorelia, a brilliant and warm AI Memory Assistant for ${firstName}. You are their personal life companion — you remember everything about their world.

Your capabilities:
- Remember people, goals, important dates, and personal facts about ${firstName}
- Look up upcoming calendar events and important dates
- Track goals and celebrate progress
- Set reminders by saving them to memory
- Give personalized, context-aware answers

Your tone:
- Warm but sharp — like a best friend who happens to be brilliant
- Call the user by their first name (${firstName}) naturally, but not in every message
- Be concise — 2-4 sentences unless detail is needed
- Use light formatting (bold, bullets) only when it genuinely helps clarity
- When saving something new, say "I'll remember that" or "Got it, I've saved that"
- Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

${memoryContext}${calendarContext}

Conversation:
${historyForAI}

Respond naturally to the user's latest message.`;

    let reply = "I'm not able to respond right now — the AI integration credits for this workspace are exhausted. Please upgrade your plan or wait for the monthly reset on July 23rd.";
    try {
      [reply] = await Promise.all([
        base44.integrations.Core.InvokeLLM({ prompt: replyPrompt, model: 'gpt_5_5' }),
        extractMemories(msg),
      ]);
    } catch (e) { }

    const assistantMsg = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
    const updatedMessages = [...newMessages, assistantMsg];
    setMessages(updatedMessages);

    if (conversationId) {
      await base44.entities.Conversation.update(conversationId, { messages: updatedMessages });
    } else {
      const convo = await base44.entities.Conversation.create({ messages: updatedMessages });
      setConversationId(convo.id);
    }

    setSending(false);
  }

  async function extractMemories(userMessage) {
    const extractPrompt = `Extract any memorable personal facts from this message. Only extract clear, specific facts worth remembering long-term.

Message: "${userMessage}"

Return JSON: { "memories": [{ "type": "person"|"goal"|"important_date", "title": "...", "description": "...", "date": "...", "people": [] }] }
If nothing worth saving, return { "memories": [] }.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: extractPrompt,
        model: 'gpt_5_mini',
        response_json_schema: {
          type: 'object',
          properties: {
            memories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  date: { type: 'string' },
                  people: { type: 'array', items: { type: 'string' } },
                },
                required: ['type', 'title'],
              },
            },
          },
        },
      });
      if (result?.memories?.length > 0) {
        for (const mem of result.memories) {
          await base44.entities.Calendar.create({
            type: mem.type,
            title: mem.title,
            description: mem.description || '',
            date: mem.date || '',
            people: mem.people || [],
            source: 'chat',
          });
        }
      }
    } catch { }
  }

  const firstName = user?.full_name?.split(' ')[0] || '';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-violet-500 to-purple-600 px-5 pt-14 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/overview" className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Sorelia</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-white/70 text-xs">AI Memory Assistant</span>
              </div>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/20">
            <p className="text-white/90 text-xs font-medium">
              {messages.length > 0 ? `${Math.floor(messages.length / 2)} chats` : 'New chat'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 pb-36">
        {messages.length === 0 && !sending && (
          <div className="pt-4">
            {/* Personal greeting */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {firstName ? `Hey ${firstName} 👋` : 'Hey there 👋'}
              </h2>
              <p className="text-sm text-gray-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                I'm Sorelia — your personal memory assistant. Tell me anything and I'll remember it for you.
              </p>
            </div>

            {/* Suggestion chips */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">Try asking</p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="text-left bg-white border border-gray-100 rounded-2xl px-3 py-3 shadow-sm hover:border-violet-200 hover:bg-violet-50 transition-all group"
                  >
                    <span className="text-lg block mb-1">{s.emoji}</span>
                    <span className="text-xs text-gray-700 group-hover:text-violet-700 leading-snug">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {sending && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom)+4rem)]">
        <div className="flex items-end gap-2 max-w-lg mx-auto">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 flex items-end gap-2 min-h-[46px]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me anything or share something to remember..."
              className="flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed placeholder-gray-400 max-h-28"
              rows={1}
              disabled={sending}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white disabled:opacity-40 hover:from-violet-700 hover:to-purple-700 transition-all shadow-md shadow-violet-200 flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}