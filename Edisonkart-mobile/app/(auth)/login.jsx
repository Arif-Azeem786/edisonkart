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

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    try {
      await login(email.trim(), password);
      const role = useAuthStore.getState().role;
      if (['ADMIN', 'EMPLOYEE', 'VENDOR'].includes(role)) {
        router.replace('/(admin)');
      } else if (role === 'DELIVERY') {
        router.replace('/(delivery)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (e) {
      Alert.alert('Login failed', e?.message || 'Invalid email or password.');
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
          <Text style={styles.tagline}>Welcome back! Sign in to continue</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
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

          {/* Forgot password */}
          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
            style={styles.forgotRow}
            activeOpacity={0.6}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Log In</Text>
            )}
          </TouchableOpacity>

          {/* Google Sign-In */}
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%' }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
              <Text style={{ paddingHorizontal: 12, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '500' }}>or continue with</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            </View>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: 14,
                paddingHorizontal: 24,
                borderWidth: 2,
                borderColor: '#e2e8f0',
                borderRadius: 12,
                width: '100%',
                backgroundColor: '#ffffff',
              }}
              onPress={() => Alert.alert('Google Sign-In', 'Configure GOOGLE_CLIENT_ID in your environment to enable Google Sign-In.')}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 20 }}>🔵</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#334155' }}>Sign in with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Create Account */}
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.7}
          >
            <Text style={styles.outlineBtnText}>Create Account</Text>
          </TouchableOpacity>
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
  forgotRow: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgotText: { color: '#F97316', fontSize: 14, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#F97316',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { marginHorizontal: 16, color: '#94a3b8', fontSize: 14 },
  outlineBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtnText: { color: '#F97316', fontSize: 16, fontWeight: '700' },
  backLink: { alignItems: 'center', marginTop: 28 },
  backText: { color: '#64748b', fontSize: 15 },
});
