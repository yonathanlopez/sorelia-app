import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ImageIcon, RefreshCw, Sparkles } from 'lucide-react';

export default function LifeIllustration() {
  const [imageUrl, setImageUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setImageUrl(null);
    setCaption('');

    const [allMemories, scannedEmails] = await Promise.all([
      base44.entities.Memory.list('-created_date', 100),
      base44.entities.ScannedEmail.list('-created_date', 30),
    ]);

    const memorySummary = allMemories.length > 0
      ? allMemories.map(m => `- [${m.type}] ${m.title}${m.description ? ': ' + m.description : ''}${m.date ? ' (' + m.date + ')' : ''}`).join('\n')
      : 'No saved memories yet.';

    const emailSummary = scannedEmails.length > 0
      ? scannedEmails.slice(0, 20).map(e => `- ${e.subject}${e.category_label ? ' [' + e.category_label + ']' : ''}${e.extracted_entities && e.extracted_entities !== 'none' ? ': ' + e.extracted_entities : ''}`).join('\n')
      : 'No scanned emails yet.';

    // Ask LLM to craft a rich image prompt and caption from the life data
    const promptResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a creative artist. Based on someone's life memories and emails below, craft:
1. A vivid, detailed image generation prompt (for an illustration that captures the essence of their life — their travels, relationships, goals, events, personality). Make it painterly, warm, and personal. 1-3 sentences.
2. A short poetic caption (1 sentence) to display under the image.

Memories:
${memorySummary}

Recent emails:
${emailSummary}

Return JSON with: { "image_prompt": string, "caption": string }`,
      model: 'gpt_5_5',
      response_json_schema: {
        type: 'object',
        properties: {
          image_prompt: { type: 'string' },
          caption: { type: 'string' },
        },
        required: ['image_prompt', 'caption'],
      },
    });

    const fullPrompt = `A beautiful, warm illustrated portrait of someone's life story: ${promptResult.image_prompt} Style: painterly watercolor illustration, soft lighting, rich detail, deeply personal and emotional.`;

    const imgResult = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });

    setImageUrl(imgResult.url);
    setCaption(promptResult.caption);
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center px-5 py-8 gap-6">
      {!imageUrl && !loading && (
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-9 h-9 text-violet-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Your Life Illustration</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
            Generate a personalized painting of your life based on your memories and emails.
          </p>
          <button
            onClick={generate}
            className="mt-6 flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-full font-medium text-sm hover:bg-violet-700 transition-colors mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Create My Illustration
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-700">Painting your life story…</p>
          <p className="text-xs text-gray-400 text-center max-w-xs">Analyzing your memories and emails to craft a unique illustration</p>
        </div>
      )}

      {imageUrl && !loading && (
        <div className="w-full max-w-sm">
          <img
            src={imageUrl}
            alt="Your life illustration"
            className="w-full rounded-3xl shadow-xl"
          />
          {caption && (
            <p className="text-center text-sm text-gray-600 italic mt-4 px-2">{caption}</p>
          )}
          <button
            onClick={generate}
            className="mt-5 flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}