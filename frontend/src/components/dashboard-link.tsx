'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight } from 'lucide-react';

interface DashboardLinkProps {
  variant?: 'button' | 'link' | 'outline';
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  text?: string;
  className?: string;
}

export function DashboardLink({
  variant = 'button',
  size = 'lg',
  showIcon = false,
  text = 'Go to Dashboard',
  className = '',
}: DashboardLinkProps) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <Button size={size} className={className} disabled>
        Loading...
      </Button>
    );
  }

  const href = userId ? '/dashboard' : '/login';
  const displayText = userId ? text : 'Sign in to continue';

  if (variant === 'link') {
    return (
      <Link href={href} className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition ${className}`}>
        {displayText}
      </Link>
    );
  }

  if (variant === 'outline') {
    return (
      <Link href={href}>
        <Button variant="outline" size={size} className={className}>
          {displayText}
          {showIcon && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </Link>
    );
  }

  // Default button variant
  return (
    <Link href={href}>
      <Button
        size={size}
        className={`rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 transition-all ${className}`}
      >
        {displayText}
        {showIcon && <ArrowRight className="w-4 h-4 ml-2" />}
      </Button>
    </Link>
  );
}
