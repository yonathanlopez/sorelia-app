import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a3f1d5883dab3778fd3485c';

function decodeBase64(encoded) {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    return decodeURIComponent(escape(binary));
  } catch {
    return '';
  }
}

function extractBodyText(payload) {
  if (!payload) return '';
  if (payload.body?.data) return decodeBase64(payload.body.data);
  if (payload.parts) {
    let plain = '', html = '';
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) plain += decodeBase64(part.body.data);
      else if (part.mimeType === 'text/html' && part.body?.data) html += decodeBase64(part.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      else if (part.parts) plain += extractBodyText(part);
    }
    return (plain || html).slice(0, 3000);
  }
  return '';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Fetch up to 50 recent emails
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox',
      { headers: authHeader }
    );
    if (!listRes.ok) return Response.json({ error: 'Gmail API error' }, { status: 400 });

    const listData = await listRes.json();
    const messageIds = (listData.messages || []).slice(0, 30).map(m => m.id);
    if (messageIds.length === 0) return Response.json({ profile: null });

    const emailResults = await Promise.all(
      messageIds.map(id =>
        fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, { headers: authHeader })
          .then(r => r.ok ? r.json() : null)
      )
    );

    const emailSummaries = emailResults.filter(Boolean).map((msg, i) => {
      const headers = msg.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      const body = extractBodyText(msg.payload).slice(0, 1500);
      return `--- Email ${i + 1} ---\nFrom: ${from}\nSubject: ${subject}\nDate: ${date}\nBody:\n${body}`;
    }).join('\n\n');

    const profilePrompt = `You are analyzing someone's Gmail inbox to build a rich personal profile about them. Read every email carefully — their content, subscriptions, purchases, travel, appointments, habits, and interests reveal a lot about this person.

Here are their recent emails:
${emailSummaries}

Based ONLY on what you can infer from these emails, write a detailed personal profile of this person. Include:
- Their apparent lifestyle and daily life
- Interests, hobbies, and passions (from subscriptions, purchases, newsletters they receive)
- Travel habits and places they've been or plan to visit
- Health & wellness habits
- Work or career clues
- Social life and relationships (without naming specific people)
- Financial behavior (shopping, subscriptions, services they use)
- Any goals or plans they seem to have
- Their tech/product preferences (apps, devices, services)
- Any other interesting personality traits you can infer

Write it as a warm, conversational narrative in second person ("You seem to be..."), 4-6 paragraphs, like a thoughtful friend describing who they are based on their inbox. Be specific and concrete — reference actual things from the emails where appropriate.`;

    const profile = await base44.integrations.Core.InvokeLLM({
      prompt: profilePrompt,
      model: 'claude_sonnet_4_6',
    });

    return Response.json({ profile });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});