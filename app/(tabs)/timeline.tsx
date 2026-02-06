import { EmptyStateCard, SurfaceCard } from '@/components/cards';
import { Chip } from '@/components/chips';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useLibrary } from '@/lib/library';
import { Stack } from 'expo-router';
import { SearchIcon, ThumbsUpIcon } from 'lucide-react-native';
import * as React from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';

type FilterKey = 'all' | 'reading' | 'done';

export default function TimelineScreen() {
  const { logs } = useLibrary();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [queryText, setQueryText] = React.useState('');
  const [liked, setLiked] = React.useState<Record<string, boolean>>({});
  const [filter, setFilter] = React.useState<FilterKey>('all');

  const toggleLike = (id: string) => {
    setLiked((current) => ({ ...current, [id]: !current[id] }));
  };

  const filteredLogs = React.useMemo(() => {
    const normalized = queryText.trim().toLowerCase();
    const base =
      filter === 'all'
        ? logs
        : logs.filter((log) => log.statusKey === (filter === 'reading' ? 'reading' : 'done'));
    if (!normalized) return base;
    return base.filter((log) => log.title.toLowerCase().includes(normalized));
  }, [logs, queryText, filter]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <TopBar
          subtitle="タイムライン"
          rightSlot={
            <Button size="icon" variant="ghost" onPress={() => setSearchOpen(true)}>
              <Icon as={SearchIcon} size={18} className="text-foreground" />
            </Button>
          }
        />

        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <SurfaceCard className="p-5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text variant="section">フォロー中の更新</Text>
                  <Text variant="meta" className="mt-2">
                    ここにフォローした人の読書ログが表示されます。
                  </Text>
                </View>
                <View className="items-end">
                  <Text variant="caption">表示件数</Text>
                  <Text variant="title">{filteredLogs.length}</Text>
                </View>
              </View>
              <View className="mt-4 flex-row items-center gap-2">
                {[
                  { key: 'all', label: 'すべて' },
                  { key: 'reading', label: '読書中' },
                  { key: 'done', label: '読了' },
                ].map((item) => (
                  <Chip
                    key={item.key}
                    label={item.label}
                    selected={filter === item.key}
                    size="md"
                    onPress={() => setFilter(item.key as FilterKey)}
                  />
                ))}
              </View>
            </SurfaceCard>
          }
          renderItem={({ item }) => (
            <SurfaceCard className="mt-4 flex-row items-start gap-4 p-4">
              <View className="h-16 w-12 bg-muted" />
              <View className="flex-1 gap-1">
                <View className="flex-row items-center justify-between">
                  <Text variant="body" className="font-semibold">
                    {item.title}
                  </Text>
                  {item.status && (
                    <View
                      className={
                        item.statusKey === 'unread'
                          ? 'rounded-[2px] bg-[#8c8c8c] px-1.5 py-[1px]'
                          : item.statusKey === 'stack'
                            ? 'rounded-[2px] bg-[#2f5fbf] px-1.5 py-[1px]'
                            : item.statusKey === 'reading'
                              ? 'rounded-[2px] bg-[#c36a1e] px-1.5 py-[1px]'
                              : 'rounded-[2px] bg-[#2f8a4a] px-1.5 py-[1px]'
                      }>
                      <Text variant="caption" className="text-white">
                        {item.status}
                      </Text>
                    </View>
                  )}
                </View>
                <Text variant="meta">{item.message}</Text>
                <View className="flex-row items-center justify-between">
                  <Text variant="caption">{item.time}</Text>
                  <Pressable onPress={() => toggleLike(item.id)} className="flex-row items-center gap-1">
                    <Icon
                      as={ThumbsUpIcon}
                      size={16}
                      className={liked[item.id] ? 'text-foreground' : 'text-muted-foreground'}
                    />
                    <Text variant="caption">
                      {(item.likeCount ?? 0) + (liked[item.id] ? 1 : 0)}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </SurfaceCard>
          )}
          ListEmptyComponent={
            <View className="mt-5">
              <EmptyStateCard message="まだ表示できる更新がありません。" />
            </View>
          }
        />
      </View>

      <Modal transparent visible={searchOpen} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-4">
          <View className="w-full max-w-md rounded-2xl bg-card p-6">
            <Text variant="section">タイトルで検索</Text>
            <Text variant="meta" className="mt-1">
              ログのタイトルで絞り込みます。
            </Text>
            <View className="mt-4">
              <Input
                value={queryText}
                onChangeText={setQueryText}
                placeholder="タイトルを入力"
              />
            </View>
            <View className="mt-5 flex-row justify-end gap-2">
              <Button variant="ghost" onPress={() => setSearchOpen(false)}>
                <Text>閉じる</Text>
              </Button>
              <Button onPress={() => setSearchOpen(false)}>
                <Text>検索</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
