import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, Linking, ScrollView, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { sendChatMessage } from '../src/services/chat';

const WELCOME = "Hey there! 👋 I'm **Edison**, your EdisonKart assistant. I can help with orders, products, shipping & more. How can I help you today?";

const QUICK_ACTIONS = [
  { label: '📦 Track Order', message: 'Where is my order?' },
  { label: '🛒 Browse', message: 'Show me products to browse' },
  { label: '🔄 Return', message: 'How do I return a product?' },
  { label: '❓ Help', message: 'What can you help me with?' },
];

const ROUTE_MAP = {
  '/orders': '/orders', '/cart': '/(tabs)/cart', '/account': '/(tabs)/account',
  '/wishlist': '/wishlist', '/checkout': '/checkout', '/contact': '/contact',
  '/shop': '/(tabs)/shop', '/': '/(tabs)', '/import-product': '/import-product',
  '/about': '/about', '/faq': '/faq', '/login': '/(auth)/login',
};

function parseMessage(text) {
  if (!text) return [{ type: 'text', value: '' }];
  const nodes = [];
  const lines = text.split('\n');
  for (let li = 0; li < lines.length; li++) {
    if (li > 0) nodes.push({ type: 'br' });
    const parts = lines[li].split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
    for (const part of parts) {
      if (!part) continue;
      const boldMatch = part.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) { nodes.push({ type: 'bold', value: boldMatch[1] }); continue; }
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) { nodes.push({ type: 'link', label: linkMatch[1], href: linkMatch[2] }); continue; }
      nodes.push({ type: 'text', value: part });
    }
  }
  return nodes;
}

function MessageContent({ content, onLink }) {
  const nodes = parseMessage(content);
  return (
    <Text style={{ flexShrink: 1 }}>
      {nodes.map((n, i) => {
        if (n.type === 'br') return <Text key={i}>{'\n'}</Text>;
        if (n.type === 'bold') return <Text key={i} style={s.bold}>{n.value}</Text>;
        if (n.type === 'link') return (
          <Text key={i} style={s.link} onPress={() => onLink(n.href)}>{n.label}</Text>
        );
        return <Text key={i}>{n.value}</Text>;
      })}
    </Text>
  );
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (d, delay) => Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(d, { toValue: -6, duration: 300, useNativeDriver: true }),
      Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]));
    const a1 = anim(dot1, 0), a2 = anim(dot2, 150), a3 = anim(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={s.typingWrap}>
      <View style={s.botDotSmall}><Text style={{ fontSize: 12 }}>🤖</Text></View>
      <View style={s.typingBubble}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View key={i} style={[s.typingDot, { transform: [{ translateY: d }] }]} />
        ))}
        <Text style={s.typingLabel}>Edison is typing...</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current && messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, loading]);

  useEffect(() => {
    const sub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150)
    );
    return () => sub.remove();
  }, []);

  const handleLink = useCallback((href) => {
    if (href.startsWith('http')) { Linking.openURL(href); return; }
    const mapped = ROUTE_MAP[href];
    if (mapped) router.push(mapped);
    else router.push(href);
  }, [router]);

  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setShowQuick(false);
    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(msg, history);
      const reply = res?.reply ?? res?.data?.reply ?? 'No response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't reach the server. Please try again or visit [Contact Us](/contact)."
      }]);
    } finally { setLoading(false); }
  }, [input, loading, messages]);

  const renderItem = ({ item, index }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[s.msgRow, isUser ? s.msgRowUser : s.msgRowBot]}>
        {!isUser && (
          <View style={s.botAvatar}><Text style={{ fontSize: 14 }}>🤖</Text></View>
        )}
        <View style={[s.bubble, isUser ? s.userBubble : s.botBubble]}>
          {isUser ? (
            <Text style={s.userText}>{item.content}</Text>
          ) : (
            <MessageContent content={item.content} onLink={handleLink} />
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerAvatar}>
          <Text style={{ fontSize: 20 }}>🤖</Text>
          <View style={s.onlineDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Edison</Text>
          <Text style={s.headerSub}>EdisonKart Support • Online</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => `msg-${i}`}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          showQuick && messages.length === 1 && !loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.quickRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
              {QUICK_ACTIONS.map((qa, i) => (
                <TouchableOpacity key={i} style={s.quickBtn} onPress={() => handleSend(qa.message)} activeOpacity={0.7}>
                  <Text style={s.quickText}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null
        }
        ListFooterComponent={loading ? <TypingIndicator /> : null}
      />

      {/* Input */}
      <View style={s.footer}>
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            placeholder="Ask me anything..."
            value={input}
            onChangeText={setInput}
            placeholderTextColor="#94a3b8"
            editable={!loading}
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSend()}
            blurOnSubmit
          />
        </View>
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || loading}
          activeOpacity={0.8}
        >
          <Text style={s.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#F97316', borderBottomWidth: 0,
  },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute', bottom: -1, right: -1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4ade80', borderWidth: 2, borderColor: '#F97316',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },

  list: { padding: 16, paddingBottom: 8 },

  quickRow: { marginBottom: 12, marginTop: 4 },
  quickBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#fff7ed', borderRadius: 20,
    borderWidth: 1, borderColor: '#fed7aa',
  },
  quickText: { fontSize: 13, color: '#c2410c', fontWeight: '500' },

  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  botAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fff7ed', justifyContent: 'center',
    alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#fed7aa',
  },

  bubble: { maxWidth: '78%', paddingHorizontal: 16, paddingVertical: 12 },
  userBubble: { backgroundColor: '#F97316', borderRadius: 18, borderBottomRightRadius: 4 },
  botBubble: {
    backgroundColor: '#ffffff', borderRadius: 18, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  userText: { color: '#ffffff', fontSize: 15, lineHeight: 22 },
  bold: { fontWeight: '700', color: '#0f172a' },
  link: { color: '#ea580c', fontWeight: '600', textDecorationLine: 'underline' },

  botDotSmall: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#fff7ed', justifyContent: 'center',
    alignItems: 'center', marginRight: 8,
  },
  typingWrap: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  typingBubble: {
    flexDirection: 'row', backgroundColor: '#ffffff',
    borderRadius: 18, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 16, paddingVertical: 12, gap: 5, alignItems: 'center',
  },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#94a3b8' },
  typingLabel: { fontSize: 12, color: '#94a3b8', marginLeft: 6 },

  footer: {
    flexDirection: 'row', padding: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: '#ffffff', borderTopWidth: 1,
    borderColor: '#e2e8f0', alignItems: 'flex-end', gap: 10,
  },
  inputWrap: {
    flex: 1, backgroundColor: '#f1f5f9', borderRadius: 24,
    paddingHorizontal: 18, minHeight: 48, justifyContent: 'center',
  },
  input: {
    fontSize: 15, color: '#0f172a', maxHeight: 100,
    paddingTop: 12, paddingBottom: 12,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 18, color: '#ffffff', marginLeft: 2 },
});
