import { EmptyStateCard, SurfaceCard } from '@/components/cards';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/components/auth-provider';
import { useLibrary } from '@/lib/library';
import { Stack } from 'expo-router';
import { LogOutIcon, SettingsIcon } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

export default function MeScreen() {
  const { logs, books } = useLibrary();
  const { signOut } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [displayName, setDisplayName] = React.useState('shelfie user');
  const [savedDisplayName, setSavedDisplayName] = React.useState('shelfie user');
  const [handle] = React.useState('@shelfie_user');
  const [profileText, setProfileText] = React.useState('');
  const [savedProfileText, setSavedProfileText] = React.useState('');
  const [saveToast, setSaveToast] = React.useState(false);

  React.useEffect(() => {
    if (!saveToast) return;
    const timer = setTimeout(() => setSaveToast(false), 2000);
    return () => clearTimeout(timer);
  }, [saveToast]);

  const handleInitial = (
    handle.replace(/^@/, '').trim().slice(0, 1) ||
    displayName.trim().slice(0, 1) ||
    'S'
  ).toUpperCase();

  const makeLogCoverSvg = (title: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480">
      <rect width="360" height="480" fill="#222222"/>
      <rect x="28" y="28" width="304" height="424" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
      <text x="40" y="90" fill="#ffffff" font-size="28" font-family="ui-sans-serif, system-ui" font-weight="700">
        ${title}
      </text>
      <text x="40" y="430" fill="rgba(255,255,255,0.6)" font-size="12" font-family="ui-sans-serif, system-ui" letter-spacing="2">
        SHELFIE
      </text>
    </svg>`;

  const recentLogs = logs.slice(0, 4);
  const doneCount = books.filter((book) => book.statusKey === 'done').length;
  const stackCount = books.filter((book) => book.statusKey === 'stack').length;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <TopBar
          subtitle="マイページ"
          rightSlot={
            <View className="flex-row items-center gap-1">
              <Button size="icon" variant="ghost">
                <Icon as={SettingsIcon} size={18} className="text-foreground" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onPress={() => {
                  signOut().catch(() => undefined);
                }}>
                <Icon as={LogOutIcon} size={18} className="text-foreground" />
              </Button>
            </View>
          }
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 104 }}
          showsVerticalScrollIndicator={false}>
          <View className="px-4">
            <SurfaceCard className="overflow-hidden">
              <View className="h-28 bg-[linear-gradient(135deg,#1f1f1f,#3a3a3a)]" />
              <View className="px-4 pb-4">
                <View className="-mt-10 flex-row items-start justify-between">
                  <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-muted">
                    <Text variant="title" className="text-muted-foreground">
                      {handleInitial}
                    </Text>
                  </View>
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => setIsEditing((prev) => !prev)}>
                    <Text>{isEditing ? '編集を閉じる' : 'プロフィール編集'}</Text>
                  </Button>
                </View>

                {isEditing ? (
                  <View className="mt-5 gap-3">
                    <Input
                      placeholder="表示名"
                      value={displayName}
                      onChangeText={setDisplayName}
                    />
                    <TextInput
                      value={profileText}
                      onChangeText={setProfileText}
                      placeholder="プロフィール"
                      placeholderTextColor="#9a9a9a"
                      multiline
                      className="min-h-[96px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                    <View className="mt-2 flex-row justify-end gap-2">
                      <Button
                        variant="ghost"
                        onPress={() => {
                          setDisplayName(savedDisplayName);
                          setProfileText(savedProfileText);
                          setIsEditing(false);
                        }}>
                        <Text>キャンセル</Text>
                      </Button>
                      <Button
                        onPress={() => {
                          setSavedDisplayName(displayName);
                          setSavedProfileText(profileText);
                          setIsEditing(false);
                          setSaveToast(true);
                        }}>
                        <Text>保存</Text>
                      </Button>
                    </View>
                  </View>
                ) : (
                  <View className="mt-4 gap-2">
                    <Text variant="title" className="text-foreground">
                      {displayName}
                    </Text>
                    <Text variant="meta">{handle}</Text>
                    <Text variant="meta" className="text-foreground">
                      {profileText || 'プロフィールがまだ設定されていません。'}
                    </Text>
                  </View>
                )}

                <View className="mt-5 flex-row gap-3">
                  {[
                    { label: '読書数', value: books.length },
                    { label: '読了', value: doneCount },
                    { label: '積読', value: stackCount },
                  ].map((item) => (
                    <SurfaceCard key={item.label} className="flex-1 items-center py-3">
                      <Text variant="title" className="text-foreground">
                        {item.value}
                      </Text>
                      <Text variant="meta">{item.label}</Text>
                    </SurfaceCard>
                  ))}
                </View>
              </View>
            </SurfaceCard>

            <View className="mt-5">
              <Text variant="section" className="text-foreground">
                最近のログ
              </Text>
              <View className="mt-2">
                {recentLogs.length === 0 ? (
                  <EmptyStateCard message="最近のログはありません。" />
                ) : (
                  recentLogs.map((log) => (
                    <SurfaceCard
                      key={log.id}
                      className="mb-4 flex-row items-center gap-4 p-4">
                      <View className="h-16 w-12 bg-muted">
                        <SvgXml xml={makeLogCoverSvg(log.title || 'Book')} width="100%" height="100%" />
                      </View>
                      <View className="flex-1 gap-1">
                        <Text variant="body" className="font-semibold">
                          {log.title}
                        </Text>
                        <Text variant="meta">{log.message}</Text>
                        <Text variant="caption">{log.time}</Text>
                      </View>
                    </SurfaceCard>
                  ))
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      {saveToast && (
        <View className="absolute top-[72px] left-1/2 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
          <Text variant="meta" className="text-background">
            保存しました
          </Text>
        </View>
      )}
    </>
  );
}
