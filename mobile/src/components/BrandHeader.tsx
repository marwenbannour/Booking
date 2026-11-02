import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../context/LocaleContext';
import { colors, spacing } from '../theme';

export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <View style={[styles.brandMark, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Ionicons name="calendar" size={size * 0.54} color={colors.white} />
      <View style={styles.brandDot}>
        <Ionicons name="logo-whatsapp" size={size * 0.3} color={colors.white} />
      </View>
    </View>
  );
}

export function BrandHeader() {
  const { isRtl, t } = useLocale();
  return (
    <View style={[styles.header, isRtl && styles.headerRtl]}>
      <View style={styles.brandRow}>
        <BrandMark />
        <View>
          <Text style={styles.brandName}>Booking<Text style={styles.brandAccent}>+</Text></Text>
          <Text style={[styles.brandTagline, isRtl && styles.textRtl]}>{t('brand.tagline')}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('brand.bookings')}
        onPress={() => router.navigate('/(tabs)/appointments')}
        style={({ pressed }) => [styles.headerIcon, pressed && styles.headerIconPressed]}
      >
        <Ionicons name="calendar-outline" size={22} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.blue,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  brandDot: {
    position: 'absolute',
    width: 18,
    height: 18,
    right: -5,
    bottom: -2,
    borderRadius: 9,
    backgroundColor: colors.teal,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy, letterSpacing: -0.5 },
  brandAccent: { color: colors.teal },
  brandTagline: { fontFamily: 'Sora_400Regular', fontSize: 9, color: colors.muted, marginTop: 1 },
  headerIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.canvas },
  headerIconPressed: { opacity: 0.7 },
  headerRtl: { flexDirection: Platform.OS === 'web' ? 'row' : 'row-reverse' },
  textRtl: { textAlign: 'right', writingDirection: 'rtl' },
});
