import { useAuth } from '@/components/auth-provider';
import { Redirect } from 'expo-router';
import * as React from 'react';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return <Redirect href={user ? '/(tabs)/shelf' : '/login'} />;
}
