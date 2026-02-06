import { StatCard } from '@/components/cards';
import { Chip } from '@/components/chips';
import { TopBar } from '@/components/top-bar';
import { Text } from '@/components/ui/text';
import { useLibrary } from '@/lib/library';
import { Stack } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

type SeriesItem = { label: string; read: number; add: number };

const WEEKLY_BASE: SeriesItem[] = [
  { label: '月', read: 2, add: 1 },
  { label: '火', read: 1, add: 2 },
  { label: '水', read: 3, add: 1 },
  { label: '木', read: 2, add: 0 },
  { label: '金', read: 4, add: 2 },
  { label: '土', read: 1, add: 1 },
  { label: '日', read: 0, add: 1 },
];

const MONTHLY_BASE: SeriesItem[] = Array.from({ length: 14 }, (_, index) => ({
  label: `${index + 1}`,
  read: [1, 2, 1, 0, 3, 2, 1, 1, 2, 1, 3, 1, 2, 1][index],
  add: [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0][index],
}));

const YEARLY_BASE: SeriesItem[] = [
  { label: '1月', read: 12, add: 8 },
  { label: '2月', read: 9, add: 5 },
  { label: '3月', read: 14, add: 10 },
  { label: '4月', read: 6, add: 3 },
  { label: '5月', read: 11, add: 7 },
  { label: '6月', read: 8, add: 4 },
  { label: '7月', read: 10, add: 6 },
  { label: '8月', read: 13, add: 9 },
  { label: '9月', read: 7, add: 5 },
  { label: '10月', read: 12, add: 8 },
  { label: '11月', read: 9, add: 6 },
  { label: '12月', read: 15, add: 11 },
];

const RANGE_OPTIONS = [
  { key: 'week', label: '週' },
  { key: 'month', label: '月' },
  { key: 'year', label: '年' },
] as const;

type RangeKey = (typeof RANGE_OPTIONS)[number]['key'];

function ChartCard({ title, data }: { title: string; data: SeriesItem[] }) {
  const max = Math.max(...data.map((item) => item.read + item.add), 1);

  return (
    <View className="rounded border border-border bg-card p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="section">{title}</Text>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-full bg-emerald-500" />
            <Text variant="meta">読書</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-full bg-blue-500" />
            <Text variant="meta">追加</Text>
          </View>
        </View>
      </View>
      <View className="flex-row items-end gap-2">
        {data.map((item) => {
          const total = item.read + item.add;
          const height = Math.round((total / max) * 120);
          const readHeight = Math.round(height * (item.read / (total || 1)));
          const addHeight = height - readHeight;
          return (
            <View key={item.label} className="items-center">
              <View className="h-28 w-4 overflow-hidden rounded-md bg-muted">
                <View style={{ height: addHeight }} className="bg-blue-500" />
                <View style={{ height: readHeight }} className="bg-emerald-500" />
              </View>
              <Text variant="caption" className="mt-1">
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function SummaryScreen() {
  const { books } = useLibrary();
  const [range, setRange] = React.useState<RangeKey>('week');

  const scaleSeries = React.useCallback(
    (base: SeriesItem[], total: number) => {
      const baseTotal = base.reduce((sum, item) => sum + item.read + item.add, 0) || 1;
      const factor = total / baseTotal;
      return base.map((item) => ({
        label: item.label,
        read: Math.max(0, Math.round(item.read * factor)),
        add: Math.max(0, Math.round(item.add * factor)),
      }));
    },
    []
  );

  const weekly = React.useMemo(() => scaleSeries(WEEKLY_BASE, books.length), [
    books.length,
    scaleSeries,
  ]);
  const monthly = React.useMemo(
    () => scaleSeries(MONTHLY_BASE, books.length * 4),
    [books.length, scaleSeries]
  );
  const yearly = React.useMemo(
    () => scaleSeries(YEARLY_BASE, books.length * 12),
    [books.length, scaleSeries]
  );

  const counts = React.useMemo(() => {
    return books.reduce(
      (acc, book) => {
        acc[book.statusKey] += 1;
        return acc;
      },
      { done: 0, reading: 0, stack: 0, unread: 0 }
    );
  }, [books]);

  const activeSeries =
    range === 'week'
      ? { title: '1週間の読書と追加', data: weekly }
      : range === 'month'
        ? { title: '1か月の読書と追加', data: monthly }
        : { title: '1年の読書と追加', data: yearly };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <TopBar subtitle="まとめ" />
        <View className="px-4 pt-4">
          <View className="flex-row items-center gap-2">
            {RANGE_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                selected={range === option.key}
                size="md"
                onPress={() => setRange(option.key)}
              />
            ))}
          </View>
        </View>
        <View className="px-4 pt-5">
          <ChartCard title={activeSeries.title} data={activeSeries.data} />
        </View>
        <View className="px-4 pt-5">
          <View className="flex-row flex-wrap gap-4">
            {[
              { label: '合計', value: books.length },
              { label: '読了', value: counts.done },
              { label: '読書中', value: counts.reading },
              { label: '積読', value: counts.stack },
              { label: '未読', value: counts.unread },
            ].map((item) => (
              <View key={item.label} className="flex-1 min-w-[120px]">
                <StatCard label={item.label} value={item.value} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </>
  );
}
