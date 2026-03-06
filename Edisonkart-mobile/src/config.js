import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEV_MACHINE_IP = '10.195.3.65';
const PRODUCTION_URL = 'https://edisonkart.com';

const API_HOST = __DEV__
  ? (Constants.expoConfig?.extra?.apiHost ||
     process.env.EXPO_PUBLIC_API_URL ||
     (Platform.OS === 'web' ? 'http://localhost:5000' : `http://${DEV_MACHINE_IP}:5000`))
  : PRODUCTION_URL;

export const API_BASE_URL = `${API_HOST.replace(/\/$/, '')}/api`;
