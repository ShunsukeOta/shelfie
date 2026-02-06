import { useRegisterModal } from '@/components/register-modal-provider';
import { Icon } from '@/components/ui/icon';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BookOpenIcon, ChartLineIcon, PlusIcon, UserIcon, UsersIcon } from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ItemKey = 'shelf' | 'timeline' | 'summary' | 'me';

const ITEMS: { key: ItemKey; icon: React.ComponentType<any> }[] = [
  { key: 'shelf', icon: BookOpenIcon },
  { key: 'timeline', icon: UsersIcon },
  { key: 'summary', icon: ChartLineIcon },
  { key: 'me', icon: UserIcon },
];

export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { openRegister } = useRegisterModal();
  const indicatorX = useSharedValue(-1000);
  const indicatorOpacity = useSharedValue(0);
  const positions = React.useRef<Record<ItemKey, number>>({
    shelf: 0,
    timeline: 0,
    summary: 0,
    me: 0,
  });

  const isActive = (key: ItemKey) =>
    state.routes[state.index]?.name === key;

  React.useEffect(() => {
    const activeKey = state.routes[state.index]?.name as ItemKey | undefined;
    if (!activeKey) return;
    const nextX = positions.current[activeKey];
    if (Number.isFinite(nextX) && nextX > 0) {
      indicatorX.value = withSpring(nextX, { damping: 18, stiffness: 220, mass: 0.5 });
      indicatorOpacity.value = withTiming(1, { duration: 120 });
    }
  }, [state.index, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      className="absolute left-0 right-0 items-center"
      style={{ bottom: Math.max(10, insets.bottom + 4) }}>
      <View
        className="w-[min(86%,360px)]"
        style={{
          width: Platform.OS === 'ios' ? '90%' : undefined,
          marginLeft: Math.max(22, insets.left + 20),
          marginRight: Math.max(22, insets.right + 20),
        }}>
        <View className="relative flex-row items-center justify-between gap-3 rounded-full border border-black/5 bg-card/65 px-3 py-1 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
          <Animated.View
            pointerEvents="none"
            className="absolute h-[48px] w-[48px] rounded-full bg-border"
            style={indicatorStyle}
          />
          {ITEMS.slice(0, 2).map((item) => (
            <Pressable
              key={item.key}
              onPress={() => navigation.navigate(item.key as never)}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                positions.current[item.key] = x + width / 2 - 24;
                if (isActive(item.key)) {
                  indicatorX.value = withSpring(x + width / 2 - 24, {
                    damping: 18,
                    stiffness: 220,
                    mass: 0.5,
                  });
                  indicatorOpacity.value = 1;
                }
              }}
              className="flex-1 items-center justify-center py-2">
              <View className="h-[48px] w-[48px] items-center justify-center rounded-full">
                <Icon
                  as={item.icon}
                  size={20}
                  className={isActive(item.key) ? 'text-foreground' : 'text-foreground'}
                />
              </View>
            </Pressable>
          ))}
          <Pressable
            onPress={openRegister}
            className="h-[48px] w-[48px] items-center justify-center rounded-full bg-foreground shadow-[0_14px_26px_rgba(0,0,0,0.22)]">
            <Icon as={PlusIcon} size={22} className="text-background" />
          </Pressable>
          {ITEMS.slice(2).map((item) => (
            <Pressable
              key={item.key}
              onPress={() => navigation.navigate(item.key as never)}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                positions.current[item.key] = x + width / 2 - 24;
                if (isActive(item.key)) {
                  indicatorX.value = withSpring(x + width / 2 - 24, {
                    damping: 18,
                    stiffness: 220,
                    mass: 0.5,
                  });
                  indicatorOpacity.value = 1;
                }
              }}
              className="flex-1 items-center justify-center py-2">
              <View className="h-[48px] w-[48px] items-center justify-center rounded-full">
                <Icon
                  as={item.icon}
                  size={20}
                  className={isActive(item.key) ? 'text-foreground' : 'text-foreground'}
                />
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
