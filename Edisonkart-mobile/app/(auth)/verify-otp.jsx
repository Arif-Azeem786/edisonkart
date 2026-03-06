import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useAuthStore from '../../src/store/authStore';
import { resendOTP } from '../../src/services/auth';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const verifyOTP = useAuthStore((s) => s.verifyOTP);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Enter OTP.');
      return;
    }
    try {
      await verifyOTP(email || '', otp.trim());
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Verification failed', e?.message || 'Invalid OTP.');
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      await resendOTP(email || '');
      Alert.alert('OTP Sent', 'A new OTP has been sent to your email.');
      startCountdown();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not resend OTP.');
    } finally {
      setResending(false);
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
        {/* Header icon */}
        <View style={styles.iconWrap}>
          <Text style={styles.headerIcon}>✉️</Text>
        </View>

        <Text style={styles.heading}>Verify Email</Text>
        <Text style={styles.subtext}>
          We sent a 6-digit verification code to{'\n'}
          <Text style={styles.emailHighlight}>{email || 'your email'}</Text>
        </Text>

        {/* OTP Input */}
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

        {/* Verify button */}
        <TouchableOpacity
          style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Verify</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity
          style={[styles.resendBtn, (countdown > 0 || resending) && styles.resendBtnDisabled]}
          onPress={handleResend}
          disabled={countdown > 0 || resending}
          activeOpacity={0.7}
        >
          {resending ? (
            <ActivityIndicator color="#F97316" size="small" />
          ) : (
            <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
              {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </Text>
          )}
        </TouchableOpacity>

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
  subtext: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  emailHighlight: { color: '#0f172a', fontWeight: '600' },
  otpWrap: {
    width: '100%',
    marginTop: 32,
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    height: 64,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 12,
    color: '#0f172a',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#F97316',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  resendBtn: {
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  resendBtnDisabled: { borderColor: '#e2e8f0' },
  resendText: { color: '#F97316', fontWeight: '700', fontSize: 15 },
  resendTextDisabled: { color: '#94a3b8' },
  backLink: { marginTop: 28 },
  backText: { color: '#64748b', fontSize: 15 },
});
