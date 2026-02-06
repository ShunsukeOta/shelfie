import { BottomNav } from '@/components/bottom-nav';
import { Tabs } from 'expo-router';
import * as React from 'react';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomNav {...props} />}>
      <Tabs.Screen name="shelf" />
      <Tabs.Screen name="timeline" />
      <Tabs.Screen name="summary" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
