import { EmptyStateCard, SurfaceCard } from '@/components/cards';
import { Chip } from '@/components/chips';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAt,
  endAt,
  writeBatch,
} from 'firebase/firestore';
import { Stack } from 'expo-router';
import { SearchIcon, ThumbsUpIcon, UserPlusIcon } from 'lucide-react-native';
import * as React from 'react';
import { FlatList, Image, Modal, Pressable, View } from 'react-native';

type FilterKey = 'all' | 'reading' | 'done';

type UserSuggestion = {
  id: string;
  handle: string;
  displayName: string;
  photoUrl?: string;
};

type TimelineLog = {
  id: string;
  title: string;
  status?: string;
  statusKey?: FilterKey | 'unread' | 'stack' | 'reading' | 'done';
  action?: 'add' | 'update' | 'remove';
  statusLabel?: string;
  time: string;
  message: string;
  createdAt?: number;
  likeCount?: number;
  userId?: string;
};

const toMillis = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  return Date.now();
};

const toDateString = (value: unknown) => {
  if (value && typeof value === 'object' && 'toDate' in value) {
    const dateValue = (value as { toDate: () => Date }).toDate();
    return dateValue.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
};

const formatRelativeTime = (timestamp?: number) => {
  if (!timestamp) return 'たった今';
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'たった今';
  if (diffMinutes < 60) return `${diffMinutes}分`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}時間`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}日`;
};

export default function TimelineScreen() {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [userQuery, setUserQuery] = React.useState('');
  const [userResults, setUserResults] = React.useState<UserSuggestion[]>([]);
  const [userLoading, setUserLoading] = React.useState(false);
  const [liked, setLiked] = React.useState<Record<string, boolean>>({});
  const [filter, setFilter] = React.useState<FilterKey>('all');
  const [following, setFollowing] = React.useState<Record<string, boolean>>({});
  const [followIds, setFollowIds] = React.useState<string[]>([]);
  const [timelineLogs, setTimelineLogs] = React.useState<TimelineLog[]>([]);
  const [profileMap, setProfileMap] = React.useState<
    Record<string, { displayName: string; handle: string; photoUrl?: string }>
  >({});

  const toggleLike = (id: string) => {
    setLiked((current) => ({ ...current, [id]: !current[id] }));
  };

  React.useEffect(() => {
    if (!user) {
      setFollowIds([]);
      return;
    }
    const followingRef = collection(db, 'users', user.uid, 'following');
    return onSnapshot(followingRef, (snapshot) => {
      setFollowIds(snapshot.docs.map((docSnap) => docSnap.id));
    });
  }, [user?.uid]);

  React.useEffect(() => {
    if (followIds.length === 0) {
      setProfileMap({});
      return;
    }
    let active = true;
    const loadProfiles = async () => {
      try {
        const docs = await Promise.all(followIds.map((id) => getDoc(doc(db, 'users', id))));
        if (!active) return;
        const next: Record<string, { displayName: string; handle: string; photoUrl?: string }> = {};
        docs.forEach((docSnap, index) => {
          if (!docSnap.exists()) return;
          const data = docSnap.data() as {
            displayName?: string;
            handle?: string;
            photoUrl?: string;
          };
          const id = followIds[index];
          next[id] = {
            displayName: data.displayName ?? 'ユーザー',
            handle: data.handle ?? '',
            photoUrl: data.photoUrl ?? undefined,
          };
        });
        setProfileMap(next);
      } catch {
        if (!active) return;
        setProfileMap({});
      }
    };

    loadProfiles();

    return () => {
      active = false;
    };
  }, [followIds]);

  React.useEffect(() => {
    const next: Record<string, boolean> = {};
    followIds.forEach((id) => {
      next[id] = true;
    });
    setFollowing(next);
  }, [followIds]);

  const toggleFollowDb = async (targetId: string, shouldFollow: boolean) => {
    if (!user || targetId === user.uid) return;
    setFollowing((current) => ({ ...current, [targetId]: shouldFollow }));
    const batch = writeBatch(db);
    const followingRef = doc(db, 'users', user.uid, 'following', targetId);
    const followerRef = doc(db, 'users', targetId, 'followers', user.uid);

    if (shouldFollow) {
      batch.set(followingRef, { createdAt: serverTimestamp() });
      batch.set(followerRef, { createdAt: serverTimestamp() });
    } else {
      batch.delete(followingRef);
      batch.delete(followerRef);
    }

    await batch.commit();
  };

  React.useEffect(() => {
    if (!user || followIds.length === 0) {
      setTimelineLogs([]);
      return;
    }
    let active = true;

    const loadTimeline = async () => {
      try {
        const responses = await Promise.all(
          followIds.map((id) =>
            getDocs(query(collection(db, 'users', id, 'logs'), orderBy('createdAt', 'desc'), limit(10)))
          )
        );
        if (!active) return;
        const merged = responses
          .flatMap((snapshot) =>
            snapshot.docs.map((docSnap) => {
              const data = docSnap.data() as {
                title?: string;
                status?: string;
                statusKey?: FilterKey;
                message?: string;
                createdAt?: unknown;
                likeCount?: number;
              };
              return {
                id: docSnap.id,
                title: data.title ?? '',
                status: data.status ?? '',
                statusKey: data.statusKey,
                action: data.action,
                statusLabel: data.statusLabel,
                time: toDateString(data.createdAt),
                message: data.message ?? '',
                createdAt: toMillis(data.createdAt),
                likeCount: data.likeCount ?? 0,
                userId: data.userId ?? undefined,
              } as TimelineLog;
            })
          )
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
          .slice(0, 30);
        setTimelineLogs(merged);
      } catch {
        if (!active) return;
        setTimelineLogs([]);
      }
    };

    loadTimeline();

    return () => {
      active = false;
    };
  }, [followIds, user?.uid]);

  const filteredLogs = React.useMemo(() => {
    const base =
      filter === 'all'
        ? timelineLogs
        : timelineLogs.filter((log) => log.statusKey === (filter === 'reading' ? 'reading' : 'done'));
    return base;
  }, [timelineLogs, filter]);

  const renderLogMessage = (log: TimelineLog) => {
    if (log.action === 'add') {
      return (
        <Text variant="meta" className="text-foreground">
          <Text className="font-semibold">{log.title}</Text>
          を本棚に登録しました。
        </Text>
      );
    }
    if (log.action === 'remove') {
      return (
        <Text variant="meta" className="text-foreground">
          <Text className="font-semibold">{log.title}</Text>
          を本棚から「削除」しました。
        </Text>
      );
    }
    if (log.action === 'update') {
      return (
        <Text variant="meta" className="text-foreground">
          <Text className="font-semibold">{log.title}</Text>
          を「{log.statusLabel ?? log.status ?? '読書中'}」に変更しました。
        </Text>
      );
    }
    return (
      <Text variant="meta" className="text-foreground">
        {log.message}
      </Text>
    );
  };

  React.useEffect(() => {
    const normalized = userQuery.trim().toLowerCase();
    if (normalized.length < 2) {
      setUserResults([]);
      setUserLoading(false);
      return;
    }

    let active = true;
    setUserLoading(true);

    const handle = setTimeout(async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          orderBy('handle'),
          startAt(normalized),
          endAt(`${normalized}\uf8ff`),
          limit(3)
        );
        const snapshot = await getDocs(q);
        if (!active) return;
        const next = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as {
              handle?: string;
              displayName?: string;
              photoUrl?: string;
            };
            return {
              id: docSnap.id,
              handle: data.handle ?? '',
              displayName: data.displayName ?? 'ユーザー',
              photoUrl: data.photoUrl ?? undefined,
            } as UserSuggestion;
          })
          .filter((item) => item.handle.toLowerCase().includes(normalized))
          .filter((item) => item.id !== user?.uid)
          .slice(0, 3);
        setUserResults(next);
      } catch {
        if (!active) return;
        setUserResults([]);
      } finally {
        if (active) setUserLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [userQuery, user?.uid]);

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
                  <Text variant="section">フォロー中のログ</Text>
                  <Text variant="meta" className="mt-2">
                    フォローしているユーザーの読書ログが表示されます。
                  </Text>
                </View>
                <View className="items-end">
                  <Text variant="caption">表示数</Text>
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
                  <View className="flex-row items-center gap-2">
                    <View className="h-8 w-8 overflow-hidden rounded-full bg-muted items-center justify-center">
                      {item.userId && profileMap[item.userId]?.photoUrl ? (
                        <Image
                          source={{ uri: profileMap[item.userId]?.photoUrl }}
                          className="h-full w-full"
                        />
                      ) : (
                        <Text variant="caption" className="text-muted-foreground">
                          {item.userId
                            ? (profileMap[item.userId]?.displayName ?? 'S').slice(0, 1).toUpperCase()
                            : 'S'}
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text variant="caption" className="text-foreground">
                        {item.userId ? profileMap[item.userId]?.displayName ?? 'ユーザー' : 'ユーザー'}
                      </Text>
                    </View>
                  </View>
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
                {renderLogMessage(item)}
                <View className="flex-row items-center justify-between">
                  <Text variant="caption">{formatRelativeTime(item.createdAt)}</Text>
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
              <EmptyStateCard message="まだ表示できるログがありません。" />
            </View>
          }
        />
      </View>

      <Modal transparent visible={searchOpen} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-4">
          <View className="w-full max-w-md rounded-2xl bg-card p-6">
            <Text variant="section">ユーザー検索</Text>
            <Text variant="meta" className="mt-1">
              IDを2文字以上入力すると候補が表示されます。
            </Text>
            <View className="mt-4">
              <Input
                value={userQuery}
                onChangeText={setUserQuery}
                placeholder="ユーザーIDで検索"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {userLoading && (
              <Text className="mt-3 text-[12px] text-muted-foreground">検索中...</Text>
            )}
            {userResults.length > 0 && (
              <View className="mt-3 rounded border border-border bg-background">
                {userResults.map((item) => (
                  <View
                    key={item.id}
                    className="flex-row items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
                    <View className="h-9 w-9 overflow-hidden rounded-full bg-muted">
                      {item.photoUrl ? (
                        <Image source={{ uri: item.photoUrl }} className="h-full w-full" />
                      ) : null}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[13px] font-semibold text-foreground">
                        {item.displayName}
                      </Text>
                      <Text className="text-[12px] text-muted-foreground">@{item.handle}</Text>
                    </View>
                    <Button
                      size="sm"
                      variant={following[item.id] ? 'secondary' : 'default'}
                      onPress={() => toggleFollowDb(item.id, !following[item.id])}>
                      <Icon
                        as={UserPlusIcon}
                        size={14}
                        className={following[item.id] ? 'text-foreground' : 'text-white'}
                      />
                      <Text>{following[item.id] ? 'フォロー中' : 'フォロー'}</Text>
                    </Button>
                  </View>
                ))}
              </View>
            )}
            <View className="mt-5 flex-row justify-end gap-2">
              <Button variant="ghost" onPress={() => setSearchOpen(false)}>
                <Text>閉じる</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
