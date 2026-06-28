import { Suspense } from 'react';
import Chat from '@/views/Chat';

function ChatFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatFallback />}>
      <Chat />
    </Suspense>
  );
}
