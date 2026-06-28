import ProtectedLayout from '@/components/ProtectedLayout';
import Profile from '@/views/Profile';

export default function ProfilePage() {
  return (
    <ProtectedLayout>
      <Profile />
    </ProtectedLayout>
  );
}
