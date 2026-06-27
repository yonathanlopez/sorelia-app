import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Brain, Sparkles } from 'lucide-react';
import ChatBubble from '@/components/sorelia/ChatBubble';
import BottomNav from '@/components/BottomNav';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [buildingProfile, setBuildingProfile] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const initialQuestionHandled = useRef(false);

  // Load or create conversation
  useEffect(() => {
    async function load() {
      const convos = await base44.entities.Conversation.list('-updated_date', 1);
      if (convos.length > 0) {
        setConversationId(convos[0].id);
        setMessages(convos[0].messages || []);
      }
    }
    load();
  }, []);

  // Handle quick question from URL
  useEffect(() => {
    if (initialQuestionHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      initialQuestionHandled.current = true;
      // Small delay so conversation loads first
      setTimeout(() => sendMessage(q), 500);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    const userMsg = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Fetch all memories for context
    let memoryContext = '';
    const allMemories = await base44.entities.Memory.list('-created_date', 50);
    if (allMemories.length > 0) {
      memoryContext = '\n\nHere are the user\'s saved memories for context:\n' +
        allMemories.map(m => `- [${m.type}] ${m.title}${m.description ? ': ' + m.description : ''}${m.date ? ' (date: ' + m.date + ')' : ''}${m.people?.length ? ' (people: ' + m.people.join(', ') + ')' : ''}`).join('\n');
    }

    // Build conversation history for AI (last 20 messages)
    const historyForAI = newMessages.slice(-20).map(m => `${m.role === 'user' ? 'User' : 'Sorelia'}: ${m.content}`).join('\n');

    // AI call 1: Generate reply
    const replyPrompt = `You are Sorelia, a warm and caring personal memory assistant. You help users remember important things about their life — people, dates, goals, preferences, and life events.

Your personality:
- Warm, empathetic, and attentive
- You speak naturally, like a trusted friend
- You acknowledge what users share with genuine care
- When users share something memorable, confirm you'll remember it
- When asked about memories, answer from the saved memories context below
- Keep responses concise but warm (2-3 sentences usually)
- If this is the first interaction, warmly introduce yourself and ask what you should remember

Conversation so far:
${historyForAI}
${memoryContext}

Respond to the user's latest message naturally.`;

    const [reply] = await Promise.all([
      base44.integrations.Core.InvokeLLM({ prompt: replyPrompt, model: 'gpt_5_5' }),
      // AI call 2: Extract memories (runs in parallel)
      extractMemories(msg),
    ]);

    const assistantMsg = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
    const updatedMessages = [...newMessages, assistantMsg];
    setMessages(updatedMessages);

    // Save conversation
    if (conversationId) {
      await base44.entities.Conversation.update(conversationId, { messages: updatedMessages });
    } else {
      const convo = await base44.entities.Conversation.create({ messages: updatedMessages });
      setConversationId(convo.id);
    }

    setSending(false);
  }

  async function extractMemories(userMessage) {
    const extractPrompt = `Analyze this message and extract any memories worth saving. A memory is any personal fact, date, person, goal, preference, life event, or reminder.

Message: "${userMessage}"

Return a JSON object with a "memories" array. Each memory should have:
- type: one of "person", "goal", "important_date", "preference", "life_event", "reminder"
- title: short descriptive title
- description: brief description (optional)
- date: any date mentioned (optional, keep in natural format like "March 12")
- people: array of people names mentioned (optional)

If no memories are found, return {"memories": []}.
Only extract clear, specific facts — not vague statements.`;

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
        await base44.entities.Memory.create({
          type: mem.type,
          title: mem.title,
          description: mem.description || '',
          date: mem.date || '',
          people: mem.people || [],
          source: 'chat',
        });
      }
    }
  }

  async function handleBuildProfile() {
    if (buildingProfile || sending) return;
    setBuildingProfile(true);

    const thinkingMsg = { role: 'assistant', content: '🔍 Reading your emails to build your profile...', timestamp: new Date().toISOString() };
    const newMessages = [...messages, thinkingMsg];
    setMessages(newMessages);

    try {
      const res = await base44.functions.invoke('buildEmailProfile', {});
      const profile = res.data?.profile;
      const profileMsg = {
        role: 'assistant',
        content: profile
          ? `✨ **Here's what your inbox says about you:**\n\n${profile}`
          : "I couldn't find enough emails to build a profile yet. Try connecting Gmail first.",
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...messages, profileMsg];
      setMessages(finalMessages);
      if (conversationId) {
        await base44.entities.Conversation.update(conversationId, { messages: finalMessages });
      } else {
        const convo = await base44.entities.Conversation.create({ messages: finalMessages });
        setConversationId(convo.id);
      }
    } catch {
      const errMsg = { role: 'assistant', content: "Connect Gmail first so I can read your emails and build your profile.", timestamp: new Date().toISOString() };
      setMessages([...messages, errMsg]);
    } finally {
      setBuildingProfile(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">Sorelia</h1>
          <p className="text-xs text-gray-500">Your memory assistant</p>
        </div>
        <button
          onClick={handleBuildProfile}
          disabled={buildingProfile || sending}
          className="flex items-center gap-1.5 text-xs font-medium bg-violet-50 text-violet-600 px-3 py-2 rounded-full disabled:opacity-40 hover:bg-violet-100 transition-colors"
        >
          {buildingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          My Profile
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !sending && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Hi! I'm Sorelia</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
              Tell me about the people, dates, and things that matter to you. I'll remember everything.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {sending && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 mb-16">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me something to remember..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-200 transition-all"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white disabled:opacity-40 hover:bg-violet-700 transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}