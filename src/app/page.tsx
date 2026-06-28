import { Suspense } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import Chat from '@/views/Chat';

function ChatFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedLayout>
      <Suspense fallback={<ChatFallback />}>
        <Chat />
      </Suspense>
    </ProtectedLayout>
  );
}
