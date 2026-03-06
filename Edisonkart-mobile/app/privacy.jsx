import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect personal information you provide when registering, placing orders, or contacting us, including your name, email, phone number, shipping address, and payment details.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'Your information is used to process orders, provide customer support, send order updates, improve our platform, and personalize your shopping experience. We may also use it for fraud prevention and analytics.',
  },
  {
    title: '3. Information Sharing',
    body: 'We do not sell your personal data. We share information only with delivery partners (for shipping), payment processors (for transactions), and as required by law.',
  },
  {
    title: '4. Data Security',
    body: 'We implement industry-standard security measures including encryption, secure servers, and access controls to protect your personal information. However, no method of transmission over the internet is 100% secure.',
  },
  {
    title: '5. Cookies and Tracking',
    body: 'Our app may use local storage and analytics tools to enhance your experience and understand usage patterns. You can control these through your device settings.',
  },
  {
    title: '6. Your Rights',
    body: 'You have the right to access, update, or delete your personal information. You can manage your data from your account settings or by contacting our support team.',
  },
  {
    title: '7. Third-Party Services',
    body: 'Our platform may integrate with third-party services for payments, analytics, and delivery. These services have their own privacy policies and we encourage you to review them.',
  },
  {
    title: '8. Children\'s Privacy',
    body: 'EdisonKart is not intended for children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with data, please contact us.',
  },
  {
    title: '9. Changes to This Policy',
    body: 'We may update this privacy policy from time to time. We will notify users of significant changes via email or in-app notification. Continued use after changes constitutes acceptance.',
  },
  {
    title: '10. Contact Us',
    body: 'If you have questions about this privacy policy, please contact us at support@edisonkart.com or through our Contact Us page.',
  },
];

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Privacy Policy', headerShown: true, headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '800', fontSize: 18 } }} />

      <View style={styles.headerSection}>
        <Text style={styles.headerIcon}>🔒</Text>
        <Text style={styles.heading}>Privacy Policy</Text>
        <View style={styles.datePill}>
          <Text style={styles.updated}>Last updated: March 2026</Text>
        </View>
      </View>

      <View style={styles.introCard}>
        <Text style={styles.introText}>
          At EdisonKart, your privacy is important to us. This policy explains how we collect, use,
          and protect your personal information.
        </Text>
      </View>

      {SECTIONS.map((s) => {
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
  introCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  introText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
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
