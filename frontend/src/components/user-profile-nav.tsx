'use client';

import Link from 'next/link';
import { useUser, UserButton } from '@clerk/nextjs';
import { DashboardLink } from './dashboard-link';

export function UserProfileNav() {
  const { isLoaded, user } = useUser();

  // While loading, don't render anything to avoid hydration mismatch
  if (!isLoaded) {
    return null;
  }

  // If user is logged in, show user profile with UserButton
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 hidden sm:inline">
          {user.firstName || user.emailAddresses[0]?.emailAddress}
        </span>
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-9 h-9"
            }
          }}
        />
      </div>
    );
  }

  // If not logged in, show Dashboard and Sign in links
  return (
    <div className="flex items-center gap-4">
      <Link href="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition text-sm font-medium">
        Dashboard
      </Link>
      <DashboardLink 
        variant="outline"
        size="sm"
        text="Sign in"
        showIcon={false}
      />
    </div>
  );
}
