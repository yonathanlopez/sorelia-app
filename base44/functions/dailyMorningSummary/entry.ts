import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users (admin operation)
    const users = await base44.asServiceRole.entities.User.list();

    for (const user of users) {
      if (!user.email) continue;

      const memories = await base44.asServiceRole.entities.Memory.filter({ created_by_id: user.id });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Active goals
      const activeGoals = memories.filter(m => m.type === 'goal' && m.status === 'active');

      // Important dates within 7 days
      const upcomingDates = memories
        .filter(m => {
          if (m.type !== 'important_date' || !m.date) return false;
          const d = new Date(m.date + 'T00:00:00');
          const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= 7;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Birthdays within 7 days
      const upcomingBirthdays = memories
        .filter(m => {
          if (m.type !== 'person' || !m.person_birthday) return false;
          const bdayThisYear = m.person_birthday.replace(/^\d{4}/, today.getFullYear());
          const d = new Date(bdayThisYear + 'T00:00:00');
          const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= 7;
        })
        .map(m => ({ ...m, _bdayDiff: Math.ceil((new Date(m.person_birthday.replace(/^\d{4}/, today.getFullYear()) + 'T00:00:00') - today) / (1000 * 60 * 60 * 24)) }))
        .sort((a, b) => a._bdayDiff - b._bdayDiff);

      if (activeGoals.length === 0 && upcomingDates.length === 0 && upcomingBirthdays.length === 0) continue;

      const firstName = user.full_name?.split(' ')[0] || 'there';
      const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

      let body = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;">`;
      body += `<div style="background:linear-gradient(135deg,#7c3aed,#9333ea);padding:28px 24px;border-radius:16px 16px 0 0;">`;
      body += `<h1 style="color:white;margin:0;font-size:22px;">☀️ Good morning, ${firstName}!</h1>`;
      body += `<p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">${dateLabel}</p>`;
      body += `</div>`;
      body += `<div style="background:#f9fafb;padding:24px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:none;">`;

      if (upcomingDates.length > 0 || upcomingBirthdays.length > 0) {
        body += `<h2 style="font-size:15px;font-weight:700;color:#374151;margin:0 0 12px;">📅 Coming Up</h2>`;
        for (const d of upcomingDates) {
          const diff = Math.ceil((new Date(d.date + 'T00:00:00') - today) / (1000 * 60 * 60 * 24));
          const when = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} days`;
          body += `<div style="background:white;border-radius:10px;padding:12px 14px;margin-bottom:8px;border:1px solid #e5e7eb;">`;
          body += `<div style="font-weight:600;font-size:14px;">${d.title}</div>`;
          if (d.description) body += `<div style="font-size:12px;color:#6b7280;margin-top:2px;">${d.description}</div>`;
          body += `<div style="font-size:11px;color:#7c3aed;font-weight:600;margin-top:4px;">${when}</div>`;
          body += `</div>`;
        }
        for (const b of upcomingBirthdays) {
          const when = b._bdayDiff === 0 ? 'Today 🎉' : b._bdayDiff === 1 ? 'Tomorrow' : `In ${b._bdayDiff} days`;
          body += `<div style="background:white;border-radius:10px;padding:12px 14px;margin-bottom:8px;border:1px solid #e5e7eb;">`;
          body += `<div style="font-weight:600;font-size:14px;">🎂 ${b.title}'s Birthday</div>`;
          body += `<div style="font-size:11px;color:#7c3aed;font-weight:600;margin-top:4px;">${when}</div>`;
          body += `</div>`;
        }
      }

      if (activeGoals.length > 0) {
        body += `<h2 style="font-size:15px;font-weight:700;color:#374151;margin:16px 0 12px;">🎯 Your Active Goals</h2>`;
        for (const g of activeGoals) {
          body += `<div style="background:white;border-radius:10px;padding:12px 14px;margin-bottom:8px;border:1px solid #e5e7eb;">`;
          body += `<div style="font-weight:600;font-size:14px;">${g.title}</div>`;
          if (g.description) body += `<div style="font-size:12px;color:#6b7280;margin-top:2px;">${g.description}</div>`;
          if (g.date) body += `<div style="font-size:11px;color:#059669;font-weight:600;margin-top:4px;">Due: ${g.date}</div>`;
          body += `</div>`;
        }
      }

      body += `<p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:20px;">Sent by Sorelia — your personal memory assistant</p>`;
      body += `</div></div>`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `☀️ Your Morning Summary — ${dateLabel}`,
        body,
      });
    }

    return Response.json({ success: true, usersNotified: users.filter(u => u.email).length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});