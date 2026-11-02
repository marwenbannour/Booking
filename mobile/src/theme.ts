// Palette Booking+ (charte V1.0) : bleu nuit / turquoise / vert.
// La clé "blue" reste la couleur d'action principale, repointée sur le turquoise
// pour ne pas réécrire toutes les références des écrans.
export const colors = {
  canvas: '#F4F7FB',
  white: '#FFFFFF',
  ink: '#0A1B2E',
  navy: '#0A1B2E',
  navyDeep: '#102A43',
  muted: '#5A6B82',
  placeholder: '#8294AC',
  line: '#E3EAF2',
  blue: '#14B8A6',
  blueStrong: '#0E9488',
  blueSoft: '#D8F3EE',
  teal: '#14B8A6',
  tealSoft: '#D8F3EE',
  violet: '#8B5CF6',
  violetSoft: '#EDE7FE',
  success: '#22C55E',
  successSoft: '#DCFCE7',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
} as const;

export const radius = {
  md: 10,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const shadow = {
  soft: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  brand: {
    shadowColor: '#14B8A6',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
} as const;
