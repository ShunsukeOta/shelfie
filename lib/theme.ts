import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
 
export const THEME = {
  light: {
    background: 'hsl(0 0% 97.6%)', // #f9f9f9
    foreground: 'hsl(0 0% 13.3%)', // #222222
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(0 0% 13.3%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(0 0% 13.3%)',
    primary: 'hsl(0 0% 13.3%)',
    primaryForeground: 'hsl(0 0% 97.6%)',
    secondary: 'hsl(0 0% 94.5%)',
    secondaryForeground: 'hsl(0 0% 13.3%)',
    muted: 'hsl(0 0% 94.5%)',
    mutedForeground: 'hsl(0 0% 45.1%)',
    accent: 'hsl(0 0% 94.5%)',
    accentForeground: 'hsl(0 0% 13.3%)',
    destructive: 'hsl(0 84.2% 60.2%)',
    border: 'hsl(0 0% 89.8%)',
    input: 'hsl(0 0% 89.8%)',
    ring: 'hsl(0 0% 63%)',
    radius: '0.625rem',
    chart1: 'hsl(12 76% 61%)',
    chart2: 'hsl(173 58% 39%)',
    chart3: 'hsl(197 37% 24%)',
    chart4: 'hsl(43 74% 66%)',
    chart5: 'hsl(27 87% 67%)',
  },
  dark: {
    background: 'hsl(0 0% 13.3%)', // #222222
    foreground: 'hsl(0 0% 97.6%)', // #f9f9f9
    card: 'hsl(0 0% 13.3%)',
    cardForeground: 'hsl(0 0% 97.6%)',
    popover: 'hsl(0 0% 13.3%)',
    popoverForeground: 'hsl(0 0% 97.6%)',
    primary: 'hsl(0 0% 97.6%)',
    primaryForeground: 'hsl(0 0% 13.3%)',
    secondary: 'hsl(0 0% 18%)',
    secondaryForeground: 'hsl(0 0% 97.6%)',
    muted: 'hsl(0 0% 18%)',
    mutedForeground: 'hsl(0 0% 70%)',
    accent: 'hsl(0 0% 18%)',
    accentForeground: 'hsl(0 0% 97.6%)',
    destructive: 'hsl(0 70.9% 59.4%)',
    border: 'hsl(0 0% 14.9%)',
    input: 'hsl(0 0% 14.9%)',
    ring: 'hsl(300 0% 45%)',
    radius: '0.625rem',
    chart1: 'hsl(220 70% 50%)',
    chart2: 'hsl(160 60% 45%)',
    chart3: 'hsl(30 80% 55%)',
    chart4: 'hsl(280 65% 60%)',
    chart5: 'hsl(340 75% 55%)',
  },
};
 
export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
