import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Image, Pressable, View, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

type SurfaceCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function SurfaceCard({ children, className }: SurfaceCardProps) {
  return (
    <View className={`rounded border border-border bg-card ${className ?? ''}`}>{children}</View>
  );
}

type EmptyStateCardProps = {
  message: string;
  className?: string;
};

export function EmptyStateCard({ message, className }: EmptyStateCardProps) {
  return (
    <SurfaceCard className={`px-4 py-14 ${className ?? ''}`}>
      <Text variant="meta" className="text-center">
        {message}
      </Text>
    </SurfaceCard>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <SurfaceCard className="px-4 py-3.5">
      <Text variant="label">{label}</Text>
      <Text variant="title" className="text-[18px]">
        {value}
      </Text>
    </SurfaceCard>
  );
}

type BookCardProps = {
  title: string;
  author: string;
  status: string;
  statusKey: 'unread' | 'stack' | 'reading' | 'done';
  imageUrl?: string;
  fallbackCoverSvg?: string;
  layout: 'grid-4' | 'grid-3' | 'list';
  onPress: () => void;
  containerStyle?: ViewStyle;
};

export function BookCard({
  title,
  author,
  status,
  statusKey,
  imageUrl,
  fallbackCoverSvg,
  layout,
  onPress,
  containerStyle,
}: BookCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={containerStyle}
      className={
        layout === 'list'
          ? 'mb-3 flex-row items-center gap-3 border-b border-border bg-transparent py-2'
          : 'mb-3 rounded border border-border bg-card'
      }>
      <View
        className={
          layout === 'list'
            ? 'relative h-16 w-12 bg-muted'
            : 'relative aspect-[3/4] w-full bg-muted'
        }
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            className="absolute inset-0 h-full w-full"
            resizeMode="cover"
          />
        ) : fallbackCoverSvg ? (
          <SvgXml xml={fallbackCoverSvg} width="100%" height="100%" />
        ) : null}
        {layout === 'grid-3' && (
          <View
            className={
              statusKey === 'unread'
                ? 'absolute left-1 top-1 rounded-[2px] bg-[#8c8c8c] px-1.5 py-[1px]'
                : statusKey === 'stack'
                  ? 'absolute left-1 top-1 rounded-[2px] bg-[#2f5fbf] px-1.5 py-[1px]'
                  : statusKey === 'reading'
                    ? 'absolute left-1 top-1 rounded-[2px] bg-[#c36a1e] px-1.5 py-[1px]'
                    : 'absolute left-1 top-1 rounded-[2px] bg-[#2f8a4a] px-1.5 py-[1px]'
            }>
            <Text className="text-[9px] text-white">{status}</Text>
          </View>
        )}
        {layout === 'grid-4' && (
          <View
            className={
              statusKey === 'unread'
                ? 'absolute left-1 top-1 h-2 w-2 rounded-full bg-muted-foreground'
                : statusKey === 'stack'
                  ? 'absolute left-1 top-1 h-2 w-2 rounded-full bg-blue-500'
                  : statusKey === 'reading'
                    ? 'absolute left-1 top-1 h-2 w-2 rounded-full bg-amber-500'
                    : 'absolute left-1 top-1 h-2 w-2 rounded-full bg-emerald-500'
            }
          />
        )}
      </View>
      {layout !== 'grid-4' && (
        <View className={layout === 'list' ? 'flex-1' : 'px-3 py-2'}>
          {layout === 'list' && (
            <View
              className={
                statusKey === 'unread'
                  ? 'mb-1 self-start rounded-[2px] bg-[#8c8c8c] px-1.5 py-[1px]'
                  : statusKey === 'stack'
                    ? 'mb-1 self-start rounded-[2px] bg-[#2f5fbf] px-1.5 py-[1px]'
                    : statusKey === 'reading'
                      ? 'mb-1 self-start rounded-[2px] bg-[#c36a1e] px-1.5 py-[1px]'
                      : 'mb-1 self-start rounded-[2px] bg-[#2f8a4a] px-1.5 py-[1px]'
              }>
              <Text variant="caption" className="text-white">
                {status}
              </Text>
            </View>
          )}
          <View className="flex-row items-center justify-between">
            <Text
              variant="body"
              className={layout === 'grid-4' ? 'text-[12px] font-semibold' : 'font-semibold'}>
              {title}
            </Text>
          </View>
          <Text variant="meta" className="text-[11px]">
            {author}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
