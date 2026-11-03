import { Sora_400Regular } from '@expo-google-fonts/sora/400Regular';
import { Sora_500Medium } from '@expo-google-fonts/sora/500Medium';
import { Sora_600SemiBold } from '@expo-google-fonts/sora/600SemiBold';
import { Sora_700Bold } from '@expo-google-fonts/sora/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BrandHeader } from '../components/BrandHeader';
import { BookingProvider, useBooking } from '../context/BookingContext';
import { LocaleProvider, useLocale } from '../context/LocaleContext';
import { colors, spacing } from '../theme';

function RootNavigator() {
  const [fontsLoaded] = useFonts({ Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold });
  const { error, setError } = useBooking();
  const { isRtl } = useLocale();

  if (!fontsLoaded) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={colors.blue} /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <BrandHeader />
      {error ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={[styles.errorText, isRtl && styles.textRtl]}>{error}</Text>
          <Text onPress={() => setError(null)} style={styles.closeError} accessibilityRole="button">×</Text>
        </View>
      ) : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking" options={{ presentation: 'card' }} />
      </Stack>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <BookingProvider>
          <RootNavigator />
        </BookingProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  errorText: { flex: 1, color: colors.danger, fontFamily: 'Sora_500Medium', fontSize: 12, lineHeight: 18 },
  closeError: { color: colors.danger, fontSize: 21, paddingHorizontal: 6 },
  textRtl: { textAlign: 'right', writingDirection: 'rtl' },
});
