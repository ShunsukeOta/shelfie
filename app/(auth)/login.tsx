import { GoogleAuthButton } from '@/components/google-auth-button';
import { Text } from '@/components/ui/text';
import { Link, Stack } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

export default function LoginScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <View className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#eeeeee]" />
        <View className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#f3f3f3]" />
        <View className="flex-1 justify-center px-6">
          <View className="mb-6">
            <Text className="text-[28px] font-semibold text-foreground">Shelfie</Text>
            <Text variant="meta" className="mt-2 text-muted-foreground">
              本棚をもっとシンプルに。
            </Text>
          </View>
          <View className="rounded-2xl border border-border bg-card p-5 shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
            <Text variant="section" className="text-foreground">
              ログイン
            </Text>
            <Text variant="meta" className="mt-2 text-muted-foreground">
              Googleアカウントで安全にログインできます。
            </Text>
            <View className="mt-4">
              <GoogleAuthButton mode="login" />
            </View>
            <View className="mt-4 flex-row items-center justify-center gap-2">
              <Text variant="meta" className="text-muted-foreground">
                はじめての方は
              </Text>
              <Link href="/register">
                <Text className="text-[12px] font-semibold text-foreground">新規登録</Text>
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
