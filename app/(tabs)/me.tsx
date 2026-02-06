import { EmptyStateCard, SurfaceCard } from '@/components/cards';
import { ConfirmModal } from '@/components/overlays';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import { useLibrary } from '@/lib/library';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { Stack } from 'expo-router';
import { Image as ImageIcon, LogOutIcon, PencilIcon, SettingsIcon, XIcon } from 'lucide-react-native';
import * as React from 'react';
import { Image, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SvgXml } from 'react-native-svg';

const HANDLE_MIN = 4;
const HANDLE_MAX = 16;
const NAME_MAX = 40;
const PROFILE_MAX = 200;
const HANDLE_REGEX = /^[A-Za-z0-9_]+$/;

const sanitizeHandle = (value: string) =>
  value.replace(/[^A-Za-z0-9_]/g, '').slice(0, HANDLE_MAX);

type PickTarget = 'profile' | 'header';
type FollowTab = 'following' | 'followers';
type FollowUser = {
  id: string;
  displayName: string;
  handle: string;
  profileText: string;
  photoUrl?: string;
};

export default function MeScreen() {
  const { logs, books } = useLibrary();
  const { signOut, user } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [displayName, setDisplayName] = React.useState('shelfie user');
  const [savedDisplayName, setSavedDisplayName] = React.useState('shelfie user');
  const [handle, setHandle] = React.useState('');
  const [savedHandle, setSavedHandle] = React.useState('');
  const [handleLocked, setHandleLocked] = React.useState(false);
  const [profileText, setProfileText] = React.useState('');
  const [savedProfileText, setSavedProfileText] = React.useState('');
  const [photoUrl, setPhotoUrl] = React.useState('');
  const [savedPhotoUrl, setSavedPhotoUrl] = React.useState('');
  const [headerUrl, setHeaderUrl] = React.useState('');
  const [savedHeaderUrl, setSavedHeaderUrl] = React.useState('');
  const [saveToast, setSaveToast] = React.useState(false);
  const [profileLoaded, setProfileLoaded] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [followingCount, setFollowingCount] = React.useState(0);
  const [followerCount, setFollowerCount] = React.useState(0);
  const [followModalOpen, setFollowModalOpen] = React.useState(false);
  const [followTab, setFollowTab] = React.useState<FollowTab>('following');
  const [followLoading, setFollowLoading] = React.useState(false);
  const [followUsers, setFollowUsers] = React.useState<FollowUser[]>([]);
  const [followingIds, setFollowingIds] = React.useState<Record<string, boolean>>({});
  const [logoutConfirmOpen, setLogoutConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    let active = true;
    setProfileLoaded(false);

    const fallbackName =
      user.displayName?.trim() || user.email?.split('@')[0] || 'shelfie user';
    const fallbackPhoto = user.photoURL ?? '';

    const loadProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!active) return;

        if (snap.exists()) {
          const data = snap.data();
          const nextDisplayName =
            typeof data.displayName === 'string' && data.displayName.trim().length > 0
              ? data.displayName
              : fallbackName;
          const nextProfileText =
            typeof data.profileText === 'string' ? data.profileText : '';
          const nextHandle = typeof data.handle === 'string' ? data.handle : '';
          const nextPhoto =
            typeof data.photoUrl === 'string' && data.photoUrl.trim().length > 0
              ? data.photoUrl
              : fallbackPhoto;
          const nextHeader =
            typeof data.headerUrl === 'string' ? data.headerUrl : '';


          setDisplayName(nextDisplayName);
          setSavedDisplayName(nextDisplayName);
          setProfileText(nextProfileText);
          setSavedProfileText(nextProfileText);
          setHandle(nextHandle);
          setSavedHandle(nextHandle);
          setHandleLocked(nextHandle.length > 0);
          setPhotoUrl(nextPhoto);
          setSavedPhotoUrl(nextPhoto);
          setHeaderUrl(nextHeader);
          setSavedHeaderUrl(nextHeader);
        } else {
          setDisplayName(fallbackName);
          setSavedDisplayName(fallbackName);
          setProfileText('');
          setSavedProfileText('');
          setHandle('');
          setSavedHandle('');
          setHandleLocked(false);
          setPhotoUrl(fallbackPhoto);
          setSavedPhotoUrl(fallbackPhoto);
          setHeaderUrl('');
          setSavedHeaderUrl('');
        }
      } finally {
        if (active) setProfileLoaded(true);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user?.uid]);

  React.useEffect(() => {
    if (!saveToast) return;
    const timer = setTimeout(() => setSaveToast(false), 2000);
    return () => clearTimeout(timer);
  }, [saveToast]);

  const handleInitial = (
    handle.trim().slice(0, 1) ||
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
  const shelfCount = books.length;

  const pickImage = async (target: PickTarget) => {
    setSaveError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSaveError('写真へのアクセスを許可してください。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: target === 'profile' ? [1, 1] : [3, 1],
      quality: 0.85,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    if (target === 'profile') {
      setPhotoUrl(asset.uri);
    } else {
      setHeaderUrl(asset.uri);
    }

    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaveError('');

    const nextDisplayName = displayName.trim() || 'shelfie user';
    const nextProfileText = profileText.trim();
    const nextHandle = handleLocked ? savedHandle : handle.trim();

    if (nextDisplayName.length > NAME_MAX) {
      setSaveError('名前は40文字以内で入力してください。');
      return;
    }

    if (nextProfileText.length > PROFILE_MAX) {
      setSaveError('プロフィール文は200文字以内で入力してください。');
      return;
    }

    if (!nextHandle || nextHandle.length < HANDLE_MIN || nextHandle.length > HANDLE_MAX) {
      setSaveError('IDは4〜16文字で入力してください。');
      return;
    }

    if (!HANDLE_REGEX.test(nextHandle)) {
      setSaveError('IDは半角英数字とアンダーバーのみ使用できます。');
      return;
    }

    setSaving(true);

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          displayName: nextDisplayName,
          profileText: nextProfileText,
          handle: nextHandle,
          photoUrl: photoUrl.trim(),
          headerUrl: headerUrl.trim(),
          email: user.email ?? '',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setDisplayName(nextDisplayName);
      setSavedDisplayName(nextDisplayName);
      setProfileText(nextProfileText);
      setSavedProfileText(nextProfileText);
      setHandle(nextHandle);
      setSavedHandle(nextHandle);
      setHandleLocked(true);
      setSavedPhotoUrl(photoUrl.trim());
      setSavedHeaderUrl(headerUrl.trim());
      setIsEditing(false);
      setSaveToast(true);
    } catch {
      setSaveError('保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    if (!user) return;
    const followingRef = collection(db, 'users', user.uid, 'following');
    const followersRef = collection(db, 'users', user.uid, 'followers');

    const unsubFollowing = onSnapshot(followingRef, (snapshot) => {
      setFollowingCount(snapshot.size);
      const next: Record<string, boolean> = {};
      snapshot.docs.forEach((docSnap) => {
        next[docSnap.id] = true;
      });
      setFollowingIds(next);
    });

    const unsubFollowers = onSnapshot(followersRef, (snapshot) => {
      setFollowerCount(snapshot.size);
    });

    return () => {
      unsubFollowing();
      unsubFollowers();
    };
  }, [user?.uid]);

  React.useEffect(() => {
    if (!user || !followModalOpen) return;
    let active = true;
    setFollowLoading(true);

    const loadFollowUsers = async () => {
      try {
        const listRef = collection(db, 'users', user.uid, followTab);
        const snapshot = await getDocs(listRef);
        const ids = snapshot.docs.map((docSnap) => docSnap.id);
        if (!active) return;

        if (ids.length === 0) {
          setFollowUsers([]);
          return;
        }

        const docs = await Promise.all(
          ids.map((id) => getDoc(doc(db, 'users', id)))
        );

        if (!active) return;

        const next = ids
          .map((id, index) => {
            const docSnap = docs[index];
            if (!docSnap.exists()) return null;
            const data = docSnap.data() as {
              displayName?: string;
              handle?: string;
              profileText?: string;
              photoUrl?: string;
            };
            return {
              id,
              displayName: data.displayName ?? 'ユーザー',
              handle: data.handle ?? '',
              profileText: data.profileText ?? '',
              photoUrl: data.photoUrl ?? undefined,
            } as FollowUser;
          })
          .filter((item): item is FollowUser => item !== null);
        setFollowUsers(next);
      } finally {
        if (active) setFollowLoading(false);
      }
    };

    loadFollowUsers();

    return () => {
      active = false;
    };
  }, [followModalOpen, followTab, user?.uid]);

  const toggleFollow = async (targetId: string, shouldFollow: boolean) => {
    if (!user || targetId === user.uid) return;
    setFollowingIds((current) => ({ ...current, [targetId]: shouldFollow }));
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
                  setLogoutConfirmOpen(true);
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
              <View className="relative h-28 overflow-hidden">
                {headerUrl ? (
                  <Image source={{ uri: headerUrl }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <View className="h-full w-full bg-[linear-gradient(135deg,#1f1f1f,#3a3a3a)]" />
                )}
                {isEditing ? (
                  <Pressable
                    onPress={() => pickImage('header')}
                    className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                    <Icon as={ImageIcon} size={18} className="text-white" />
                  </Pressable>
                ) : null}
              </View>
              <View className="relative px-4 pb-4">
                <View className="-mt-10 flex-row items-start justify-between">
                  <View className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white bg-muted">
                    {photoUrl ? (
                      <Image source={{ uri: photoUrl }} className="h-full w-full" resizeMode="cover" />
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <Text variant="title" className="text-muted-foreground">
                          {handleInitial}
                        </Text>
                      </View>
                    )}
                    {isEditing ? (
                      <Pressable
                        onPress={() => pickImage('profile')}
                        className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                        <Icon as={ImageIcon} size={16} className="text-white" />
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                <View className="mt-3">
                  {!isEditing ? (
                    <View className="flex-row items-center gap-2">
                      <Text variant="title" className="text-foreground">
                        {displayName}
                      </Text>
                      <View className="rounded-full bg-muted px-2 py-0.5">
                        <Text variant="caption" className="text-muted-foreground">
                          @{handle || '未設定'}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  {!isEditing ? (
                    <Text variant="meta" className="mt-2 text-foreground">
                      {profileLoaded
                        ? profileText || 'プロフィールがまだ設定されていません。'
                        : '読み込み中...'}
                    </Text>
                  ) : null}
                </View>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-3"
                  onPress={() => setIsEditing((prev) => !prev)}>
                  <Icon as={PencilIcon} size={20} className="text-foreground" />
                </Button>

                {isEditing ? (
                  <View className="mt-5 gap-3">
                    <View className="gap-2">
                      <Input
                        placeholder="表示名（40文字まで）"
                        value={displayName}
                        onChangeText={(value) => setDisplayName(value.slice(0, NAME_MAX))}
                      />
                      <Text className="text-[12px] text-muted-foreground">
                        {displayName.length}/{NAME_MAX}
                      </Text>
                    </View>
                    <View className="gap-2">
                      <TextInput
                        value={profileText}
                        onChangeText={(value) => setProfileText(value.slice(0, PROFILE_MAX))}
                        placeholder="プロフィール（200文字まで）"
                        placeholderTextColor="#9a9a9a"
                        multiline
                        className="min-h-[96px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      />
                      <Text className="text-[12px] text-muted-foreground">
                        {profileText.length}/{PROFILE_MAX}
                      </Text>
                    </View>
                    <View className="mt-2 flex-row justify-end gap-2">
                      <Button
                        variant="ghost"
                        onPress={() => {
                          setDisplayName(savedDisplayName);
                          setProfileText(savedProfileText);
                          setHandle(savedHandle);
                          setPhotoUrl(savedPhotoUrl);
                          setHeaderUrl(savedHeaderUrl);
                          setIsEditing(false);
                          setSaveError('');
                        }}>
                        <Text>キャンセル</Text>
                      </Button>
                      <Button onPress={handleSaveProfile} disabled={saving}>
                        <Text>{saving ? '保存中...' : '保存'}</Text>
                      </Button>
                    </View>
                    {saveError ? (
                      <Text className="text-[12px] text-destructive">{saveError}</Text>
                    ) : null}
                  </View>
                ) : null}

                <View className="mt-6 flex-row gap-3">
                  {[
                    { label: 'フォロー', value: followingCount },
                    { label: 'フォロワー', value: followerCount },
                    { label: '総Shelf', value: shelfCount },
                  ].map((item) => (
                    <Pressable
                      key={item.label}
                      onPress={() => {
                        if (item.label === '総Shelf') return;
                        setFollowTab(item.label === 'フォロー' ? 'following' : 'followers');
                        setFollowModalOpen(true);
                      }}
                      className="flex-1">
                      <SurfaceCard className="items-center rounded-xl border border-border bg-background/60 py-2">
                        <Text variant="section" className="text-foreground">
                          {item.value}
                        </Text>
                        <Text variant="caption" className="text-muted-foreground">
                          {item.label}
                        </Text>
                      </SurfaceCard>
                    </Pressable>
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

      <ConfirmModal
        open={logoutConfirmOpen}
        title="ログアウトしますか？"
        description="現在のアカウントからログアウトします。"
        onClose={() => setLogoutConfirmOpen(false)}
        showCloseIcon>
        <View className="px-4 pb-4 pt-4">
          <View className="flex-row justify-end gap-2">
            <Button variant="ghost" className="px-4" onPress={() => setLogoutConfirmOpen(false)}>
              <Text>キャンセル</Text>
            </Button>
            <Button
              variant="destructive"
              className="px-4"
              onPress={() => {
                setLogoutConfirmOpen(false);
                signOut().catch(() => undefined);
              }}>
              <Text>ログアウト</Text>
            </Button>
          </View>
        </View>
      </ConfirmModal>

      <Modal transparent visible={followModalOpen} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-4">
          <View className="w-full max-w-md h-[520px] items-stretch rounded-2xl bg-card p-5">
            <View className="flex-row items-center justify-between">
              <Text variant="section">
                {followTab === 'following' ? 'フォロー' : 'フォロワー'}
              </Text>
              <Button size="icon" variant="ghost" onPress={() => setFollowModalOpen(false)}>
                <Icon as={XIcon} size={18} className="text-foreground" />
              </Button>
            </View>
            <View className="mt-3 flex-row gap-2">
              <Button
                size="sm"
                variant={followTab === 'following' ? 'default' : 'secondary'}
                onPress={() => setFollowTab('following')}>
                <Text>フォロー</Text>
              </Button>
              <Button
                size="sm"
                variant={followTab === 'followers' ? 'default' : 'secondary'}
                onPress={() => setFollowTab('followers')}>
                <Text>フォロワー</Text>
              </Button>
            </View>
            <View className="mt-4">
              {followLoading ? (
                <Text className="text-[12px] text-muted-foreground">読み込み中...</Text>
              ) : followUsers.length === 0 ? (
                <EmptyStateCard message="まだユーザーがいません。" />
              ) : (
                <ScrollView className="max-h-[360px]">
                  {followUsers.map((item) => {
                    const isFollowing = !!followingIds[item.id];
                    const initial =
                      item.displayName?.trim().slice(0, 1) ||
                      item.handle?.trim().slice(0, 1) ||
                      'S';
                    return (
                      <View
                        key={item.id}
                        className="flex-row items-start gap-3 border-b border-border py-3 last:border-b-0">
                        <View className="h-10 w-10 overflow-hidden rounded-full bg-muted items-center justify-center">
                          {item.photoUrl ? (
                            <Image source={{ uri: item.photoUrl }} className="h-full w-full" />
                          ) : (
                            <Text variant="caption" className="text-muted-foreground">
                              {initial.toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-[14px] font-semibold text-foreground">
                            {item.displayName}
                          </Text>
                          <Text className="text-[12px] text-muted-foreground">
                            @{item.handle || '未設定'}
                          </Text>
                          <Text
                            numberOfLines={2}
                            className="mt-1 text-[12px] text-foreground">
                            {item.profileText || 'プロフィールがまだ設定されていません。'}
                          </Text>
                        </View>
                        {item.id !== user?.uid ? (
                          <Button
                            size="sm"
                            variant={isFollowing ? 'secondary' : 'default'}
                            onPress={() => toggleFollow(item.id, !isFollowing)}>
                            <Text>{isFollowing ? 'フォロー中' : 'フォロー'}</Text>
                          </Button>
                        ) : null}
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
