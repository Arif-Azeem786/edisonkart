import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';

const FEATURES = [
  { title: 'Best Prices', desc: 'Competitive pricing on all products with regular deals and discounts.', icon: '💰' },
  { title: 'Fast Delivery', desc: 'Quick and reliable delivery to your doorstep.', icon: '🚀' },
  { title: 'Secure Payments', desc: 'Multiple payment options with bank-grade security.', icon: '🔒' },
  { title: '24/7 Support', desc: 'Round-the-clock customer support for all your queries.', icon: '💬' },
];

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'About Us', headerShown: true, headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '800', fontSize: 18 } }} />

      <View style={styles.heroSection}>
        <Text style={styles.heroIcon}>🛒</Text>
        <Text style={styles.heroTitle}>EdisonKart</Text>
        <Text style={styles.heroSubtitle}>Your Premium Shopping Destination</Text>
      </View>

      <Text style={styles.paragraph}>
        EdisonKart is a modern e-commerce platform built to provide a seamless shopping experience.
        We connect buyers with quality products across a wide range of categories, ensuring
        convenience and satisfaction with every order.
      </Text>
      <Text style={styles.paragraph}>
        Founded with the vision of making online shopping accessible and enjoyable, EdisonKart
        combines cutting-edge technology with a customer-first approach to deliver an unmatched
        retail experience.
      </Text>

      <View style={styles.missionCard}>
        <Text style={styles.missionLabel}>OUR MISSION</Text>
        <Text style={styles.missionText}>
          To empower customers with a reliable, affordable, and delightful shopping experience while
          supporting sellers in reaching a broader audience through our platform.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Why Choose Us</Text>
      <View style={styles.featureGrid}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureCard}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  heroSection: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  paragraph: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 12,
  },
  missionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginTop: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  missionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F97316',
    letterSpacing: 1,
    marginBottom: 10,
  },
  missionText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 28,
    marginBottom: 16,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  featureCard: {
    width: '46%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: '2%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
  },
});
