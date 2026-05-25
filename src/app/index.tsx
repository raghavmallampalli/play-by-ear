import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { log } from '@/utils/logger';

export default function DashboardScreen() {
  const router = useRouter();

  useEffect(() => {
    log.debug("Play-by-ear App Launched! Dashboard Screen Mounted successfully.");
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>Play by Ear</Text>
            <Text style={styles.appSubtitle}>Relative Pitch Chord Trainer</Text>
          </View>

          {/* Cards Grid/Stack */}
          <View style={styles.grid}>
            
            {/* Primary Action Card: Trainer */}
            <Pressable 
              style={({ pressed }) => [
                styles.primaryCard,
                pressed && styles.cardPressed
              ]}
              onPress={() => {
                log.info("Dashboard: Navigating to Trainer Difficulty selector screen.");
                router.push('/difficulty');
              }}
            >
              
              <View style={styles.iconContainerPrimary}>
                <Ionicons name="musical-notes" size={36} color="#0A305F" />
              </View>

              <Text style={styles.cardTitle}>Relative Pitch Trainer</Text>
              <Text style={styles.cardDesc}>
                Master intervals, diatonic triads, inversions, and chord progressions across 27 progressive levels.
              </Text>
              
              <View style={styles.actionRow}>
                <Text style={styles.actionText}>Start Training</Text>
                <Ionicons name="arrow-forward" size={16} color="#A8C7FA" />
              </View>
            </Pressable>

            {/* Dummy Screen C: MIDI Sandbox */}
            <Pressable 
              style={styles.disabledCard}
              onPress={() => {
                log.debug("Dashboard: User clicked locked MIDI Sandbox card (Coming Soon).");
              }}
            >
              <View style={styles.cardHeaderRow}>
                <Ionicons name="construct-outline" size={20} color="#53565F" />
                <View style={styles.grayBadge}>
                  <Text style={styles.grayBadgeText}>COMING SOON</Text>
                </View>
              </View>
              <Text style={[styles.smallCardTitle, { color: '#53565F' }]}>MIDI Sandbox</Text>
              <Text style={[styles.smallCardDesc, { color: '#53565F' }]}>
                Load standard .mid files, play in high-fidelity, and view root-position chord breakdowns. (In development)
              </Text>
            </Pressable>

            {/* Screen D: Progress Management */}
            <Pressable 
              style={styles.disabledCard}
              onPress={() => {
                log.debug("Dashboard: User clicked locked Export & Import Progress card (Coming Soon).");
                // router.push('/progress'); // Preserved functional expansion path
              }}
            >
              <View style={styles.cardHeaderRow}>
                <Ionicons name="construct-outline" size={20} color="#53565F" />
                <View style={styles.grayBadge}>
                  <Text style={styles.grayBadgeText}>COMING SOON</Text>
                </View>
              </View>
              <Text style={[styles.smallCardTitle, { color: '#53565F' }]}>Export & Import Progress</Text>
              <Text style={[styles.smallCardDesc, { color: '#53565F' }]}>
                Backup your ear-training records, import JSON progress sheets, and view training analytics. (In development)
              </Text>
            </Pressable>

          </View>

          {/* Footer branding */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Built in 🇮🇳 • </Text>
            <Pressable>
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
    padding: 24,
    gap: 32,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  appTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#E2E2E6',
    letterSpacing: -0.5,
    textAlign: 'center',
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
  primaryCard: {
    backgroundColor: '#1D2024', // Material 3 Surface Container
    borderWidth: 1,
    borderColor: 'rgba(168, 199, 250, 0.12)', // Light primary border highlight
    borderRadius: 24,
    padding: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#1D2024', // Material 3 Surface Container
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  disabledCard: {
    backgroundColor: '#1D2024',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
    borderColor: 'rgba(168, 199, 250, 0.4)',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168, 199, 250, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A8C7FA', // Material 3 Primary Light
    letterSpacing: 1,
  },
  grayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  grayBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#8A92A6',
    letterSpacing: 0.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  iconContainerPrimary: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#A8C7FA', // M3 Primary
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E2E2E6',
    letterSpacing: -0.5,
  },
  smallCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E2E2E6',
  },
  cardDesc: {
    fontSize: 14,
    color: '#C2C7CF', // M3 On Surface Variant
    lineHeight: 20,
  },
  smallCardDesc: {
    fontSize: 12,
    color: '#8A92A6',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A8C7FA',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    color: '#434753',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerLink: {
    fontSize: 11,
    color: '#A8C7FA',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
});
