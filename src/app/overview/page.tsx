import ProtectedLayout from '@/components/ProtectedLayout';
import Home from '@/views/Home';

export default function OverviewPage() {
  return (
    <ProtectedLayout>
      <Home />
    </ProtectedLayout>
  );
}
