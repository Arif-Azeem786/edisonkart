import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import useAuthStore from '../../src/store/authStore';

export default function AdminLayout() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !['ADMIN', 'EMPLOYEE', 'VENDOR'].includes(role)) {
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
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="products" options={{ title: 'Products' }} />
      <Stack.Screen name="categories" options={{ title: 'Categories' }} />
      <Stack.Screen name="orders" options={{ title: 'Orders' }} />
      <Stack.Screen name="users" options={{ title: 'Users' }} />
      <Stack.Screen name="contacts" options={{ title: 'Contact Messages' }} />
      <Stack.Screen name="banners" options={{ title: 'Banners' }} />
    </Stack>
  );
}
