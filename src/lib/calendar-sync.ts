import { base44 } from '@/api/base44Client';

export interface CalendarSyncResult {
  events_fetched?: number;
  calendars_scanned?: number;
  memories_created?: number;
  memories_updated?: number;
  events?: Array<{
    id?: string;
    title?: string;
    start?: string;
    end?: string;
    location?: string;
    description?: string;
    calendarName?: string;
    allDay?: boolean;
  }>;
  error?: string;
  detail?: string;
}

function extractErrorMessage(error: unknown): string {
  const err = error as { message?: string; data?: { error?: string; detail?: string } };
  return err?.data?.error || err?.message || 'Calendar sync failed';
}

export async function syncGoogleCalendar(): Promise<CalendarSyncResult> {
  const result = await base44.functions.invoke('calendarScanner', {});
  return (result?.data ?? result) as CalendarSyncResult;
}

export async function syncGoogleCalendarSafe(): Promise<{ ok: true; result: CalendarSyncResult } | { ok: false; message: string }> {
  try {
    const result = await syncGoogleCalendar();
    if (result?.error) {
      return { ok: false, message: result.error };
    }
    return { ok: true, result };
  } catch (error) {
    return { ok: false, message: extractErrorMessage(error) };
  }
}

export function formatSyncSuccess(result: CalendarSyncResult): string {
  const created = result.memories_created ?? 0;
  const updated = result.memories_updated ?? 0;
  const fetched = result.events_fetched ?? 0;

  if (created === 0 && updated === 0) {
    return fetched > 0 ? 'Calendar is up to date' : 'No upcoming calendar events found';
  }

  const parts = [];
  if (created > 0) parts.push(`${created} new`);
  if (updated > 0) parts.push(`${updated} updated`);
  return `Calendar synced · ${parts.join(', ')}`;
}

export type CalendarConnectionStatus = 'unknown' | 'connected' | 'disconnected';

export function isConnectionError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('not connected') ||
    lower.includes('reconnect') ||
    lower.includes('could not read google calendar')
  );
}

export function getConnectionStatusLabel(status: CalendarConnectionStatus): string {
  if (status === 'connected') return 'Connected';
  if (status === 'disconnected') return 'Not connected';
  return 'Tap Sync to connect';
}
