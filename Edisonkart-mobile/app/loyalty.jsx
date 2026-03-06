import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Share } from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../src/store/authStore';
import { getMyLoyalty, applyReferral } from '../src/services/loyalty';

export default function LoyaltyScreen() {
    const router = useRouter();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const [loyalty, setLoyalty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [referralInput, setReferralInput] = useState('');
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) { router.replace('/(auth)/login'); return; }
        fetchLoyalty();
    }, [isAuthenticated]);

    const fetchLoyalty = async () => {
        try {
            const res = await getMyLoyalty();
            setLoyalty(res?.data ?? res);
        } catch {} finally { setLoading(false); }
    };

    const handleApplyReferral = async () => {
        if (!referralInput.trim()) return;
        setApplying(true);
        try {
            const res = await applyReferral(referralInput.trim());
            Alert.alert('Success', res?.message || 'Referral applied!');
            fetchLoyalty();
            setReferralInput('');
        } catch (e) {
            Alert.alert('Error', e?.message || 'Invalid referral code');
        } finally { setApplying(false); }
    };

    const handleShare = async () => {
        if (!loyalty?.referralCode) return;
        try {
            await Share.share({
                message: `Join EdisonKart using my referral code ${loyalty.referralCode} and get 50 bonus points! 🎉`,
            });
        } catch {}
    };

    if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#F97316" /></View>;

    return (
        <ScrollView style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>Loyalty & Rewards</Text>
            </View>

            <View style={s.pointsCard}>
                <Text style={s.pointsLabel}>Your Points</Text>
                <Text style={s.pointsValue}>{loyalty?.points ?? 0}</Text>
                <Text style={s.pointsInfo}>₹1 = 10 points • 100 points = ₹10 discount</Text>
            </View>

            <View style={s.statsRow}>
                <View style={s.statBox}>
                    <Text style={s.statValue}>{loyalty?.totalEarned ?? 0}</Text>
                    <Text style={s.statLabel}>Total Earned</Text>
                </View>
                <View style={s.statBox}>
                    <Text style={s.statValue}>{loyalty?.totalRedeemed ?? 0}</Text>
                    <Text style={s.statLabel}>Redeemed</Text>
                </View>
                <View style={s.statBox}>
                    <Text style={s.statValue}>{loyalty?.referralCount ?? 0}</Text>
                    <Text style={s.statLabel}>Referrals</Text>
                </View>
            </View>

            <View style={s.section}>
                <Text style={s.sectionTitle}>Your Referral Code</Text>
                <View style={s.referralBox}>
                    <Text style={s.referralCode}>{loyalty?.referralCode || '---'}</Text>
                    <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.7}>
                        <Text style={s.shareBtnText}>Share</Text>
                    </TouchableOpacity>
                </View>
                <Text style={s.referralInfo}>Share your code and earn 100 points when a friend joins!</Text>
            </View>

            <View style={s.section}>
                <Text style={s.sectionTitle}>Have a Referral Code?</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                        style={s.input}
                        placeholder="Enter referral code"
                        value={referralInput}
                        onChangeText={setReferralInput}
                        autoCapitalize="characters"
                        placeholderTextColor="#94a3b8"
                    />
                    <TouchableOpacity style={[s.applyBtn, (!referralInput.trim() || applying) && { opacity: 0.5 }]} onPress={handleApplyReferral} disabled={!referralInput.trim() || applying} activeOpacity={0.7}>
                        {applying ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.applyBtnText}>Apply</Text>}
                    </TouchableOpacity>
                </View>
            </View>

            {loyalty?.history?.length > 0 && (
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Points History</Text>
                    {loyalty.history.map((h, i) => (
                        <View key={i} style={s.historyItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.historyDesc}>{h.description}</Text>
                                <Text style={s.historyDate}>{new Date(h.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <Text style={[s.historyPoints, { color: h.points > 0 ? '#16a34a' : '#ef4444' }]}>
                                {h.points > 0 ? '+' : ''}{h.points}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 8 },
    title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
    pointsCard: { margin: 16, backgroundColor: '#F97316', borderRadius: 20, padding: 24, alignItems: 'center' },
    pointsLabel: { fontSize: 14, color: '#ffffff99', fontWeight: '600' },
    pointsValue: { fontSize: 48, fontWeight: '800', color: '#fff', marginVertical: 4 },
    pointsInfo: { fontSize: 12, color: '#ffffffcc' },
    statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 16 },
    statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    statValue: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
    statLabel: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '500' },
    section: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
    referralBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
    referralCode: { fontSize: 20, fontWeight: '800', color: '#F97316', letterSpacing: 2 },
    shareBtn: { backgroundColor: '#F97316', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    shareBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    referralInfo: { fontSize: 12, color: '#64748b', marginTop: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' },
    applyBtn: { backgroundColor: '#F97316', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
    applyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f1f5f9' },
    historyDesc: { fontSize: 14, color: '#334155', fontWeight: '500' },
    historyDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    historyPoints: { fontSize: 16, fontWeight: '700' },
});
