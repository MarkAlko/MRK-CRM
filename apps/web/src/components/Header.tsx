'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface HeaderProps {
  title?: string;
  onMenuToggle: () => void;
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition"
          aria-label="פתח תפריט"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        {/* Page title */}
        {title && (
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        )}
      </div>

      {/* User section */}
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-600 hidden sm:inline">
            {user.name}
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
        >
          יציאה
        </button>
      </div>
    </header>
  );
}
