import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../../src/store/authStore';

const MENU_SECTIONS = [
  {
    title: 'My Account',
    items: [
      { icon: '📦', label: 'My Orders', route: '/orders' },
      { icon: '🔔', label: 'Notifications', route: '/notifications' },
      { icon: '📍', label: 'Profile & Addresses', route: '/profile' },
      { icon: '❤️', label: 'Wishlist', route: '/wishlist' },
      { icon: '🎁', label: 'Rewards & Referrals', route: '/loyalty' },
      { icon: '🔗', label: 'Import Product', route: '/import-product' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: '💬', label: 'Support Chat', route: '/chat' },
      { icon: '❓', label: 'FAQ', route: '/faq' },
      { icon: '📞', label: 'Contact Us', route: '/contact' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { icon: 'ℹ️', label: 'About EdisonKart', route: '/about' },
      { icon: '📄', label: 'Terms & Conditions', route: '/terms' },
      { icon: '🔒', label: 'Privacy Policy', route: '/privacy' },
    ],
  },
];

function getRoleBadge(role) {
  if (role === 'ADMIN') return { label: 'Admin', bg: '#FEF2F2', color: '#dc2626' };
  if (role === 'EMPLOYEE') return { label: 'Employee', bg: '#F0FDF4', color: '#16a34a' };
  if (role === 'VENDOR') return { label: 'Vendor', bg: '#FFF7ED', color: '#F97316' };
  if (role === 'DELIVERY') return { label: 'Delivery', bg: '#EFF6FF', color: '#2563EB' };
  return null;
}

export default function AccountScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);

  if (!isAuthenticated) {
    return (
      <View style={styles.unauthContainer}>
        <View style={styles.unauthContent}>
          <View style={styles.brandCircle}>
            <Text style={styles.brandIcon}>🛒</Text>
          </View>
          <Text style={styles.brandName}>EdisonKart</Text>
          <Text style={styles.welcomeTitle}>Welcome to EdisonKart</Text>
          <Text style={styles.welcomeSubtext}>
            Sign in to access your orders, wishlist, and exclusive deals.
          </Text>

          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createAccountBtn}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.createAccountBtnText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/forgot-password')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isAdminLike = role === 'ADMIN' || role === 'EMPLOYEE' || role === 'VENDOR';
  const isDelivery = role === 'DELIVERY';
  const badge = getRoleBadge(role);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Custom Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenHeaderTitle}>Account</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || user?.email || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          {badge && (
            <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.roleBadgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Role-based Panels */}
      {(isAdminLike || isDelivery) && (
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Panels</Text>
          <View style={styles.menuGroup}>
            {isAdminLike && (
              <MenuItem
                icon="⚙️"
                label="Admin Panel"
                onPress={() => router.push('/(admin)')}
                accent
              />
            )}
            {isDelivery && (
              <MenuItem
                icon="🚚"
                label="Delivery Panel"
                onPress={() => router.push('/(delivery)')}
                accent
              />
            )}
          </View>
        </View>
      )}

      {/* Menu Sections */}
      {MENU_SECTIONS.map((section) => (
        <View key={section.title} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{section.title}</Text>
          <View style={styles.menuGroup}>
            {section.items.map((item, i) => (
              <MenuItem
                key={item.route}
                icon={item.icon}
                label={item.label}
                onPress={() => router.push(item.route)}
                isLast={i === section.items.length - 1}
              />
            ))}
          </View>
        </View>
      ))}

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => {
          logout();
          router.replace('/(tabs)');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress, accent, isLast }) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuItemIcon}>{icon}</Text>
        <Text style={[styles.menuItemLabel, accent && styles.menuItemLabelAccent]}>
          {label}
        </Text>
      </View>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  screenHeader: {
    backgroundColor: '#ffffff',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  screenHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },

  unauthContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  unauthContent: {
    width: '100%',
    alignItems: 'center',
  },
  brandCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandIcon: {
    fontSize: 36,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 1,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  signInBtn: {
    width: '100%',
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  createAccountBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F97316',
    marginBottom: 16,
  },
  createAccountBtnText: {
    color: '#F97316',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotBtn: {
    paddingVertical: 8,
  },
  forgotText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },

  profileCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 24,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  menuItemLabelAccent: {
    color: '#F97316',
    fontWeight: '600',
  },
  menuChevron: {
    fontSize: 22,
    color: '#94a3b8',
    fontWeight: '300',
  },

  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  logoutIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
});
