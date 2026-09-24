import React from 'react';
import { Tabs } from 'expo-router';
import CustomTabBar from '../../components/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="agendamentos" options={{ title: 'Agendamentos' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="mais" options={{ title: 'Mais' }} />
    </Tabs>
  );
}
