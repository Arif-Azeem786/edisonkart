import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Stack } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    q: 'What is EdisonKart?',
    a: 'EdisonKart is a modern e-commerce platform that offers a wide range of products at competitive prices with fast delivery and secure payments.',
  },
  {
    q: 'How do I place an order?',
    a: 'Browse products, add items to your cart, proceed to checkout, enter your shipping details, choose a payment method, and confirm your order.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept credit/debit cards, UPI, net banking, wallets, and cash on delivery depending on your location.',
  },
  {
    q: 'How can I track my order?',
    a: 'Go to your Orders page from your account. Each order shows its current status and tracking information once shipped.',
  },
  {
    q: 'What is the return policy?',
    a: 'We offer a 7-day return policy on most items. Products must be unused and in original packaging. Refunds are processed within 5-7 business days.',
  },
  {
    q: 'How do I contact support?',
    a: 'Visit the Contact Us page to submit a query, or email us at support@edisonkart.com. Our team is available 24/7 to assist you.',
  },
];

export default function FAQScreen() {
  const [expanded, setExpanded] = useState(null);

  const toggle = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => (prev === index ? null : index));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'FAQ', headerShown: true, headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '800', fontSize: 18 } }} />

      <View style={styles.headerSection}>
        <Text style={styles.headerIcon}>❓</Text>
        <Text style={styles.heading}>Frequently Asked Questions</Text>
        <Text style={styles.subheading}>Find answers to common questions below</Text>
      </View>

      {FAQ_DATA.map((item, index) => {
        const isOpen = expanded === index;
        return (
          <TouchableOpacity
            key={index}
            style={[styles.card, isOpen && styles.cardActive]}
            onPress={() => toggle(index)}
            activeOpacity={0.7}
          >
            <View style={styles.qRow}>
              <View style={styles.qNumberWrap}>
                <Text style={styles.qNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.question}>{item.q}</Text>
              <View style={[styles.toggleCircle, isOpen && styles.toggleCircleActive]}>
                <Text style={[styles.toggleIcon, isOpen && styles.toggleIconActive]}>
                  {isOpen ? '−' : '+'}
                </Text>
              </View>
            </View>
            {isOpen && (
              <View style={styles.answerWrap}>
                <Text style={styles.answer}>{item.a}</Text>
              </View>
            )}
          </TouchableOpacity>
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
    marginBottom: 6,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  cardActive: {
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  qRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qNumberWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  qNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
  },
  question: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 12,
    lineHeight: 21,
  },
  toggleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCircleActive: {
    backgroundColor: '#F97316',
  },
  toggleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748b',
    lineHeight: 22,
  },
  toggleIconActive: {
    color: '#ffffff',
  },
  answerWrap: {
    marginTop: 14,
    marginLeft: 44,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  answer: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
});
