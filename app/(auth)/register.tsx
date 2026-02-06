import { GoogleAuthButton } from '@/components/google-auth-button';
import { Text } from '@/components/ui/text';
import { Link, Stack } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

export default function RegisterScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <View className="absolute -top-16 -right-12 h-56 w-56 rounded-full bg-[#eeeeee]" />
        <View className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#f3f3f3]" />
        <View className="flex-1 justify-center px-6">
          <View className="mb-6">
            <Text className="text-[28px] font-semibold text-foreground">Shelfie</Text>
            <Text variant="meta" className="mt-2 text-muted-foreground">
              新しい本棚体験を始めましょう。
            </Text>
          </View>
          <View className="rounded-2xl border border-border bg-card p-5 shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
            <Text variant="section" className="text-foreground">
              新規登録
            </Text>
            <Text variant="meta" className="mt-2 text-muted-foreground">
              Googleアカウントで登録できます。
            </Text>
            <View className="mt-4">
              <GoogleAuthButton mode="register" />
            </View>
            <View className="mt-4 flex-row items-center justify-center gap-2">
              <Text variant="meta" className="text-muted-foreground">
                すでにアカウントがある方は
              </Text>
              <Link href="/login">
                <Text className="text-[12px] font-semibold text-foreground">ログイン</Text>
              </Link>
            </View>
          </View>
          <Text className="mt-6 text-center text-[12px] text-muted-foreground">
            ログインしないとアプリを利用できません。
          </Text>
        </View>
      </View>
    </>
  );
}
