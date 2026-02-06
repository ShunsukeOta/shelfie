import { Text } from '@/components/ui/text';
import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TopBarProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  showBrand?: boolean;
};

export function TopBar({
  title,
  subtitle,
  rightSlot,
  showBrand = true,
}: TopBarProps) {
  const subtitleClass = 'text-muted-foreground';
  const brandBarClass = 'bg-foreground';

  return (
    <SafeAreaView edges={['top']} className="border-b border-border bg-background">
      <View className="flex-row items-center justify-between px-4 py-3.5 min-h-[56px]">
        <View className="flex-row items-center gap-2">
          {showBrand && (
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-[3px]">
                <View className={`h-[18px] w-[2px] rounded-sm ${brandBarClass}`} />
                <View className={`h-[18px] w-[2px] rounded-sm ${brandBarClass}`} />
                <View className={`h-[18px] w-[2px] rounded-sm ${brandBarClass}`} />
              </View>
              <Text variant="title">Shelfie</Text>
            </View>
          )}
          {(subtitle ?? title) && (
            <Text variant="meta" className={subtitleClass}>
              {subtitle ?? title}
            </Text>
          )}
        </View>
        <View className="min-w-[40px] items-end">{rightSlot}</View>
      </View>
    </SafeAreaView>
  );
}
