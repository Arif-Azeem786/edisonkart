import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

const TABS = [
  { name: 'index', label: 'Home', icon: '🏠' },
  { name: 'shop', label: 'Shop', icon: '🔍' },
  { name: 'cart', label: 'Cart', icon: '🛒' },
  { name: 'account', label: 'Account', icon: '👤' },
];

function TabIcon({ icon, label, focused }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={tab.icon} label={tab.label} focused={focused} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 6,
    paddingTop: 6,
    boxShadow: '0 -1px 4px rgba(0,0,0,0.04)',
  },
  tabBarItem: {
    paddingTop: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -2,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F97316',
    marginTop: 3,
  },
});
