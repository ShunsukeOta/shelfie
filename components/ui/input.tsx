import { cn } from '@/lib/utils';
import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';

type InputProps = TextInputProps & {
  className?: string;
};

export function Input({ className, ...props }: InputProps) {
  return (
    <TextInput
      placeholderTextColor="#9a9a9a"
      className={cn(
        'h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground',
        className
      )}
      {...props}
    />
  );
}
