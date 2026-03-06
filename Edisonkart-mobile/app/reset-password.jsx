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
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { resetPassword } from '../src/services/auth';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, otp, password);
      Alert.alert('Success', 'Your password has been reset successfully.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to reset password. Please try again.');
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
          title: 'Reset Password',
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
          <Text style={styles.headerIcon}>🔐</Text>
        </View>

        <Text style={styles.heading}>Reset Password</Text>
        <Text style={styles.subtext}>
          Enter the OTP sent to{' '}
          <Text style={styles.emailHighlight}>{email || 'your email'}</Text>
          {' '}and your new password.
        </Text>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* OTP */}
          <Text style={styles.fieldLabel}>Verification Code</Text>
          <View style={styles.otpWrap}>
            <TextInput
              style={styles.otpInput}
              placeholder="------"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor="#cbd5e1"
              textAlign="center"
            />
          </View>

          {/* New password */}
          <Text style={styles.fieldLabel}>New Password</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="New password"
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

          {/* Confirm password */}
          <Text style={styles.fieldLabel}>Confirm Password</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔑</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
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

          {/* Reset button */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Reset Password</Text>
            )}
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
  },
  emailHighlight: { color: '#0f172a', fontWeight: '600' },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  otpWrap: { marginBottom: 20 },
  otpInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    height: 56,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 10,
    color: '#0f172a',
    paddingHorizontal: 16,
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
  toggleBtn: { padding: 4 },
  toggleText: { fontSize: 18 },
  primaryBtn: {
    backgroundColor: '#F97316',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  backLink: { marginTop: 28 },
  backText: { color: '#64748b', fontSize: 15 },
});
