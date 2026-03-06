import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../src/store/authStore';
import { getProfile, updateProfile, addAddress, updateAddress, deleteAddress } from '../src/services/user';

const EMPTY_ADDR = { name: '', phone: '', street: '', city: '', state: '', pincode: '' };

export default function ProfileScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [addrForm, setAddrForm] = useState({ ...EMPTY_ADDR });
  const [addrSaving, setAddrSaving] = useState(false);

  const fetchProfile = () => {
    setLoading(true);
    getProfile()
      .then((res) => {
        const data = res?.data ?? res;
        setProfile(data);
        setName(data?.name ?? '');
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated]);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      useAuthStore.getState().updateUser({ name: name.trim() });
      Alert.alert('Saved', 'Profile updated.');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const openAddForm = () => {
    setEditingAddrId(null);
    setAddrForm({ ...EMPTY_ADDR });
    setShowAddrForm(true);
  };

  const openEditForm = (addr) => {
    setEditingAddrId(addr._id);
    setAddrForm({
      name: addr.name || '',
      phone: addr.phone || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
    setShowAddrForm(true);
  };

  const handleDeleteAddress = (addrId) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddress(addrId);
            fetchProfile();
          } catch (e) {
            Alert.alert('Error', e?.message || 'Could not delete address.');
          }
        },
      },
    ]);
  };

  const handleSaveAddress = async () => {
    const { name: addrName, phone, street, city, state, pincode } = addrForm;
    if (!street.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      Alert.alert('Error', 'Please fill street, city, state and pincode.');
      return;
    }
    setAddrSaving(true);
    try {
      const payload = {
        name: addrName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      };
      if (editingAddrId) {
        await updateAddress(editingAddrId, payload);
      } else {
        await addAddress(payload);
      }
      setShowAddrForm(false);
      setEditingAddrId(null);
      setAddrForm({ ...EMPTY_ADDR });
      fetchProfile();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not save address.');
    } finally {
      setAddrSaving(false);
    }
  };

  const updateField = (field, value) => {
    setAddrForm((prev) => ({ ...prev, [field]: value }));
  };

  if (!isAuthenticated) return null;
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  const addresses = profile?.addresses ?? [];
  const initial = (profile?.name || profile?.email || '?')[0].toUpperCase();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>
        <View style={styles.profileFields}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#94a3b8"
          />
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={styles.emailWrap}>
            <Text style={styles.emailText}>{profile?.email}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSaveName}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Addresses Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Saved Addresses</Text>
        <TouchableOpacity style={styles.addNewBtn} onPress={openAddForm} activeOpacity={0.7}>
          <Text style={styles.addNewIcon}>+</Text>
          <Text style={styles.addNewText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {showAddrForm && (
        <View style={styles.addrForm}>
          <Text style={styles.formTitle}>
            {editingAddrId ? 'Edit Address' : 'New Address'}
          </Text>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            value={addrForm.name}
            onChangeText={(v) => updateField('name', v)}
            placeholderTextColor="#94a3b8"
          />
          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 9876543210"
            value={addrForm.phone}
            onChangeText={(v) => updateField('phone', v)}
            keyboardType="phone-pad"
            placeholderTextColor="#94a3b8"
          />
          <Text style={styles.inputLabel}>Street</Text>
          <TextInput
            style={styles.input}
            placeholder="123 Main Street"
            value={addrForm.street}
            onChangeText={(v) => updateField('street', v)}
            placeholderTextColor="#94a3b8"
          />
          <View style={styles.row}>
            <View style={styles.halfWrap}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={addrForm.city}
                onChangeText={(v) => updateField('city', v)}
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.halfWrap}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                value={addrForm.state}
                onChangeText={(v) => updateField('state', v)}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>
          <Text style={styles.inputLabel}>Pincode</Text>
          <TextInput
            style={styles.input}
            placeholder="400001"
            value={addrForm.pincode}
            onChangeText={(v) => updateField('pincode', v)}
            keyboardType="number-pad"
            placeholderTextColor="#94a3b8"
          />
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.formCancelBtn}
              onPress={() => {
                setShowAddrForm(false);
                setEditingAddrId(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.formCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formSaveBtn, addrSaving && styles.btnDisabled]}
              onPress={handleSaveAddress}
              disabled={addrSaving}
              activeOpacity={0.8}
            >
              {addrSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.formSaveBtnText}>
                  {editingAddrId ? 'Update Address' : 'Add Address'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {addresses.map((addr) => (
        <View key={addr._id} style={styles.addrCard}>
          <View style={styles.addrTop}>
            <View style={styles.addrIconWrap}>
              <Text style={styles.addrIcon}>📍</Text>
            </View>
            <View style={styles.addrContent}>
              {addr.name ? (
                <Text style={styles.addrName}>{addr.name}</Text>
              ) : null}
              {addr.phone ? (
                <Text style={styles.addrPhone}>{addr.phone}</Text>
              ) : null}
              <Text style={styles.addrText}>
                {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
              </Text>
            </View>
          </View>
          <View style={styles.addrActions}>
            <TouchableOpacity
              style={styles.addrEditBtn}
              onPress={() => openEditForm(addr)}
              activeOpacity={0.7}
            >
              <Text style={styles.addrEditText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addrDeleteBtn}
              onPress={() => handleDeleteAddress(addr._id)}
              activeOpacity={0.7}
            >
              <Text style={styles.addrDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {addresses.length === 0 && !showAddrForm && (
        <View style={styles.noAddrWrap}>
          <Text style={styles.noAddrIcon}>🏠</Text>
          <Text style={styles.noAddrTitle}>No addresses yet</Text>
          <Text style={styles.noAddrText}>Add a delivery address to get started.</Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },

  profileCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  avatarWrap: { marginBottom: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F97316',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#F97316' },
  profileFields: { width: '100%', marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  emailWrap: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emailText: { fontSize: 15, color: '#64748b' },
  saveBtn: {
    width: '100%',
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addNewIcon: { fontSize: 16, color: '#F97316', fontWeight: '700' },
  addNewText: { color: '#F97316', fontWeight: '600', fontSize: 13 },

  addrForm: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  inputLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  row: { flexDirection: 'row', gap: 10 },
  halfWrap: { flex: 1 },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  formCancelBtn: { paddingVertical: 12, paddingHorizontal: 18 },
  formCancelText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  formSaveBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  formSaveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

  addrCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addrTop: { flexDirection: 'row', alignItems: 'flex-start' },
  addrIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addrIcon: { fontSize: 18 },
  addrContent: { flex: 1 },
  addrName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  addrPhone: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  addrText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  addrActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  addrEditBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
  },
  addrEditText: { color: '#F97316', fontWeight: '600', fontSize: 13 },
  addrDeleteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
  },
  addrDeleteText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },

  noAddrWrap: { alignItems: 'center', paddingVertical: 40 },
  noAddrIcon: { fontSize: 40, marginBottom: 12 },
  noAddrTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  noAddrText: { fontSize: 14, color: '#64748b' },
});
