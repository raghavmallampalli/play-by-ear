import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Linking, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconPiano, IconWrench, IconCog } from '@/components/icons/NativeIcons';
import { log } from '@/utils/logger';
import { REPO_BASE_URL } from '../constants/links';

export default function DashboardScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  useEffect(() => {
    log.debug("Play-by-ear App Launched! Dashboard Screen Mounted successfully.");
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isLandscape && styles.scrollContentLandscape
          ]} 
          showsVerticalScrollIndicator={false}
        >
          
          {/* Header Section */}
          <View style={[styles.headerContainer, isLandscape && styles.headerContainerLandscape]}>
            <View style={[styles.header, isLandscape && styles.headerLandscape]}>
              <Text style={[styles.appTitle, isLandscape && styles.appTitleLandscape]}>Play by Ear</Text>
              <Text style={styles.appSubtitle}>Relative Pitch Chord Trainer</Text>
            </View>
          </View>

          {/* Cards Grid/Stack */}
          <View style={[
            styles.grid,
            isLandscape && styles.gridLandscape
          ]}>
            
            {/* Primary Action Card: Trainer */}
            <Pressable 
              style={({ pressed }) => [
                styles.primaryCard,
                isLandscape && styles.cardLandscape,
                pressed && styles.cardPressed
              ]}
              onPress={() => {
                log.info("Dashboard: Navigating to Trainer Difficulty selector screen.");
                router.push('/difficulty');
              }}
            >
              
              <View style={styles.iconContainerPrimary}>
                <IconPiano size={36} color="#0A305F" />
              </View>

              <Text style={styles.cardTitle}>Relative Pitch Trainer</Text>
            </Pressable>

            {/* Dummy Screen C: MIDI Sandbox */}
            <Pressable 
              style={[styles.disabledCard, isLandscape && styles.cardLandscape]}
              onPress={() => {
                log.debug("Dashboard: User clicked locked MIDI Sandbox card (Coming Soon).");
              }}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconContainerDisabled}>
                  <IconWrench size={36} color="#53565F" />
                </View>
                <View style={styles.grayBadge}>
                  <Text style={styles.grayBadgeText}>COMING SOON</Text>
                </View>
              </View>
              <Text style={[styles.smallCardTitle, { color: '#53565F' }]}>MIDI Sandbox</Text>
            </Pressable>

            {/* Screen D: Settings & Preferences */}
            <Pressable 
              style={({ pressed }) => [
                styles.smallPrimaryCard,
                isLandscape && styles.cardLandscape,
                pressed && styles.cardPressed
              ]}
              onPress={() => {
                log.info("Dashboard: Navigating to Settings & Preferences screen.");
                router.push('/settings');
              }}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconContainerSecondary}>
                  <IconCog size={36} color="#A8C7FA" />
                </View>
              </View>
              <Text style={styles.smallCardTitle}>Settings & Preferences</Text>
            </Pressable>

          </View>

          {/* Footer branding */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Built in 🇮🇳 • </Text>
            <Pressable onPress={() => Linking.openURL(REPO_BASE_URL)}>
              <Text style={styles.footerLink}>GitHub</Text>
            </Pressable>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111318', // Material 3 Baseline Dark Background
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 32,
    alignItems: 'center',
    flexGrow: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentLandscape: {
    padding: 16,
    gap: 20,
  },
  headerContainer: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  headerContainerLandscape: {
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  headerLandscape: {
    gap: 2,
  },
  settingsBtn: {
    position: 'absolute',
    right: 0,
    top: 6,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#1D2024',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingsBtnPressed: {
    backgroundColor: '#25282F',
    opacity: 0.8,
  },
  appTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#E2E2E6',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  appTitleLandscape: {
    fontSize: 28,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#8A92A6',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  grid: {
    width: '100%',
    maxWidth: 480,
    gap: 16,
  },
  gridLandscape: {
    flexDirection: 'row',
    maxWidth: 960,
    alignItems: 'stretch',
  },
  cardLandscape: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-start',
  },
  primaryCard: {
    backgroundColor: '#1D2024', // Material 3 Surface Container
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'flex-start',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  smallPrimaryCard: {
    backgroundColor: '#1D2024', // Material 3 Surface Container
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 18,
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: '#25282F',
    transform: [{ scale: 0.985 }],
  },
  disabledCard: {
    backgroundColor: '#15171A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    padding: 18,
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainerPrimary: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#A8C7FA', // Primary Blue container
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSecondary: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(168, 199, 250, 0.06)', // Subtle blue-gray container
    borderWidth: 1,
    borderColor: 'rgba(168, 199, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerDisabled: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#1E2024',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E2E2E6',
  },
  cardDesc: {
    fontSize: 13,
    color: '#A8C7FA',
    lineHeight: 18,
  },
  smallCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E2E2E6',
  },
  smallCardDesc: {
    fontSize: 12,
    color: '#8A92A6',
    lineHeight: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  grayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#1D2024',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  grayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8E919A',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 11,
    color: '#53565F',
  },
  footerLink: {
    fontSize: 11,
    color: '#A8C7FA',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
