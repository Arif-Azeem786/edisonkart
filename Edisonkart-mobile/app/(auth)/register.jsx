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
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../../src/store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      Alert.alert('Success', 'Check your email for OTP to verify.');
      router.push({ pathname: '/(auth)/verify-otp', params: { email: email.trim() } });
    } catch (e) {
      Alert.alert('Registration failed', e?.message || 'Something went wrong.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandSection}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Create your account to get started</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Name */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Email */}
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

          {/* Password */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.toggleBtn}
              activeOpacity={0.6}
            >
              <Text style={styles.toggleText}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔑</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              style={styles.toggleBtn}
              activeOpacity={0.6}
            >
              <Text style={styles.toggleText}>{showConfirm ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {/* Register button */}
          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Sign in link */}
          <View style={styles.signInRow}>
            <Text style={styles.signInLabel}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.6}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Back link */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink} activeOpacity={0.6}>
          <Text style={styles.backText}>← Back</Text>
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
  },
  brandSection: { alignItems: 'center', marginBottom: 36 },
  brandLogo: { width: 200, height: 48, marginBottom: 8 },
  brandName: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: '#64748b', marginTop: 8 },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    height: 52,
  },
  inputIcon: { fontSize: 18, marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#0f172a' },
  toggleBtn: { padding: 4 },
  toggleText: { fontSize: 18 },
  primaryBtn: {
    backgroundColor: '#F97316',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  signInLabel: { fontSize: 15, color: '#64748b' },
  signInLink: { fontSize: 15, color: '#F97316', fontWeight: '700' },
  backLink: { alignItems: 'center', marginTop: 28 },
  backText: { color: '#64748b', fontSize: 15 },
});
