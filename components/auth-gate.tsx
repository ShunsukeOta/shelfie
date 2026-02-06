import { useAuth } from '@/components/auth-provider';
import { Text } from '@/components/ui/text';
import { useRouter, useSegments } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

type AuthGateProps = {
  children: React.ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  React.useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/login');
      return;
    }

    if (user && inAuthGroup) {
      router.replace('/(tabs)/shelf');
    }
  }, [user, loading, router, segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text variant="meta" className="text-muted-foreground">
          読み込み中...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
