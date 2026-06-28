import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import PageLoading from '@/components/PageLoading';

const Chat = dynamic(() => import('@/views/Chat'), { loading: () => <PageLoading /> });

export default function ChatPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Chat />
    </Suspense>
  );
}
