import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import * as React from 'react';

type ChipProps = {
  label: string;
  selected?: boolean;
  variant?: 'filled' | 'outline';
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
};

export function Chip({
  label,
  selected,
  variant = 'filled',
  size = 'md',
  fullWidth = false,
  onPress,
}: ChipProps) {
  const isFilled = variant === 'filled';
  const base = isFilled
    ? selected
      ? 'bg-primary border-primary'
      : 'bg-secondary border-secondary'
    : selected
      ? 'bg-background border-foreground'
      : 'bg-background border-border';

  const textClass = isFilled
    ? selected
      ? 'text-[12px] text-primary-foreground'
      : 'text-[12px] text-muted-foreground'
    : selected
      ? 'text-[12px] text-foreground'
      : 'text-[12px] text-muted-foreground';

  const buttonSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default';
  const sizeClass =
    size === 'lg'
      ? 'px-5'
      : size === 'sm'
        ? 'px-3'
        : 'px-4';
  const layoutClass = fullWidth ? 'w-full justify-between' : '';
  const textSize =
    size === 'lg' ? 'text-[14px]' : size === 'sm' ? 'text-[12px]' : 'text-[13px]';

  return (
    <Button
      size={buttonSize}
      variant="ghost"
      onPress={onPress}
      className={`rounded border ${sizeClass} ${layoutClass} ${base}`}>
      <Text variant="body" className={`${textSize} ${textClass}`}>
        {label}
      </Text>
    </Button>
  );
}
