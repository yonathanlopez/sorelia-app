import dynamic from 'next/dynamic';
import PageLoading from '@/components/PageLoading';

const Profile = dynamic(() => import('@/views/Profile'), { loading: () => <PageLoading /> });

export default function ProfilePage() {
  return <Profile />;
}
