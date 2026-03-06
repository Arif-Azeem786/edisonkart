import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import useAuthStore from '../../src/store/authStore';

export default function DeliveryLayout() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || role !== 'DELIVERY') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, role]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18, letterSpacing: 0.3 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Delivery Dashboard' }} />
      <Stack.Screen name="orders" options={{ title: 'Assigned Orders' }} />
      <Stack.Screen name="completed" options={{ title: 'Completed Deliveries' }} />
    </Stack>
  );
}
