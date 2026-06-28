import ProtectedLayout from '@/components/ProtectedLayout';
import Developer from '@/views/Developer';

export default function DeveloperPage() {
  return (
    <ProtectedLayout>
      <Developer />
    </ProtectedLayout>
  );
}
