import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing and using EdisonKart, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.',
  },
  {
    title: '2. User Accounts',
    body: 'You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.',
  },
  {
    title: '3. Orders and Payments',
    body: 'All orders are subject to product availability. Prices are displayed in Indian Rupees and include applicable taxes unless stated otherwise. Payment must be completed before order processing begins.',
  },
  {
    title: '4. Shipping and Delivery',
    body: 'We strive to deliver orders within the estimated timeframes. Delivery times may vary based on location and product availability. Shipping charges, if applicable, will be displayed at checkout.',
  },
  {
    title: '5. Returns and Refunds',
    body: 'Eligible products may be returned within 7 days of delivery. Items must be unused and in original packaging. Refunds are processed to the original payment method within 5-7 business days after the return is approved.',
  },
  {
    title: '6. Prohibited Conduct',
    body: 'Users must not misuse the platform, attempt to gain unauthorized access, submit false information, or engage in fraudulent activities. Violation may result in account termination.',
  },
  {
    title: '7. Intellectual Property',
    body: 'All content on EdisonKart, including logos, text, images, and software, is the property of EdisonKart and is protected by intellectual property laws. Unauthorized use is prohibited.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'EdisonKart shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform. Our total liability is limited to the amount paid for the relevant order.',
  },
  {
    title: '9. Changes to Terms',
    body: 'We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.',
  },
];

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Terms of Service', headerShown: true, headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '800', fontSize: 18 } }} />

      <View style={styles.headerSection}>
        <Text style={styles.headerIcon}>📋</Text>
        <Text style={styles.heading}>Terms of Service</Text>
        <View style={styles.datePill}>
          <Text style={styles.updated}>Last updated: March 2026</Text>
        </View>
      </View>

      {SECTIONS.map((s, idx) => {
        const num = s.title.split('.')[0];
        const title = s.title.substring(s.title.indexOf('.') + 2);
        return (
          <View key={s.title} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.numberCircle}>
                <Text style={styles.numberText}>{num}</Text>
              </View>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <Text style={styles.paragraph}>{s.body}</Text>
          </View>
        );
      })}
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  datePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  updated: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  numberCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  paragraph: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
});
