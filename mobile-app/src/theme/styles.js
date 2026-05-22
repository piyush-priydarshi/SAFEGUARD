import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderColor: colors.neonBlue,
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    marginVertical: 8,
    shadowColor: colors.neonBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  cardDanger: {
    borderColor: colors.danger,
    shadowColor: colors.danger,
  },
  cardPink: {
    borderColor: colors.neonPink,
    shadowColor: colors.neonPink,
  },
  titleText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: colors.neonPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 16,
  },
  subtitleText: {
    color: colors.neonBlue,
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  textDim: {
    color: colors.textDim,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 4,
  }
});
