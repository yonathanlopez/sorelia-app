import ProtectedLayout from '@/components/ProtectedLayout';
import CalendarPage from '@/views/CalendarPage';

export default function CalendarRoutePage() {
  return (
    <ProtectedLayout>
      <CalendarPage />
    </ProtectedLayout>
  );
}
