import { Suspense } from 'react';
import Chat from '@/views/Chat';
import PageLoading from '@/components/PageLoading';

export default function ChatPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Chat />
    </Suspense>
  );
}
