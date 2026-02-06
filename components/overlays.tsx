import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { XIcon } from 'lucide-react-native';

type BottomSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  return (
    <Modal transparent visible={open} animationType="fade">
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="rounded-t-2xl bg-card px-4 pb-12 pt-5 shadow-[0_-10px_30px_rgba(0,0,0,0.18)]">
          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="section" className="text-foreground">
                {title}
              </Text>
              <Text variant="label" className="mt-1">
                選択してください
              </Text>
            </View>
            <Button size="icon" variant="ghost" onPress={onClose}>
              <Icon as={XIcon} size={18} className="text-foreground" />
            </Button>
          </View>
          <View className="mt-4 gap-3">{children}</View>
        </View>
      </View>
    </Modal>
  );
}

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showCloseIcon?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
  children?: React.ReactNode;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'OK',
  showCloseIcon = true,
  cancelLabel = 'キャンセル',
  onConfirm,
  onClose,
  children,
}: ConfirmModalProps) {
  const hasHeader = title.length > 0 || (description ? description.length > 0 : false);
  return (
    <Modal transparent visible={open} animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/40 px-4">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="w-full max-w-md rounded-2xl bg-card p-5 shadow-[0_18px_48px_rgba(0,0,0,0.2)]">
          {showCloseIcon && !hasHeader && (
            <View className="absolute right-3 top-3">
              <Button size="icon" variant="ghost" onPress={onClose}>
                <Icon as={XIcon} size={18} className="text-foreground" />
              </Button>
            </View>
          )}
          {hasHeader && (
            <>
              <View className="flex-row items-center justify-between">
                <Text variant="section" className="text-foreground">
                  {title}
                </Text>
                <Button size="icon" variant="ghost" onPress={onClose}>
                  <Icon as={XIcon} size={18} className="text-foreground" />
                </Button>
              </View>
              {description && (
                <Text variant="meta" className="mt-2">
                  {description}
                </Text>
              )}
            </>
          )}
          {children && <View className="mt-4">{children}</View>}
          <View className="mt-5 flex-row justify-end gap-2">
            {onConfirm && (
              <Button onPress={onConfirm}>
                <Text>{confirmLabel}</Text>
              </Button>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}


