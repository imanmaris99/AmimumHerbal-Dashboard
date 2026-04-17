import React from 'react';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  excludeRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  excludeRoles, 
  fallback = null 
}: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user) return fallback;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return fallback;
  }

  if (excludeRoles && excludeRoles.includes(user.role)) {
    return fallback;
  }

  return <>{children}</>;
}
