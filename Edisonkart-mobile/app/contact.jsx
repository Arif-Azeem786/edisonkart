import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { submitContact } from '../src/services/contact';

export default function ContactScreen() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    const { name, email, subject, message } = form;
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await submitContact({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });
      Alert.alert('Sent!', 'Your message has been submitted. We will get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Contact Us', headerShown: true, headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '800', fontSize: 18 } }} />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <Text style={styles.headerIcon}>✉️</Text>
          <Text style={styles.heading}>Get in Touch</Text>
          <Text style={styles.subtitle}>Have a question or feedback? We'd love to hear from you.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Your Name</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={form.name}
              onChangeText={(v) => update('name', v)}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={styles.input}
              placeholder="john@example.com"
              value={form.email}
              onChangeText={(v) => update('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Text style={styles.inputLabel}>Subject</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>📝</Text>
            <TextInput
              style={styles.input}
              placeholder="What's this about?"
              value={form.subject}
              onChangeText={(v) => update('subject', v)}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Text style={styles.inputLabel}>Your Message</Text>
          <View style={[styles.inputWrap, styles.textAreaWrap]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us more..."
              value={form.message}
              onChangeText={(v) => update('message', v)}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Send Message</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 20,
    paddingBottom: 48,
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  textAreaWrap: {
    alignItems: 'flex-start',
    paddingTop: 6,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 10,
  },
  btn: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
