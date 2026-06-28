import dynamic from 'next/dynamic';
import PageLoading from '@/components/PageLoading';

const CalendarPage = dynamic(() => import('@/views/CalendarPage'), { loading: () => <PageLoading /> });

export default function CalendarRoutePage() {
  return <CalendarPage />;
}
