import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useBooking } from '../context/BookingContext';
import { useLocale } from '../context/LocaleContext';
import { colors, radius, shadow, spacing } from '../theme';

function formatPrice(price: string | null | undefined, currency: string, locale: 'fr' | 'ar' = 'fr'): string {
  if (price == null || price === '') return locale === 'ar' ? 'السعر عند الطلب' : 'Prix sur demande';
  const amount = Number(price);
  if (!Number.isFinite(amount)) return price;
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-TN' : 'fr-TN', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatTime(value: string, timeZone?: string, locale: 'fr' | 'ar' = 'fr'): string {
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      ...(timeZone ? { timeZone } : {}),
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}

function formatLongDate(value: string, timeZone?: string, locale: 'fr' | 'ar' = 'fr'): string {
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : 'fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      ...(timeZone ? { timeZone } : {}),
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function nextDays(count: number): Date[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date;
  });
}

function rtlRow(isRtl: boolean) {
  if (!isRtl) return undefined;
  return Platform.OS === 'web' ? styles.rowRtlWeb : styles.rowRtl;
}

function AppButton({
  title,
  onPress,
  icon,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  const { isRtl } = useLocale();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, disabled && styles.buttonDisabled, pressed && !disabled && styles.buttonPressed]}
    >
      <LinearGradient
        colors={[colors.teal, colors.success]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.buttonInner, rtlRow(isRtl)]}
      >
        {icon ? <Ionicons name={icon} size={19} color={colors.onBrand} /> : null}
        <Text style={styles.buttonText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { isRtl } = useLocale();
  return (
    <View style={[styles.sectionHeading, rtlRow(isRtl)]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={styles.linkText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ServiceCard({ service, accent = 'blue', onPress }: {
  service: ReturnType<typeof useBooking>['services'][number];
  accent?: 'blue' | 'teal' | 'violet';
  onPress: () => void;
}) {
  const { currency } = useBooking();
  const { isRtl, locale } = useLocale();
  const serviceName = service.name.toLocaleLowerCase('fr-FR');
  const icon = serviceName.includes('massage')
    ? 'hand-left-outline'
    : serviceName.includes('soin') || serviceName.includes('beaute') || serviceName.includes('beauté')
      ? 'sparkles-outline'
      : serviceName.includes('sport') || serviceName.includes('fitness')
        ? 'barbell-outline'
        : 'cut-outline';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.serviceCard, rtlRow(isRtl), pressed && styles.buttonPressed]}>
      <View style={[styles.serviceIcon, accent === 'teal' ? styles.serviceIconTeal : accent === 'violet' ? styles.serviceIconViolet : null]}>
        <Ionicons name={icon} size={21} color={accent === 'teal' ? colors.teal : accent === 'violet' ? colors.violet : colors.blue} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.cardTitle}>{service.name}</Text>
        {service.description ? <Text style={[styles.serviceDescription, isRtl && styles.textRtl]} numberOfLines={1}>{service.description}</Text> : null}
        <Text style={[styles.mutedText, isRtl && styles.textRtl]}>{locale === 'ar' ? `${service.durationMinutes} دقيقة` : `${service.durationMinutes} min`} · {formatPrice(service.price, currency, locale)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={colors.muted} />
    </Pressable>
  );
}

function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { isRtl } = useLocale();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choiceChip, rtlRow(isRtl), selected && styles.choiceChipActive]}
    >
      <Text style={[styles.choiceChipText, isRtl && styles.textRtl, selected && styles.choiceChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function HomeScreen() {
  const { establishment, services, loadingBusiness, isConfigured, bookings, timezone, beginBooking } = useBooking();
  const { isRtl, locale, t } = useLocale();
  const popularServices = services.slice(0, 3);
  const nextBooking = bookings
    .filter((saved) => new Date(saved.booking.startsAt).getTime() >= Date.now())
    .sort((left, right) => new Date(left.booking.startsAt).getTime() - new Date(right.booking.startsAt).getTime())[0];

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.greetingRow, rtlRow(isRtl)]}>
        <View style={styles.flex}>
          <Text style={[styles.eyebrow, isRtl && styles.textRtl]}>{t('home.eyebrow')}</Text>
          <Text style={[styles.greeting, isRtl && styles.textRtl]}>{t('home.greeting')}</Text>
          <Text style={[styles.mutedText, isRtl && styles.textRtl]}>
            {establishment?.name ? t('home.ready', { name: establishment.name }) : t('home.subtitle')}
          </Text>
        </View>
        <View style={styles.avatar}><Ionicons name="person" size={21} color={colors.blue} /></View>
      </View>

      <View style={styles.heroCard}>
        <View style={[styles.heroTopline, rtlRow(isRtl)]}>
          <View style={styles.heroIcon}><Ionicons name="calendar" size={23} color={colors.white} /></View>
          <View style={[styles.heroBadge, rtlRow(isRtl)]}>
            <View style={styles.heroBadgeDot} />
            <Text style={[styles.heroBadgeText, isRtl && styles.textRtl]}>{t('home.heroBadge')}</Text>
          </View>
        </View>
        <Text style={[styles.heroTitle, isRtl && styles.textRtl]}>{t('home.heroTitle')}</Text>
        <Text style={[styles.heroCopy, isRtl && styles.textRtl]}>{t('home.heroCopy')}</Text>
        <AppButton title={t('home.book')} icon={isRtl ? 'arrow-back' : 'arrow-forward'} onPress={() => {
          beginBooking();
          router.push('/booking');
        }} />
        <View style={styles.heroDecoration} />
        <View style={styles.heroDecorationSmall} />
      </View>

      {nextBooking ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('brand.viewBookings')}
          onPress={() => router.navigate('/(tabs)/appointments')}
          style={({ pressed }) => [styles.upcomingCard, rtlRow(isRtl), pressed && styles.buttonPressed]}
        >
          <View style={styles.upcomingIcon}><Ionicons name="time-outline" size={20} color={colors.teal} /></View>
          <View style={styles.flex}>
            <Text style={[styles.smallLabel, isRtl && styles.textRtl]}>{t('home.nextBooking')}</Text>
            <Text style={[styles.cardTitle, isRtl && styles.textRtl]}>{nextBooking.booking.service?.name ?? t('booking.serviceTitle')}</Text>
            <Text style={[styles.mutedText, isRtl && styles.textRtl]}>{formatLongDate(nextBooking.booking.startsAt, timezone, locale)} · {formatTime(nextBooking.booking.startsAt, timezone, locale)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.muted} />
        </Pressable>
      ) : null}

      <SectionTitle title={t('home.quick')} />
      <View style={styles.quickActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            beginBooking();
            router.push('/booking');
          }}
          style={({ pressed }) => [styles.quickActionCard, isRtl && styles.quickActionRtl, pressed && styles.buttonPressed]}
        >
          <View style={[styles.quickActionIcon, styles.quickActionIconBlue]}>
            <Ionicons name="calendar-outline" size={21} color={colors.blue} />
          </View>
          <Text style={[styles.quickActionTitle, isRtl && styles.textRtl]}>{t('home.chooseService')}</Text>
          <Text style={[styles.quickActionDetail, isRtl && styles.textRtl]}>{t('home.book')}</Text>
          <Ionicons name={isRtl ? 'arrow-back' : 'arrow-forward'} size={16} color={colors.blue} style={[styles.quickActionArrow, isRtl && styles.quickActionArrowRtl]} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate('/(tabs)/appointments')}
          style={({ pressed }) => [styles.quickActionCard, isRtl && styles.quickActionRtl, pressed && styles.buttonPressed]}
        >
          <View style={[styles.quickActionIcon, styles.quickActionIconTeal]}>
            <Ionicons name="time-outline" size={21} color={colors.teal} />
          </View>
          <Text style={[styles.quickActionTitle, isRtl && styles.textRtl]}>{t('home.myBookings')}</Text>
          <Text style={[styles.quickActionDetail, isRtl && styles.textRtl]}>{t('home.viewBookings')}</Text>
          <Ionicons name={isRtl ? 'arrow-back' : 'arrow-forward'} size={16} color={colors.teal} style={[styles.quickActionArrow, isRtl && styles.quickActionArrowRtl]} />
        </Pressable>
      </View>

      <View style={[styles.featureRow, rtlRow(isRtl)]}>
        <Feature icon="logo-whatsapp" title={t('home.whatsapp')} detail={t('home.withConsent')} tint={colors.tealSoft} color={colors.teal} />
        <Feature icon="shield-checkmark-outline" title={t('home.privacy')} detail={t('home.secureBooking')} tint={colors.blueSoft} color={colors.blue} />
      </View>

      <SectionTitle title={t('home.popularServices')} action={t('home.seeAll')} onAction={() => {
        beginBooking();
        router.push('/booking');
      }} />
      {!isConfigured ? (
        <View style={styles.configCard}>
          <Ionicons name="settings-outline" size={21} color={colors.blue} />
          <View style={styles.flex}>
            <Text style={[styles.cardTitle, isRtl && styles.textRtl]}>{t('home.configure')}</Text>
            <Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('home.configureHint')}</Text>
          </View>
        </View>
      ) : loadingBusiness ? (
        <View style={[styles.loadingRow, rtlRow(isRtl)]}><ActivityIndicator color={colors.blue} /><Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('home.loadServices')}</Text></View>
      ) : popularServices.length ? (
        <View style={styles.serviceList}>
          {popularServices.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              accent={index === 1 ? 'teal' : index === 2 ? 'violet' : 'blue'}
              onPress={() => {
                beginBooking(service);
                router.push('/booking');
              }}
            />
          ))}
        </View>
      ) : (
        <View style={[styles.emptyCard, rtlRow(isRtl)]}><Ionicons name="sparkles-outline" size={23} color={colors.muted} /><Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('home.noServices')}</Text></View>
      )}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

export function BookingScreen() {
  const state = useBooking();
  const { isRtl, locale, t } = useLocale();
  const days = useMemo(() => nextDays(7), []);
  const [rescheduleStart, setRescheduleStart] = useState('');
  const rescheduleSlots = useMemo(() => {
    const seen = new Set<string>();
    return state.rescheduleSlots.filter((slot) => {
      if (seen.has(slot.start)) return false;
      seen.add(slot.start);
      return true;
    });
  }, [state.rescheduleSlots]);
  const employeeName = state.selectedEmployeeId
    ? state.employees.find((employee) => employee.id === state.selectedEmployeeId)?.displayName ?? '—'
    : 'Sans préférence';

  function goBack() {
    state.setError(null);
    if (state.step === 'details') state.setStep('slot');
    else if (state.step === 'slot') state.setStep('service');
    else router.back();
  }

  if (state.step === 'confirmation' && state.booking) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.confirmationCard}>
          <View style={styles.successCircle}><Ionicons name="checkmark" size={35} color={colors.white} /></View>
          <Text style={[styles.confirmTitle, isRtl && styles.textRtl]}>{t('booking.confirmed')}</Text>
          <Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('booking.sentTo', { name: state.booking.establishment.name })}</Text>
          <View style={styles.confirmDivider} />
          <Text style={styles.smallLabel}>{t('booking.reference')}</Text>
          <Text style={styles.reference}>{state.booking.booking.publicReference}</Text>
          <View style={styles.confirmDetail}>
            <Ionicons name="cut-outline" size={19} color={colors.blue} />
            <Text style={[styles.confirmDetailText, isRtl && styles.textRtl]}>{state.booking.booking.service?.name ?? state.selectedService?.name}</Text>
          </View>
          <View style={styles.confirmDetail}>
            <Ionicons name="calendar-outline" size={19} color={colors.blue} />
            <Text style={styles.confirmDetailText}>
              {formatLongDate(state.booking.booking.startsAt, state.timezone, locale)} · {formatTime(state.booking.booking.startsAt, state.timezone, locale)}
            </Text>
          </View>
          {state.booking.booking.employee?.displayName ? (
            <View style={styles.confirmDetail}>
              <Ionicons name="person-outline" size={19} color={colors.blue} />
              <Text style={[styles.confirmDetailText, isRtl && styles.textRtl]}>{state.booking.booking.employee.displayName}</Text>
            </View>
          ) : null}
          {state.error ? (
            <Text accessibilityRole="alert" style={styles.rescheduleError}>{state.error}</Text>
          ) : null}
          {state.rescheduleRequested ? (
            <Text accessibilityRole="status" style={[styles.mutedText, isRtl && styles.textRtl]}>
              {t('booking.reschedulePending')}
            </Text>
          ) : state.rescheduleMode ? (
            <View style={styles.reschedulePanel}>
              <Text style={[styles.cardTitle, isRtl && styles.textRtl]}>{t('booking.rescheduleTitle')}</Text>
              <SectionTitle title={t('booking.chooseDay')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.dateScroll, rtlRow(isRtl)]}>
                {days.map((day) => {
                  const key = toDateKey(day);
                  const active = state.rescheduleDate === key;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      key={key}
                      onPress={() => {
                        setRescheduleStart('');
                        state.setRescheduleDate(key);
                      }}
                      style={[styles.dateCard, active && styles.dateCardActive]}
                    >
                      <Text style={[styles.dateWeekday, isRtl && styles.textRtl, active && styles.dateTextActive]}>
                        {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : 'fr-FR', { weekday: 'short' }).format(day).replace('.', '')}
                      </Text>
                      <Text style={[styles.dateNumber, active && styles.dateTextActive]}>{day.getDate()}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <SectionTitle title={t('booking.availableTimes')} />
              {state.loadingRescheduleSlots ? (
                <View style={[styles.loadingRow, rtlRow(isRtl)]}>
                  <ActivityIndicator color={colors.blue} />
                  <Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('booking.searchSlots')}</Text>
                </View>
              ) : rescheduleSlots.length ? (
                <View style={styles.timeGrid}>
                  {rescheduleSlots.map((slot) => {
                    const active = rescheduleStart === slot.start;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        key={slot.start}
                        onPress={() => setRescheduleStart(slot.start)}
                        style={[styles.timeChip, active && styles.timeChipActive]}
                      >
                        <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                          {formatTime(slot.start, state.timezone, locale)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('booking.noSlots')}</Text>
              )}
              {rescheduleStart ? (
                <AppButton
                  title={state.submittingReschedule ? t('booking.rescheduleSending') : t('booking.rescheduleSubmit')}
                  disabled={state.submittingReschedule}
                  onPress={() => {
                    const selected = rescheduleSlots.find((slot) => slot.start === rescheduleStart);
                    if (selected) void state.submitRescheduleRequest(selected);
                  }}
                />
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => state.setRescheduleMode(false)}
                style={styles.rescheduleCancel}
              >
                <Text style={[styles.linkText, isRtl && styles.textRtl]}>{t('booking.cancelReschedule')}</Text>
              </Pressable>
            </View>
          ) : state.booking.customerAccessToken ? (
            <AppButton
              title={t('booking.rescheduleTitle')}
              icon="calendar-outline"
              onPress={() => state.setRescheduleMode(true)}
            />
          ) : null}
          <AppButton title={t('booking.homeButton')} icon="home-outline" onPress={() => {
            state.resetBooking();
            router.replace('/');
          }} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Pressable onPress={goBack} style={[styles.backLink, rtlRow(isRtl)]} accessibilityRole="button">
        <Ionicons name={isRtl ? 'arrow-forward' : 'arrow-back'} size={19} color={colors.ink} />
        <Text style={[styles.backText, isRtl && styles.textRtl]}>{state.step === 'service' ? t('booking.home') : t('booking.back')}</Text>
      </Pressable>
      <View style={styles.stepHeader}>
        <Text style={[styles.eyebrow, isRtl && styles.textRtl]}>{t('booking.new')}</Text>
        <Text style={[styles.screenTitle, isRtl && styles.textRtl]}>
          {state.step === 'service' ? t('booking.serviceTitle') : state.step === 'slot' ? t('booking.slotTitle') : t('booking.detailsTitle')}
        </Text>
        <Text style={[styles.mutedText, isRtl && styles.textRtl]}>
          {state.step === 'service' ? t('booking.serviceHint') : state.step === 'slot' ? t('booking.slotHint') : t('booking.detailsHint')}
        </Text>
        <ProgressDots step={state.step === 'service' ? 0 : state.step === 'slot' ? 1 : 2} />
      </View>

      {state.step === 'service' ? (
        !state.isConfigured ? (
          <View style={styles.configCard}>
            <Ionicons name="settings-outline" size={21} color={colors.blue} />
            <View style={styles.flex}>
              <Text style={[styles.cardTitle, isRtl && styles.textRtl]}>{t('home.configure')}</Text>
              <Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('booking.configureHint')}</Text>
            </View>
          </View>
        ) : state.loadingBusiness ? (
          <View style={styles.loadingLarge}><ActivityIndicator color={colors.blue} size="large" /><Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('booking.loadServices')}</Text></View>
        ) : state.services.length ? (
          <View style={styles.serviceList}>
            {state.services.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                accent={index % 3 === 1 ? 'teal' : index % 3 === 2 ? 'violet' : 'blue'}
                onPress={() => state.chooseService(service)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}><Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('booking.noServices')}</Text></View>
        )
      ) : null}

      {state.step === 'slot' && state.selectedService ? (
        <View>
          <View style={styles.selectedServiceCard}>
            <View style={styles.serviceIcon}><Ionicons name="cut-outline" size={22} color={colors.blue} /></View>
            <View style={styles.flex}>
              <Text style={[styles.cardTitle, isRtl && styles.textRtl]}>{state.selectedService.name}</Text>
              <Text style={[styles.mutedText, isRtl && styles.textRtl]}>{locale === 'ar' ? `${state.selectedService.durationMinutes} دقيقة` : `${state.selectedService.durationMinutes} min`} · {formatPrice(state.selectedService.price, state.currency, locale)}</Text>
            </View>
            <Pressable onPress={() => state.setStep('service')} accessibilityRole="button" accessibilityLabel={t('booking.changeService')}>
              <Ionicons name="create-outline" size={21} color={colors.blue} />
            </Pressable>
          </View>
          <SectionTitle title={t('booking.professional')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipScroll, rtlRow(isRtl)]}>
            <ChoiceChip label={t('booking.noPreference')} selected={!state.selectedEmployeeId} onPress={() => state.setEmployee('')} />
            {state.loadingEmployees ? <ActivityIndicator color={colors.blue} /> : state.employees.map((employee) => (
              <ChoiceChip key={employee.id} label={employee.displayName} selected={state.selectedEmployeeId === employee.id} onPress={() => state.setEmployee(employee.id)} />
            ))}
          </ScrollView>
          <SectionTitle title={t('booking.chooseDay')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.dateScroll, rtlRow(isRtl)]}>
            {days.map((day) => {
              const key = toDateKey(day);
              const active = state.selectedDate === key;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={key}
                  onPress={() => state.setDate(key)}
                  style={[styles.dateCard, active && styles.dateCardActive]}
                >
                  <Text style={[styles.dateWeekday, isRtl && styles.textRtl, active && styles.dateTextActive]}>
                    {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : 'fr-FR', { weekday: 'short' }).format(day).replace('.', '')}
                  </Text>
                  <Text style={[styles.dateNumber, active && styles.dateTextActive]}>{new Intl.NumberFormat(locale === 'ar' ? 'ar-TN' : 'fr-FR').format(day.getDate())}</Text>
                  <Text style={[styles.dateMonth, isRtl && styles.textRtl, active && styles.dateTextActive]}>
                    {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'short' }).format(day).replace('.', '')}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <SectionTitle title={t('booking.availableTimes')} />
          {state.loadingSlots ? (
            <View style={[styles.loadingRow, rtlRow(isRtl)]}><ActivityIndicator color={colors.blue} /><Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('booking.searchSlots')}</Text></View>
          ) : state.slots.length ? (
            <View style={styles.timeGrid}>
              {state.slots.map((slot) => {
                const active = state.selectedStart === slot.start;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={slot.start}
                    onPress={() => state.setStart(slot.start)}
                    style={[styles.timeChip, active && styles.timeChipActive]}
                  >
                    <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>{formatTime(slot.start, state.timezone, locale)}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyCard, rtlRow(isRtl)]}><Ionicons name="calendar-clear-outline" size={22} color={colors.muted} /><Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('booking.noSlots')}</Text></View>
          )}
          {state.selectedStart ? (
            <View style={styles.slotSummary}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.slotSummaryText, isRtl && styles.textRtl]}>{employeeName} · {formatTime(state.selectedStart, state.timezone, locale)}</Text>
            </View>
          ) : null}
          <AppButton title={t('booking.continue')} icon={isRtl ? 'arrow-back' : 'arrow-forward'} disabled={!state.selectedStart} onPress={() => state.setStep('details')} />
        </View>
      ) : null}

      {state.step === 'details' && state.selectedService ? (
        <View>
          <View style={[styles.summaryCard, rtlRow(isRtl)]}>
            <View style={styles.summaryIcon}><Ionicons name="calendar" size={20} color={colors.blue} /></View>
            <View style={styles.flex}>
              <Text style={[styles.cardTitle, isRtl && styles.textRtl]}>{state.selectedService.name}</Text>
              <Text style={[styles.mutedText, isRtl && styles.textRtl]}>{formatLongDate(state.selectedStart, state.timezone, locale)} · {formatTime(state.selectedStart, state.timezone, locale)}</Text>
              <Text style={[styles.mutedText, isRtl && styles.textRtl]}>{employeeName} · {formatPrice(state.selectedService.price, state.currency, locale)}</Text>
            </View>
          </View>
          <Text style={[styles.formLabel, isRtl && styles.textRtl]}>{t('booking.fullName')}</Text>
          <TextInput accessibilityLabel={t('booking.fullName')} autoComplete="name" autoCapitalize="words" placeholder={t('booking.fullNamePlaceholder')} placeholderTextColor={colors.placeholder} value={state.customerName} onChangeText={state.setCustomerName} style={[styles.input, isRtl && styles.inputRtl]} returnKeyType="next" />
          <Text style={[styles.formLabel, isRtl && styles.textRtl]}>{t('booking.phone')}</Text>
          <TextInput accessibilityLabel={t('booking.phone')} autoComplete="tel" keyboardType="phone-pad" placeholder={t('booking.phonePlaceholder')} placeholderTextColor={colors.placeholder} value={state.customerPhone} onChangeText={state.setCustomerPhone} style={styles.input} returnKeyType="next" />
          <Text style={[styles.formLabel, isRtl && styles.textRtl]}>{t('booking.email')} <Text style={styles.optionalText}>{t('booking.optional')}</Text></Text>
          <TextInput accessibilityLabel={t('booking.email')} autoComplete="email" autoCapitalize="none" keyboardType="email-address" placeholder={t('booking.emailPlaceholder')} placeholderTextColor={colors.placeholder} value={state.customerEmail} onChangeText={state.setCustomerEmail} style={styles.input} returnKeyType="done" />
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: state.consent }} onPress={() => state.setConsent(!state.consent)} style={[styles.consentRow, rtlRow(isRtl)]}>
            <View style={[styles.checkbox, state.consent && styles.checkboxChecked]}>
              {state.consent ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
            </View>
            <Text style={[styles.consentText, isRtl && styles.textRtl]}>{t('booking.consent')}</Text>
          </Pressable>
          <AppButton title={state.submitting ? t('booking.sending') : t('booking.confirm')} icon="checkmark-circle-outline" disabled={state.submitting} onPress={state.submitBooking} />
        </View>
      ) : null}
    </ScrollView>
  );
}

export function AppointmentsScreen() {
  const { bookings, loadingBookings, timezone, beginBooking } = useBooking();
  const { isRtl, t } = useLocale();
  const now = Date.now();
  const upcoming = bookings
    .filter((saved) => new Date(saved.booking.startsAt).getTime() >= now)
    .sort((left, right) => new Date(left.booking.startsAt).getTime() - new Date(right.booking.startsAt).getTime());
  const history = bookings
    .filter((saved) => new Date(saved.booking.startsAt).getTime() < now)
    .sort((left, right) => new Date(right.booking.startsAt).getTime() - new Date(left.booking.startsAt).getTime());
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.eyebrow, isRtl && styles.textRtl]}>{t('appointments.eyebrow')}</Text>
      <Text style={[styles.screenTitle, isRtl && styles.textRtl]}>{t('appointments.title')}</Text>
      <Text style={[styles.mutedText, styles.screenSubtitle, isRtl && styles.textRtl]}>{t('appointments.subtitle')}</Text>
      {loadingBookings ? (
        <View style={styles.loadingLarge}><ActivityIndicator color={colors.blue} size="large" /><Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('appointments.loading')}</Text></View>
      ) : bookings.length ? (
        <>
          {upcoming.length ? (
            <>
              <SectionTitle title={t('appointments.upcoming')} />
              <View style={styles.appointmentList}>
                {upcoming.map((saved) => <AppointmentCard key={saved.booking.id} booking={saved} timezone={timezone} past={false} />)}
              </View>
            </>
          ) : null}
          {history.length ? (
            <>
              <SectionTitle title={t('appointments.history')} />
              <View style={styles.appointmentList}>
                {history.map((saved) => <AppointmentCard key={saved.booking.id} booking={saved} timezone={timezone} past />)}
              </View>
            </>
          ) : null}
          <Text style={[styles.localNotice, isRtl && styles.textRtl]}>{t('appointments.localNotice')}</Text>
        </>
      ) : (
        <View style={styles.emptyAppointments}>
          <View style={styles.emptyIllustration}><Ionicons name="calendar-outline" size={39} color={colors.blue} /></View>
          <Text style={[styles.emptyTitle, isRtl && styles.textRtl]}>{t('appointments.emptyTitle')}</Text>
          <Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('appointments.emptyHint')}</Text>
          <AppButton title={t('appointments.bookNow')} icon={isRtl ? 'arrow-back' : 'arrow-forward'} onPress={() => {
            beginBooking();
            router.push('/booking');
          }} />
        </View>
      )}
    </ScrollView>
  );
}

function AppointmentCard({
  booking,
  timezone,
  past = false,
}: {
  booking: ReturnType<typeof useBooking>['bookings'][number];
  timezone?: string;
  past?: boolean;
}) {
  const { isRtl, locale, t } = useLocale();
  return (
    <View style={styles.appointmentCard}>
      <View style={[styles.appointmentTop, rtlRow(isRtl)]}>
        <View style={styles.appointmentIcon}><Ionicons name="calendar" size={20} color={colors.blue} /></View>
        <View style={styles.flex}>
          <Text style={[styles.smallLabel, isRtl && styles.textRtl]}>{past ? t('appointments.past') : t('appointments.future')}</Text>
          <Text style={[styles.cardTitle, isRtl && styles.textRtl]}>{booking.booking.service?.name ?? (locale === 'ar' ? 'موعد' : 'Rendez-vous')}</Text>
        </View>
        <View style={[styles.statusBadge, past && styles.pastStatusBadge]}>
          <Text style={[styles.statusText, past && styles.pastStatusText]}>{past ? t('appointments.pastStatus') : t('appointments.confirmed')}</Text>
        </View>
      </View>
      <View style={[styles.appointmentLine, rtlRow(isRtl)]}>
        <Ionicons name="time-outline" size={18} color={colors.muted} />
        <Text style={[styles.appointmentDetail, isRtl && styles.textRtl]}>{formatLongDate(booking.booking.startsAt, timezone, locale)} · {formatTime(booking.booking.startsAt, timezone, locale)}</Text>
      </View>
      {booking.booking.employee?.displayName ? (
        <View style={[styles.appointmentLine, rtlRow(isRtl)]}>
          <Ionicons name="person-outline" size={18} color={colors.muted} />
          <Text style={[styles.appointmentDetail, isRtl && styles.textRtl]}>{booking.booking.employee.displayName}</Text>
        </View>
      ) : null}
      <View style={[styles.referenceLine, rtlRow(isRtl)]}>
        <Text style={styles.smallLabel}>{t('appointments.reference')}</Text>
        <Text style={styles.referenceSmall}>{booking.booking.publicReference}</Text>
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const { establishment, isConfigured, loadingBusiness } = useBooking();
  const { isRtl, locale, toggleLocale, t } = useLocale();
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.eyebrow, isRtl && styles.textRtl]}>{t('profile.eyebrow')}</Text>
      <Text style={[styles.screenTitle, isRtl && styles.textRtl]}>{t('profile.title')}</Text>
      <Text style={[styles.mutedText, styles.screenSubtitle, isRtl && styles.textRtl]}>{t('profile.subtitle')}</Text>
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}><Ionicons name="person" size={30} color={colors.blue} /></View>
        <Text style={[styles.cardTitle, isRtl && styles.textRtl]}>{t('profile.welcome')}</Text>
        <Text style={[styles.mutedText, isRtl && styles.textRtl]}>{t('profile.welcomeHint')}</Text>
      </View>
      <View style={styles.settingsCard}>
        <SettingRow isRtl={isRtl} icon="storefront-outline" label={t('profile.establishment')} value={loadingBusiness ? t('status.loading') : establishment?.name ?? (isConfigured ? t('status.unavailable') : t('status.notConfigured'))} />
        <View style={styles.settingDivider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('profile.chooseLanguage')}
          onPress={toggleLocale}
          style={({ pressed }) => [styles.settingRow, rtlRow(isRtl), pressed && styles.buttonPressed]}
        >
          <View style={styles.settingIcon}><Ionicons name="language-outline" size={19} color={colors.blue} /></View>
          <View style={styles.flex}>
            <Text style={[styles.settingLabel, isRtl && styles.textRtl]}>{t('profile.language')}</Text>
            <Text style={[styles.settingValue, isRtl && styles.textRtl]}>{locale === 'fr' ? t('profile.francais') : t('profile.arabic')}</Text>
          </View>
          <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.muted} />
        </Pressable>
        <View style={styles.settingDivider} />
        <SettingRow isRtl={isRtl} icon="logo-whatsapp" label={t('profile.whatsapp')} value={t('profile.whatsappValue')} />
        <View style={styles.settingDivider} />
        <SettingRow isRtl={isRtl} icon="shield-checkmark-outline" label={t('profile.privacy')} value={t('profile.privacyValue')} />
      </View>
    </ScrollView>
  );
}

function SettingRow({ icon, label, value, isRtl }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; isRtl: boolean }) {
  return (
    <View style={[styles.settingRow, rtlRow(isRtl)]}>
      <View style={styles.settingIcon}><Ionicons name={icon} size={19} color={colors.blue} /></View>
      <View style={styles.flex}>
        <Text style={[styles.settingLabel, isRtl && styles.textRtl]}>{label}</Text>
        <Text style={[styles.settingValue, isRtl && styles.textRtl]}>{value}</Text>
      </View>
      <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.muted} />
    </View>
  );
}

function Feature({ icon, title, detail, tint, color }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string; tint: string; color: string }) {
  return (
    <View style={styles.feature}>
      <View style={[styles.featureIcon, { backgroundColor: tint }]}><Ionicons name={icon} size={21} color={color} /></View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDetail}>{detail}</Text>
    </View>
  );
}

function ProgressDots({ step }: { step: number }) {
  const { isRtl, t } = useLocale();
  return (
    <View style={[styles.progressRow, rtlRow(isRtl)]} accessibilityLabel={t('booking.step', { current: step + 1 })}>
      {[0, 1, 2].map((item) => <View key={item} style={[styles.progressTrack, item <= step && styles.progressTrackActive]} />)}
      <Text style={[styles.progressText, isRtl && styles.textRtl]}>{t('booking.step', { current: step + 1 })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  rowRtl: { flexDirection: 'row-reverse' },
  rowRtlWeb: { flexDirection: 'row' },
  textRtl: { textAlign: 'right', writingDirection: 'rtl' },
  inputRtl: { textAlign: 'right', writingDirection: 'rtl' },
  quickActionRtl: { alignItems: 'flex-end' },
  quickActionArrowRtl: { right: undefined, left: spacing.md },
  flex: { flex: 1, minWidth: 0 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, marginBottom: spacing.lg },
  eyebrow: { fontFamily: 'Sora_700Bold', fontSize: 10, letterSpacing: 1, color: colors.blue, marginBottom: 5 },
  greeting: { fontFamily: 'Sora_700Bold', fontSize: 21, lineHeight: 28, color: colors.ink },
  mutedText: { fontFamily: 'Sora_400Regular', color: colors.muted, fontSize: 12, lineHeight: 18 },
  avatar: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.blueSoft, borderWidth: 2, borderColor: colors.white },
  heroCard: { overflow: 'hidden', backgroundColor: colors.navy, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, minHeight: 245, justifyContent: 'space-between', ...shadow.card },
  heroTopline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  heroIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  heroBadgeText: { fontFamily: 'Sora_600SemiBold', fontSize: 8, letterSpacing: 0.6, color: '#D5E2F8' },
  heroTitle: { maxWidth: 270, fontFamily: 'Sora_700Bold', fontSize: 25, lineHeight: 32, color: colors.white },
  heroCopy: { maxWidth: 290, fontFamily: 'Sora_400Regular', color: '#D5E2F8', fontSize: 12, lineHeight: 19, marginTop: spacing.xs, marginBottom: spacing.md },
  heroDecoration: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 25, borderColor: 'rgba(37,99,235,0.22)', right: -78, top: -73 },
  heroDecorationSmall: { position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 12, borderColor: 'rgba(13,148,136,0.24)', right: 3, top: 76 },
  button: { minHeight: 50, borderRadius: radius.md, overflow: 'hidden', ...shadow.brand },
  buttonInner: { flex: 1, minHeight: 50, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  buttonDisabled: { opacity: 0.48 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonText: { fontFamily: 'Sora_600SemiBold', fontSize: 14, color: colors.onBrand },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginBottom: spacing.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg },
  upcomingIcon: { width: 41, height: 41, borderRadius: 14, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
  smallLabel: { fontFamily: 'Sora_600SemiBold', fontSize: 9, letterSpacing: 0.7, color: colors.muted, marginBottom: 3 },
  quickActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickActionCard: { flex: 1, minHeight: 142, position: 'relative', padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, ...shadow.soft },
  quickActionIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, marginBottom: spacing.sm },
  quickActionIconBlue: { backgroundColor: colors.blueSoft },
  quickActionIconTeal: { backgroundColor: colors.tealSoft },
  quickActionTitle: { fontFamily: 'Sora_600SemiBold', color: colors.ink, fontSize: 12, lineHeight: 17 },
  quickActionDetail: { fontFamily: 'Sora_400Regular', color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  quickActionArrow: { position: 'absolute', right: spacing.md, top: spacing.md + 11 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.white, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.line },
  feature: { flex: 1, alignItems: 'center' },
  featureIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  featureTitle: { fontFamily: 'Sora_600SemiBold', color: colors.ink, fontSize: 10 },
  featureDetail: { fontFamily: 'Sora_400Regular', color: colors.muted, fontSize: 9, marginTop: 2 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, marginBottom: spacing.sm },
  sectionTitle: { fontFamily: 'Sora_700Bold', color: colors.ink, fontSize: 16 },
  linkText: { fontFamily: 'Sora_600SemiBold', color: colors.blue, fontSize: 12 },
  serviceList: { gap: spacing.sm },
  serviceCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, ...shadow.soft },
  serviceIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  serviceIconTeal: { backgroundColor: colors.tealSoft },
  serviceIconViolet: { backgroundColor: colors.violetSoft },
  cardTitle: { fontFamily: 'Sora_600SemiBold', color: colors.ink, fontSize: 13, lineHeight: 19 },
  serviceDescription: { fontFamily: 'Sora_400Regular', color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 1 },
  emptyCard: { minHeight: 74, padding: spacing.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  configCard: { padding: spacing.md, backgroundColor: colors.blueSoft, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  loadingRow: { minHeight: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  loadingLarge: { minHeight: 170, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  bottomSpace: { height: spacing.xl },
  screenTitle: { fontFamily: 'Sora_700Bold', fontSize: 24, lineHeight: 32, color: colors.ink, marginBottom: 4 },
  screenSubtitle: { marginTop: -4, marginBottom: spacing.lg },
  stepHeader: { marginBottom: spacing.md },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 38, marginBottom: spacing.md },
  backText: { fontFamily: 'Sora_500Medium', color: colors.ink, fontSize: 13 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.md },
  progressTrack: { height: 4, flex: 1, borderRadius: 3, backgroundColor: colors.line },
  progressTrackActive: { backgroundColor: colors.blue },
  progressText: { fontFamily: 'Sora_600SemiBold', color: colors.muted, fontSize: 9, marginLeft: 5 },
  selectedServiceCard: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.blueSoft, borderRadius: radius.lg, marginBottom: spacing.sm },
  chipScroll: { gap: spacing.sm, paddingBottom: spacing.md },
  choiceChip: { minHeight: 39, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  choiceChipActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  choiceChipText: { fontFamily: 'Sora_500Medium', color: colors.ink, fontSize: 12 },
  choiceChipTextActive: { color: colors.white },
  dateScroll: { gap: spacing.sm, paddingBottom: spacing.md },
  dateCard: { width: 62, minHeight: 82, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  dateCardActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  dateWeekday: { fontFamily: 'Sora_500Medium', color: colors.muted, fontSize: 10, textTransform: 'capitalize' },
  dateNumber: { fontFamily: 'Sora_700Bold', color: colors.ink, fontSize: 20 },
  dateMonth: { fontFamily: 'Sora_400Regular', color: colors.muted, fontSize: 9, textTransform: 'capitalize' },
  dateTextActive: { color: colors.white },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  timeChip: { width: '31%', minHeight: 43, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  timeChipActive: { backgroundColor: colors.blueSoft, borderColor: colors.blue },
  timeChipText: { fontFamily: 'Sora_600SemiBold', color: colors.ink, fontSize: 12 },
  timeChipTextActive: { color: colors.blue },
  slotSummary: { padding: spacing.sm, marginBottom: spacing.md, borderRadius: radius.md, backgroundColor: colors.successSoft, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  slotSummaryText: { fontFamily: 'Sora_500Medium', color: colors.ink, fontSize: 12 },
  summaryCard: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.blueSoft, marginBottom: spacing.lg },
  summaryIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  formLabel: { fontFamily: 'Sora_600SemiBold', color: colors.ink, fontSize: 12, marginBottom: 7, marginTop: spacing.sm },
  optionalText: { fontFamily: 'Sora_400Regular', color: colors.muted, fontSize: 11 },
  input: { minHeight: 49, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, backgroundColor: colors.white, color: colors.ink, fontFamily: 'Sora_400Regular', fontSize: 14 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginVertical: spacing.md, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.tealSoft },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.teal, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.teal, borderColor: colors.teal },
  consentText: { flex: 1, fontFamily: 'Sora_400Regular', color: colors.ink, fontSize: 11, lineHeight: 17 },
  confirmationCard: { gap: 3, alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: spacing.lg, ...shadow.card },
  reschedulePanel: { width: '100%', gap: spacing.sm, marginVertical: spacing.md },
  rescheduleError: { color: colors.danger, textAlign: 'center', paddingVertical: spacing.sm },
  rescheduleCancel: { alignItems: 'center', paddingVertical: spacing.sm },
  successCircle: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
  confirmTitle: { fontFamily: 'Sora_700Bold', color: colors.ink, fontSize: 21, textAlign: 'center', marginBottom: spacing.xs },
  confirmDivider: { width: '100%', height: 1, backgroundColor: colors.line, marginVertical: spacing.lg },
  reference: { fontFamily: 'Sora_700Bold', fontSize: 19, color: colors.blue, marginVertical: spacing.xs },
  confirmDetail: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  confirmDetailText: { flex: 1, fontFamily: 'Sora_500Medium', color: colors.ink, fontSize: 12, textTransform: 'capitalize' },
  appointmentCard: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, ...shadow.soft },
  appointmentList: { gap: spacing.sm },
  appointmentTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  appointmentIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { backgroundColor: colors.successSoft, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 9 },
  statusText: { fontFamily: 'Sora_600SemiBold', fontSize: 10, color: colors.success },
  pastStatusBadge: { backgroundColor: colors.blueSoft },
  pastStatusText: { color: colors.muted },
  appointmentLine: { minHeight: 31, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  appointmentDetail: { fontFamily: 'Sora_400Regular', color: colors.ink, fontSize: 12, textTransform: 'capitalize' },
  referenceLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.md, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line },
  referenceSmall: { fontFamily: 'Sora_700Bold', fontSize: 12, color: colors.blue },
  localNotice: { fontFamily: 'Sora_400Regular', fontSize: 10, lineHeight: 15, color: colors.muted, marginTop: spacing.md },
  emptyAppointments: { minHeight: 310, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  emptyIllustration: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 40, backgroundColor: colors.blueSoft },
  emptyTitle: { fontFamily: 'Sora_700Bold', fontSize: 16, color: colors.ink, textAlign: 'center' },
  profileCard: { alignItems: 'center', padding: spacing.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, marginBottom: spacing.md },
  profileAvatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  settingsCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md },
  settingRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  settingIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontFamily: 'Sora_600SemiBold', color: colors.ink, fontSize: 12 },
  settingValue: { fontFamily: 'Sora_400Regular', color: colors.muted, fontSize: 10, marginTop: 3 },
  settingDivider: { height: 1, backgroundColor: colors.line, marginLeft: 45 },
});
