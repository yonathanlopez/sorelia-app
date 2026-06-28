import dynamic from 'next/dynamic';
import PageLoading from '@/components/PageLoading';

const Home = dynamic(() => import('@/views/Home'), { loading: () => <PageLoading /> });

export default function OverviewPage() {
  return <Home />;
}
