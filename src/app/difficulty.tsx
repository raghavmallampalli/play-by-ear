import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconArrowLeft, IconPlay, IconWrench } from '@/components/icons/NativeIcons';
import { log } from '@/utils/logger';

// Definition of the 9 groups of 3 levels (27 levels total)
const LEVEL_GROUPS = [
  {
    title: 'Group A: Scale Degree Ear Training',
    desc: 'Identify individual notes by their position in the major scale.',
    levels: [
      { id: 1, name: 'Level 1: Do Re Mi Fa (Degrees 1–4)', detail: 'Lower tetrachord — C D E F in C major' },
      { id: 2, name: 'Level 2: Sol La Ti Do (Degrees 5–8)', detail: 'Upper tetrachord — G A B C, including the leading tone (7th)' },
      { id: 3, name: 'Level 3: Happy Birthday Melody', detail: 'Full melody dictation — identify each note by scale degree' },
    ]
  },
  {
    title: 'Group B: Chord Recognition',
    desc: 'Identify I, IV, V chords and hear them in musical context.',
    levels: [
      { id: 4, name: 'Level 4: I · IV · V Chords', detail: 'Pure chord recognition — no melody, root position triads' },
      { id: 5, name: 'Level 5: Chords With Melody', detail: 'Chord recognition with a diatonic melody note on top' },
      { id: 6, name: 'Level 6: Happy Birthday + Chords', detail: 'Full harmonization — identify each chord while the melody plays' },
    ]
  },
  {
    title: 'Group C: Triads in Root Position',
    desc: 'Identify chord qualities with simple root bass voicing.',
    levels: [
      { id: 7, name: 'Level 7: Major & Minor Triads', detail: 'I (Major) vs vi (minor) chords' },
      { id: 8, name: 'Level 8: Full Diatonic Triads', detail: 'I, ii, iii, IV, V, vi triads' },
      { id: 9, name: 'Level 9: Chromatic / Borrowed Triads', detail: 'Introducing bVI, bVII, bIII chords' },
    ]
  },
  {
    title: 'Group D: Triad Inversions',
    desc: 'Train your ear to recognize chords regardless of voicing.',
    levels: [
      { id: 10, name: 'Level 10: First Inversion Chords', detail: 'Root position vs 1st Inversion (6)' },
      { id: 11, name: 'Level 11: Second Inversion Chords', detail: 'Adding 2nd Inversions (6/4)' },
      { id: 12, name: 'Level 12: Mixed Inversions', detail: 'Randomized diatonic chord inversions' },
    ]
  },
  {
    title: 'Group E: Diatonic Seventh Chords',
    desc: 'Master dense, rich 4-note jazz harmonies.',
    levels: [
      { id: 13, name: 'Level 13: Major 7th & Dominant 7th', detail: 'IMaj7, IVMaj7 vs V7 chords' },
      { id: 14, name: 'Level 14: Minor 7th Chords', detail: 'iim7, iiim7, vim7 chords' },
      { id: 15, name: 'Level 15: Full Diatonic 7th Mix', detail: 'Randomized diatonic 7ths' },
    ]
  },
  {
    title: 'Group F: Roman Numeral Progressions',
    desc: 'Track functional changes inside backing loops.',
    levels: [
      { id: 16, name: 'Level 16: Plagal & Authentic Cadences', detail: 'I - IV - V - I chord changes' },
      { id: 17, name: 'Level 17: Classic 4-Chord Pop Loop', detail: 'I - V - vi - IV progressions' },
      { id: 18, name: 'Level 18: Standard Jazz ii - V - I', detail: 'Standard ii - V - I progressions' },
    ]
  },
  {
    title: 'Group G: Secondary Dominants & Modal Interchange',
    desc: 'Advanced voice-leading transitions.',
    levels: [
      { id: 19, name: 'Level 19: Secondary Dominants', detail: 'V/V and V/vi transitions' },
      { id: 20, name: 'Level 20: Modal Interchange', detail: 'Borrowed minor iv and bVI chords' },
      { id: 21, name: 'Level 21: Mixed Advanced Cadences', detail: 'Neapolitan & Augmented 6th chords' },
    ]
  },
  {
    title: 'Group H: Melodic Dictation - Diatonic',
    desc: 'Listen and write down diatonic melodic phrases.',
    levels: [
      { id: 22, name: 'Level 22: Stepwise Melodies', detail: 'Melodies on scale degrees 1 to 5' },
      { id: 23, name: 'Level 23: Diatonic Leaps', detail: 'Melodies with triads leaps (1-3-5-8)' },
      { id: 24, name: 'Level 24: Complete Diatonic Melody', detail: 'Full diatonic melodies (degrees 1-7)' },
    ]
  },
  {
    title: 'Group I: Melodic Dictation - Chromatic',
    desc: 'The ultimate pitch challenge - write advanced chromatic melodies.',
    levels: [
      { id: 25, name: 'Level 25: Passing Chromatics', detail: 'Melodies with chromatic passing tones' },
      { id: 26, name: 'Level 26: Modulation Melodies', detail: 'Melodies that modulate to relative keys' },
      { id: 27, name: 'Level 27: Free Chromaticism Dictation', detail: 'Complex chromatic leaps' },
    ]
  }
];

export default function DifficultyScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const handleSelectLevel = (levelId: number) => {
    log.info(`Level Selected: Launching training level #${levelId}`);
    router.push({
      pathname: '/trainer',
      params: { level: levelId }
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header navigation bar */}
        <View style={styles.headerBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <IconArrowLeft size={18} color="#C2C7CF" />
          </Pressable>
          <Text style={styles.screenTitle}>Select Trainer Level</Text>
        </View>

        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            isLandscape && styles.scrollContentLandscape
          ]} 
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.introText}>
            Progress through the 9 progressive training groups below. To begin, let's play the first levels!
          </Text>

          <View style={[styles.grid, isLandscape && styles.gridLandscape]}>
            {LEVEL_GROUPS.map((group, groupIdx) => (
              <View 
                key={groupIdx} 
                style={[
                  styles.groupCard, 
                  isLandscape && styles.groupCardLandscape
                ]}
              >
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <Text style={styles.groupDesc}>{group.desc}</Text>
              </View>

              <View style={styles.levelsList}>
                {group.levels.map((lvl) => {
                  const isInteractive = lvl.id <= 6; // Levels 1-6 are implemented
                  return (
                    <Pressable
                      key={lvl.id}
                      style={({ pressed }) => [
                        styles.levelItem,
                        !isInteractive && styles.levelItemDisabled,
                        pressed && isInteractive && styles.levelItemPressed
                      ]}
                      disabled={!isInteractive}
                      onPress={() => handleSelectLevel(lvl.id)}
                    >
                      <View style={styles.levelMeta}>
                        <Text style={[styles.levelName, !isInteractive && styles.textDisabled]}>
                          {lvl.name}
                        </Text>
                        <Text style={[styles.levelDetail, !isInteractive && styles.textDisabled]}>
                          {lvl.detail}
                        </Text>
                      </View>
                      
                      <View style={isInteractive ? styles.activeIndicator : styles.lockedIndicator}>
                        {isInteractive ? (
                          <IconPlay size={10} color="#0A305F" />
                        ) : (
                          <IconWrench size={12} color="#8A92A6" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          </View>
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111318', // Material 3 Dark Background
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: '#111318',
  },
  backBtn: {
    padding: 8,
    borderRadius: 100,
    backgroundColor: '#1D2024',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E2E2E6',
    marginLeft: 16,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  scrollContentLandscape: {
    padding: 20,
    gap: 20,
    alignItems: 'center',
  },
  introText: {
    fontSize: 14,
    color: '#8A92A6',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  grid: {
    width: '100%',
    gap: 20,
  },
  gridLandscape: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    maxWidth: 960,
    width: '100%',
  },
  groupCard: {
    backgroundColor: '#1D2024', // Material 3 Card Container
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  groupCardLandscape: {
    width: '48.5%',
  },
  groupHeader: {
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingBottom: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#A8C7FA', // Material 3 Primary Light Accent
  },
  groupDesc: {
    fontSize: 12,
    color: '#8A92A6',
    lineHeight: 16,
  },
  levelsList: {
    gap: 10,
  },
  levelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  levelItemDisabled: {
    opacity: 0.35,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderColor: 'transparent',
  },
  levelItemPressed: {
    backgroundColor: 'rgba(168, 199, 250, 0.08)',
    borderColor: 'rgba(168, 199, 250, 0.2)',
  },
  levelMeta: {
    flex: 1,
    gap: 2,
    paddingRight: 10,
  },
  levelName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E2E6',
  },
  levelDetail: {
    fontSize: 11,
    color: '#8A92A6',
  },
  activeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#A8C7FA', // M3 Primary
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textDisabled: {
    color: '#434753',
  },
});
