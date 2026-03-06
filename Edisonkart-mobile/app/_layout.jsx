import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width: SW, height: SH } = Dimensions.get('window');

function SplashScreen({ onFinish }) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(15)).current;
  const shimmerTranslate = useRef(new Animated.Value(-SW)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo fade in + scale up
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      // Pulse effect on logo
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      // Tagline slides up
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(taglineTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      // Dots appear
      Animated.timing(dotsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      // Hold
      Animated.delay(600),
      // Fade out the entire splash
      Animated.timing(containerOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onFinish());

    // Shimmer loop
    Animated.loop(
      Animated.timing(shimmerTranslate, { toValue: SW, duration: 2000, useNativeDriver: true }),
    ).start();
  }, []);

  return (
    <Animated.View style={[splash.container, { opacity: containerOpacity }]}>
      <StatusBar style="light" />

      {/* Background gradient circles */}
      <View style={splash.bgCircle1} />
      <View style={splash.bgCircle2} />
      <View style={splash.bgCircle3} />

      {/* Logo */}
      <Animated.View
        style={[
          splash.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }],
          },
        ]}
      >
        <View style={splash.logoGlow} />
        <Image
          source={require('../assets/logo.png')}
          style={splash.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Title */}
      <Animated.Text
        style={[
          splash.title,
          { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] },
        ]}
      >
        EDISONKART
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text
        style={[
          splash.tagline,
          { opacity: taglineOpacity, transform: [{ translateY: taglineTranslateY }] },
        ]}
      >
        Premium Shopping Experience
      </Animated.Text>

      {/* Loading dots */}
      <Animated.View style={[splash.dotsRow, { opacity: dotsOpacity }]}>
        <LoadingDots />
      </Animated.View>

      {/* Shimmer overlay */}
      <Animated.View
        style={[
          splash.shimmer,
          { transform: [{ translateX: shimmerTranslate }] },
        ]}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

function LoadingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      );
    animate(dot1, 0).start();
    animate(dot2, 200).start();
    animate(dot3, 400).start();
  }, []);

  return (
    <View style={splash.dots}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[splash.dot, { opacity: dot }]} />
      ))}
    </View>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

const splash = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  bgCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(249, 115, 22, 0.06)',
    top: -120,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(30, 58, 138, 0.15)',
    bottom: -80,
    left: -80,
  },
  bgCircle3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(249, 115, 22, 0.04)',
    top: SH * 0.35,
    left: SW * 0.6,
  },

  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  logo: {
    width: 90,
    height: 90,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 6,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 48,
  },

  dotsRow: {
    position: 'absolute',
    bottom: 80,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
  },

  shimmer: {
    position: 'absolute',
    top: 0,
    width: 80,
    height: SH,
    backgroundColor: 'rgba(255,255,255,0.03)',
    transform: [{ rotate: '15deg' }],
  },
});
