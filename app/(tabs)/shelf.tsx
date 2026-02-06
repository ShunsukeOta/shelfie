import { BookCard, EmptyStateCard } from '@/components/cards';
import { Chip } from '@/components/chips';
import { BottomSheet, ConfirmModal } from '@/components/overlays';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useLibrary } from '@/lib/library';
import { Stack } from 'expo-router';
import {
  FilterIcon,
  LayoutGridIcon,
  LayoutListIcon,
  SlidersHorizontalIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { FlatList, Image, TextInput, View, useWindowDimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';

const STATUS_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'unread', label: '未読' },
  { value: 'stack', label: '積読' },
  { value: 'reading', label: '読書中' },
  { value: 'done', label: '読了' },
] as const;

const SORT_OPTIONS = [
  { value: 'recent', label: '最終更新' },
  { value: 'title', label: 'タイトル' },
  { value: 'author', label: '著者' },
] as const;

type LayoutMode = 'grid-4' | 'grid-3' | 'list';

type EditForm = {
  title: string;
  author: string;
  statusKey: 'unread' | 'stack' | 'reading' | 'done';
  category: string;
  publisher: string;
  year: string;
  volume: string;
  tags: string;
  memo: string;
};

export default function ShelfScreen() {
  const { books, updateBook, removeBook } = useLibrary();
  const { width } = useWindowDimensions();
  const [layout, setLayout] = React.useState<LayoutMode>('grid-4');
  const [statusFilter, setStatusFilter] =
    React.useState<(typeof STATUS_OPTIONS)[number]['value']>('all');
  const [sortBy, setSortBy] = React.useState<(typeof SORT_OPTIONS)[number]['value']>('recent');
  const [activeBookId, setActiveBookId] = React.useState<string | null>(null);
  const [activeSheet, setActiveSheet] = React.useState<'status' | 'sort' | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState<EditForm>({
    title: '',
    author: '',
    statusKey: 'unread',
    category: '',
    publisher: '',
    year: '',
    volume: '',
    tags: '',
    memo: '',
  });

  const activeBook = React.useMemo(
    () => books.find((book) => book.id === activeBookId) ?? null,
    [books, activeBookId]
  );

  React.useEffect(() => {
    if (!activeBook) return;
    setIsEditing(false);
    setEditForm({
      title: activeBook.title ?? '',
      author: activeBook.author ?? '',
      statusKey: (activeBook.statusKey as EditForm['statusKey']) ?? 'unread',
      category: activeBook.category ?? '',
      publisher: activeBook.publisher ?? '',
      year: activeBook.year ?? '',
      volume: activeBook.volume ?? '',
      tags: activeBook.tags ?? '',
      memo: activeBook.memo ?? '',
    });
  }, [activeBook]);

  const filteredBooks = React.useMemo(() => {
    const base =
      statusFilter === 'all'
        ? books
        : books.filter((book) => book.statusKey === statusFilter);
    if (sortBy === 'recent') {
      return [...base].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    }
    if (sortBy === 'title') {
      return [...base].sort((a, b) => a.title.localeCompare(b.title));
    }
    return [...base].sort((a, b) => a.author.localeCompare(b.author));
  }, [books, statusFilter, sortBy]);

  const displayValue = (value?: string) =>
    value && value.trim().length > 0 ? value : '-';

  const toggleLayout = () => {
    setLayout((current) =>
      current === 'grid-3' ? 'grid-4' : current === 'grid-4' ? 'list' : 'grid-3'
    );
  };

  const handleSaveEdit = () => {
    if (!activeBook) return;
    updateBook(activeBook.id, {
      title: editForm.title,
      author: editForm.author,
      statusKey: editForm.statusKey,
      status:
        editForm.statusKey === 'unread'
          ? '未読'
          : editForm.statusKey === 'stack'
            ? '積読'
            : editForm.statusKey === 'reading'
              ? '読書中'
              : '読了',
      category: editForm.category,
      publisher: editForm.publisher,
      year: editForm.year,
      volume: editForm.volume,
      tags: editForm.tags,
      memo: editForm.memo,
    });
    setIsEditing(false);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <TopBar
          subtitle="本棚"
          rightSlot={
            <View className="flex-row items-center gap-2">
              <Button size="icon" variant="ghost" onPress={() => setActiveSheet('status')}>
                <Icon as={FilterIcon} size={18} className="text-foreground" />
              </Button>
              <Button size="icon" variant="ghost" onPress={() => setActiveSheet('sort')}>
                <Icon as={SlidersHorizontalIcon} size={18} className="text-foreground" />
              </Button>
              <Button size="icon" variant="ghost" onPress={toggleLayout}>
                <Icon
                  as={layout === 'list' ? LayoutGridIcon : LayoutListIcon}
                  size={18}
                  className="text-foreground"
                />
              </Button>
            </View>
          }
        />

        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 96 }}
          data={filteredBooks}
          key={layout}
          keyExtractor={(item) => item.id}
          numColumns={layout === 'list' ? 1 : layout === 'grid-4' ? 4 : 3}
          columnWrapperStyle={
            layout === 'list' ? undefined : { gap: layout === 'grid-4' ? 8 : 12 }
          }
          renderItem={({ item }) => (
            <BookCard
              title={item.title}
              author={item.author}
              status={item.status}
              statusKey={item.statusKey}
              imageUrl={item.imageUrl}
              fallbackCoverSvg={item.fallbackCoverSvg}
              layout={layout}
              containerStyle={
                layout === 'list'
                  ? undefined
                  : {
                      width:
                        (width -
                          32 -
                          (layout === 'grid-4' ? 3 : 2) * (layout === 'grid-4' ? 8 : 12)) /
                        (layout === 'grid-4' ? 4 : 3),
                    }
              }
              onPress={() => setActiveBookId(item.id)}
            />
          )}
          ListEmptyComponent={
            <EmptyStateCard message="まだ本棚に本が登録されていません。" />
          }
        />
      </View>

      <ConfirmModal open={!!activeBook} title="" description="" onClose={() => setActiveBookId(null)}>
        <View className="flex-row items-start gap-3">
          <View className="h-[96px] w-[72px] overflow-hidden border border-border bg-muted">
            {activeBook?.imageUrl ? (
              <Image
                source={{ uri: activeBook.imageUrl }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : activeBook?.fallbackCoverSvg ? (
              <SvgXml xml={activeBook.fallbackCoverSvg} width="100%" height="100%" />
            ) : null}
          </View>
          <View className="flex-1 gap-2">
            <View
              className={
                activeBook?.statusKey === 'unread'
                  ? 'self-start rounded-[2px] bg-[#8c8c8c] px-1.5 py-[1px]'
                  : activeBook?.statusKey === 'stack'
                    ? 'self-start rounded-[2px] bg-[#2f5fbf] px-1.5 py-[1px]'
                    : activeBook?.statusKey === 'reading'
                      ? 'self-start rounded-[2px] bg-[#c36a1e] px-1.5 py-[1px]'
                      : 'self-start rounded-[2px] bg-[#2f8a4a] px-1.5 py-[1px]'
              }>
              <Text className="text-[9px] text-white">{activeBook?.status}</Text>
            </View>
            <View className="gap-1">
              <Text variant="body" className="font-semibold text-foreground">
                {activeBook?.title ?? ''}
              </Text>
              <Text variant="meta">{activeBook?.author ?? ''}</Text>
            </View>
            <Text className="text-[12px] text-muted-foreground">
              最終更新: {activeBook?.updatedAt ?? '-'}
            </Text>
          </View>
        </View>
        <View className="mt-4">
          {isEditing ? (
            <View className="gap-3">
              <Input
                placeholder="タイトル"
                value={editForm.title}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, title: text }))}
              />
              <Input
                placeholder="著者"
                value={editForm.author}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, author: text }))}
              />
              <View className="flex-row gap-2">
                {[
                  { key: 'unread', label: '未読' },
                  { key: 'stack', label: '積読' },
                  { key: 'reading', label: '読書中' },
                  { key: 'done', label: '読了' },
                ].map((item) => (
                  <Chip
                    key={item.key}
                    label={item.label}
                    selected={editForm.statusKey === item.key}
                    size="sm"
                    onPress={() =>
                      setEditForm((prev) => ({ ...prev, statusKey: item.key as EditForm['statusKey'] }))
                    }
                  />
                ))}
              </View>
              <Input
                placeholder="カテゴリ"
                value={editForm.category}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, category: text }))}
              />
              <View className="flex-row gap-2">
                <Input
                  placeholder="出版社"
                  value={editForm.publisher}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, publisher: text }))}
                />
                <Input
                  placeholder="出版年"
                  value={editForm.year}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, year: text }))}
                />
              </View>
              <View className="flex-row gap-2">
                <Input
                  placeholder="巻数"
                  value={editForm.volume}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, volume: text }))}
                />
                <Input
                  placeholder="タグ"
                  value={editForm.tags}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, tags: text }))}
                />
              </View>
              <TextInput
                value={editForm.memo}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, memo: text }))}
                placeholder="メモ"
                placeholderTextColor="#9a9a9a"
                multiline
                className="min-h-[96px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <View className="flex-row justify-end gap-2">
                <Button variant="ghost" onPress={() => setIsEditing(false)}>
                  <Text>キャンセル</Text>
                </Button>
                <Button onPress={handleSaveEdit}>
                  <Text>保存</Text>
                </Button>
              </View>
            </View>
          ) : (
            <>
              {[
                { label: 'カテゴリ', value: activeBook?.category },
                { label: '出版社', value: activeBook?.publisher },
                { label: '出版年', value: activeBook?.year },
                { label: '巻数', value: activeBook?.volume },
                { label: 'タグ', value: activeBook?.tags },
                { label: 'メモ', value: activeBook?.memo },
              ].map((row, index, all) => (
                <View
                  key={row.label}
                  className={`flex-row items-center justify-between py-3 ${
                    index !== all.length - 1 ? 'border-b border-border' : ''
                  }`}>
                  <Text className="text-[12px] text-muted-foreground">{row.label}</Text>
                  <Text className="text-[12px] text-foreground">{displayValue(row.value)}</Text>
                </View>
              ))}
              <View className="mt-4 flex-row justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onPress={() => {
                    if (!activeBook) return;
                    removeBook(activeBook.id);
                    setActiveBookId(null);
                  }}>
                  <Text>削除</Text>
                </Button>
                <Button variant="secondary" size="sm" onPress={() => setIsEditing(true)}>
                  <Text>編集</Text>
                </Button>
              </View>
            </>
          )}
        </View>
      </ConfirmModal>

      <BottomSheet
        open={activeSheet === 'status'}
        title="ステータス"
        onClose={() => setActiveSheet(null)}>
        {STATUS_OPTIONS.map((option) => {
          const selected = option.value === statusFilter;
          return (
            <Chip
              key={option.value}
              label={option.label}
              selected={selected}
              size="lg"
              fullWidth
              onPress={() => {
                setStatusFilter(option.value);
                setActiveSheet(null);
              }}
            />
          );
        })}
      </BottomSheet>

      <BottomSheet open={activeSheet === 'sort'} title="並び替え" onClose={() => setActiveSheet(null)}>
        {SORT_OPTIONS.map((option) => {
          const selected = option.value === sortBy;
          return (
            <Chip
              key={option.value}
              label={option.label}
              selected={selected}
              size="lg"
              fullWidth
              onPress={() => {
                setSortBy(option.value);
                setActiveSheet(null);
              }}
            />
          );
        })}
      </BottomSheet>
    </>
  );
}
