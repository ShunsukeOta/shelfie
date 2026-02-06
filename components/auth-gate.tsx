import { useAuth } from '@/components/auth-provider';
import { Text } from '@/components/ui/text';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
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
  const [profileChecked, setProfileChecked] = React.useState(false);
  const [profileReady, setProfileReady] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setProfileChecked(false);
      setProfileReady(false);
      return;
    }
    setProfileChecked(false);
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (!snap.exists()) {
          setProfileReady(false);
          setProfileChecked(true);
          return;
        }
        const data = snap.data() as { handle?: string; displayName?: string };
        const hasHandle = typeof data.handle === 'string' && data.handle.trim().length >= 4;
        const hasName = typeof data.displayName === 'string' && data.displayName.trim().length > 0;
        setProfileReady(hasHandle && hasName);
        setProfileChecked(true);
      },
      () => {
        setProfileReady(false);
        setProfileChecked(true);
      }
    );

    return () => {
      unsub();
    };
  }, [user?.uid]);

  React.useEffect(() => {
    if (loading || (user && !profileChecked)) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!user && !inAuthGroup) {
      router.replace('/login');
      return;
    }

    if (user && !profileReady && !inOnboardingGroup) {
      router.replace('/(onboarding)/profile');
      return;
    }

    if (user && profileReady && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)/shelf');
    }
  }, [user, loading, profileChecked, profileReady, router, segments]);

  if (loading || (user && !profileChecked)) {
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
