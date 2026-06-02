import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, useWindowDimensions, ActivityIndicator, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { IconArrowLeft, IconPlay, IconLock, IconAlert, IconWrench } from '@/components/icons/NativeIcons';
import { log } from '@/utils/logger';
import { useAppData } from '@/hooks/useAppData';
import { EXERCISE_HASHES } from '@/constants/exercises';
import { UserProgressData } from '@/types/storage';

// Definition of the 9 groups of 3 levels (27 levels total)
const LEVEL_STAGES = [
  {
    title: 'Stage A: Scale Degree Ear Training',
    desc: 'Identify individual notes by their position in the major scale.',
    levels: [
      { id: 1, name: 'Level 1: Do Re Mi Fa (Degrees 1–4)', detail: 'Lower tetrachord — C D E F in C major' },
      { id: 2, name: 'Level 2: Sol La Ti Do (Degrees 5–8)', detail: 'Upper tetrachord — G A B C, including the leading tone (7th)' },
      { id: 3, name: 'Level 3: Happy Birthday Melody', detail: 'Full melody dictation — identify each note by scale degree' },
    ]
  },
  {
    title: 'Stage B: Chord Recognition',
    desc: 'Identify I, IV, V chords and hear them in musical context.',
    levels: [
      { id: 4, name: 'Level 4: I · IV · V Chords', detail: 'Pure chord recognition — no melody, root position triads' },
      { id: 5, name: 'Level 5: Chords With Melody', detail: 'Chord recognition with a diatonic melody note on top' },
      { id: 6, name: 'Level 6: Happy Birthday + Chords', detail: 'Full harmonization — identify each chord while the melody plays' },
    ]
  },
  {
    title: 'Stage C: Minor vs Major',
    desc: 'Focus on distinguishing I, IV, V from ii, iii, vi.',
    levels: [
      { id: 7, name: 'Level 7: Minor vs Major Triads', detail: 'Pure chord recognition — distinguishing major and minor' },
      { id: 8, name: 'Level 8: Chords With Melody', detail: 'Chord recognition with a diatonic melody note on top' },
      { id: 9, name: 'Level 9: Real Song Recognition', detail: 'Identify chords from a real song excerpt' },
    ]
  },
  {
    title: 'Stage D: Diminished & Augmented',
    desc: 'Introduce dim and aug triads.',
    levels: [
      { id: 10, name: 'Level 10: Diminished & Augmented Triads', detail: 'Pure chord recognition — dim and aug triads' },
      { id: 11, name: 'Level 11: Chords With Melody', detail: 'Chord recognition with a diatonic melody note on top' },
      { id: 12, name: 'Level 12: Real Song Recognition', detail: 'Identify chords from a real song excerpt' },
    ]
  },
  {
    title: 'Stage E: Suspended Chords',
    desc: 'Introduce sus2 and sus4.',
    levels: [
      { id: 13, name: 'Level 13: Suspended Chords', detail: 'Pure chord recognition — sus2 and sus4' },
      { id: 14, name: 'Level 14: Chords With Melody', detail: 'Chord recognition with a diatonic melody note on top' },
      { id: 15, name: 'Level 15: Real Song Recognition', detail: 'Identify chords from a real song excerpt' },
    ]
  },
  {
    title: 'Stage F: 7th Chords',
    desc: 'Introduce maj7, min7, and dom7.',
    levels: [
      { id: 16, name: 'Level 16: 7th Chords', detail: 'Pure chord recognition — maj7, min7, dom7' },
      { id: 17, name: 'Level 17: Chords With Melody', detail: 'Chord recognition with a diatonic melody note on top' },
      { id: 18, name: 'Level 18: Real Song Recognition', detail: 'Identify chords from a real song excerpt' },
    ]
  }
];

function checkIfUnlocked(levelId: number, progress: UserProgressData, bypassedLevels: number[]): boolean {
  if (levelId === 1) return true;
  if (bypassedLevels.includes(levelId)) return true;
  
  // Find the predecessor level that the user actually has to pass.
  // If the previous level is a structurally locked "real song" level (9, 12, 15, 18),
  // then the unlock condition depends on the level before it (8, 11, 14, 17).
  const prevId = [9, 12, 15, 18].includes(levelId - 1) ? levelId - 2 : levelId - 1;
  if (bypassedLevels.includes(prevId)) return true;
  
  const prevHash = EXERCISE_HASHES[prevId];
  if (!prevHash) return false;
  
  const prevProgress = progress[prevHash];
  return prevProgress ? prevProgress.bestSuccess >= 80 : false;
}

export default function DifficultyScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { appData, loading, reloadData, handleSaveProgress } = useAppData();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      reloadData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleSelectLevel = (levelId: number) => {
    log.info(`Level Selected: Launching training level #${levelId}`);
    router.push({
      pathname: '/trainer',
      params: { level: levelId }
    });
  };

  const [bypassedLevels, setBypassedLevels] = useState<number[]>([]);
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [levelToUnlock, setLevelToUnlock] = useState<number | null>(null);

  const handlePressLevel = (lvlId: number, isInteractive: boolean) => {
    if (isInteractive) {
      handleSelectLevel(lvlId);
    } else {
      setLevelToUnlock(lvlId);
      setUnlockModalVisible(true);
    }
  };

  const handleConfirmUnlock = () => {
    if (levelToUnlock === null) return;
    setUnlockModalVisible(false);
    
    // Add all levels up to levelToUnlock to bypassedLevels in memory
    const newBypassed = [...bypassedLevels];
    for (let i = 1; i <= levelToUnlock; i++) {
      if (!newBypassed.includes(i)) {
        newBypassed.push(i);
      }
    }
    setBypassedLevels(newBypassed);
    handleSelectLevel(levelToUnlock);
    setLevelToUnlock(null);
  };

  if (loading || !appData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#A8C7FA" />
      </View>
    );
  }

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
            Progress through the progressive training stages below. To begin, let's play the first levels!
          </Text>

          <View style={[styles.grid, isLandscape && styles.gridLandscape]}>
            {LEVEL_STAGES.map((stage, stageIdx) => (
              <View 
                key={stageIdx} 
                style={[
                  styles.stageCard, 
                  isLandscape && styles.stageCardLandscape
                ]}
              >
              <View style={styles.stageHeader}>
                <Text style={styles.stageTitle}>{stage.title}</Text>
                <Text style={styles.stageDesc}>{stage.desc}</Text>
              </View>

              <View style={styles.levelsList}>
                {stage.levels.map((lvl) => {
                  const levelHash = EXERCISE_HASHES[lvl.id];
                  const progress = levelHash && appData ? appData.progress[levelHash] : null;
                  const bestScore = progress ? progress.bestSuccess : 0;
                  
                  const isTbd = [9, 12, 15, 18].includes(lvl.id);
                  const isUnlocked = checkIfUnlocked(lvl.id, appData?.progress || {}, bypassedLevels);
                  const isInteractive = lvl.id <= 18 && !isTbd && isUnlocked;
                  return (
                    <Pressable
                      key={lvl.id}
                      style={({ pressed }) => [
                        styles.levelItem,
                        !isInteractive && styles.levelItemDisabled,
                        pressed && isInteractive && styles.levelItemPressed
                      ]}
                      disabled={isTbd}
                      onPress={() => handlePressLevel(lvl.id, isInteractive)}
                    >
                      <View style={styles.levelMeta}>
                        <Text style={[styles.levelName, !isInteractive && styles.textDisabled]}>
                          {lvl.name}
                        </Text>
                        <Text style={[styles.levelDetail, !isInteractive && styles.textDisabled]}>
                          {lvl.detail}
                        </Text>
                      </View>
                      
                      <View style={styles.rightContainer}>
                        {bestScore > 0 && !isTbd && (
                          <Text style={[styles.bestScoreText, !isInteractive && styles.textDisabled]}>
                            Best: {bestScore}%
                          </Text>
                        )}
                        <View style={isInteractive ? styles.activeIndicator : styles.lockedIndicator}>
                          {isInteractive ? (
                            <IconPlay size={10} color="#0A305F" />
                          ) : (
                            isTbd ? (
                              <IconWrench size={12} color="#8A92A6" />
                            ) : (
                              <IconLock size={12} color="#8A92A6" />
                            )
                          )}
                        </View>
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

      {/* Custom Unlock Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={unlockModalVisible}
        onRequestClose={() => {
          setUnlockModalVisible(false);
          setLevelToUnlock(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <IconAlert size={28} color="#E9A117" />
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Unlock Level?</Text>
              <Text style={styles.modalDesc}>
                Level {levelToUnlock} is currently locked. Would you like to bypass the lock and play it?
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setUnlockModalVisible(false);
                  setLevelToUnlock(null);
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleConfirmUnlock}
              >
                <Text style={styles.modalButtonTextPrimary}>Unlock & Play</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  stageCard: {
    backgroundColor: '#1D2024', // Material 3 Card Container
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  stageCardLandscape: {
    width: '48.5%',
  },
  stageHeader: {
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingBottom: 12,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#A8C7FA', // Material 3 Primary Light Accent
  },
  stageDesc: {
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
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bestScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A8C7FA',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 11, 14, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1E2025',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 28,
    maxWidth: 380,
    width: '100%',
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 10,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(233, 161, 23, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E2E2E6',
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: '#9AA0A6',
    lineHeight: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#25282F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalButtonPrimary: {
    backgroundColor: '#E9A117',
  },
  modalButtonTextSecondary: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E2E2E6',
  },
  modalButtonTextPrimary: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0B0E',
  },
});
