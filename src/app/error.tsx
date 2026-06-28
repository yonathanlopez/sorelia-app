'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white px-6"
      style={{ backgroundColor: '#ffffff', color: '#111827' }}
    >
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-gray-600">{error.message || 'The app hit an unexpected error.'}</p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
