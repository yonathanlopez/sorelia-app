import { Suspense } from 'react';
import ResetPassword from '@/views/ResetPassword';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}
