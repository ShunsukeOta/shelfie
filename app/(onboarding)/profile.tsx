import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Stack, useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

const HANDLE_MIN = 4;
const HANDLE_MAX = 16;
const NAME_MAX = 40;
const HANDLE_REGEX = /^[A-Za-z0-9_]+$/;

const sanitizeHandle = (value: string) =>
  value.replace(/[^A-Za-z0-9_]/g, '').slice(0, HANDLE_MAX);

export default function ProfileOnboardingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = React.useState(
    user?.displayName?.trim() || user?.email?.split('@')[0] || ''
  );
  const [handle, setHandle] = React.useState('');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    if (!user) return;
    const nextDisplayName = displayName.trim();
    const nextHandle = handle.trim();

    if (!nextDisplayName || nextDisplayName.length > NAME_MAX) {
      setError('名前は1〜40文字で入力してください。');
      return;
    }
    if (!nextHandle || nextHandle.length < HANDLE_MIN || nextHandle.length > HANDLE_MAX) {
      setError('IDは4〜16文字で入力してください。');
      return;
    }
    if (!HANDLE_REGEX.test(nextHandle)) {
      setError('IDは半角英数字とアンダーバーのみ使用できます。');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          displayName: nextDisplayName,
          handle: nextHandle,
          profileText: '',
          photoUrl: user.photoURL ?? '',
          headerUrl: '',
          email: user.email ?? '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      router.replace('/(tabs)/shelf');
    } catch {
      setError('保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <View className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#eeeeee]" />
        <View className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#f3f3f3]" />
        <View className="flex-1 justify-center px-6">
          <View className="mb-6">
            <Text className="text-[26px] font-semibold text-foreground">初回設定</Text>
            <Text variant="meta" className="mt-2 text-muted-foreground">
              名前とIDを設定してください。
            </Text>
          </View>
          <View className="rounded-2xl border border-border bg-card p-5 shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
            <View className="gap-3">
              <Input
                placeholder="名前（40文字まで）"
                value={displayName}
                onChangeText={(value) => setDisplayName(value.slice(0, NAME_MAX))}
              />
              <Input
                placeholder="ID（4〜16文字）"
                value={handle}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(value) => setHandle(sanitizeHandle(value))}
              />
            </View>
            {error ? (
              <Text className="mt-3 text-[12px] text-destructive">{error}</Text>
            ) : null}
            <View className="mt-4">
              <Button onPress={handleSave} disabled={saving}>
                <Text>{saving ? '保存中...' : 'はじめる'}</Text>
              </Button>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}
