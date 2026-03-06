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
import { Stack, useRouter } from 'expo-router';
import { forgotPassword } from '../src/services/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(trimmed);
      Alert.alert('Success', 'A reset OTP has been sent to your email.', [
        { text: 'OK', onPress: () => router.push({ pathname: '/reset-password', params: { email: trimmed } }) },
      ]);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to send reset OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Forgot Password',
          headerShown: true,
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header icon */}
        <View style={styles.iconWrap}>
          <Text style={styles.headerIcon}>🔑</Text>
        </View>

        <Text style={styles.heading}>Forgot Password?</Text>
        <Text style={styles.subtext}>
          No worries! Enter your email address and we'll send you an OTP to reset your password.
        </Text>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Send Reset OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Back link */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink} activeOpacity={0.6}>
          <Text style={styles.backText}>← Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 48,
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: { fontSize: 36 },
  heading: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  subtext: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
    height: 52,
  },
  inputIcon: { fontSize: 18, marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#0f172a' },
  primaryBtn: {
    backgroundColor: '#F97316',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  backLink: { marginTop: 28 },
  backText: { color: '#64748b', fontSize: 15 },
});
