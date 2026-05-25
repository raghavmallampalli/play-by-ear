import MidiPlayerDOM from '@/components/MidiPlayerDOM';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrainerScreen() {
  const router = useRouter();
  const { level } = useLocalSearchParams();
  const { width, height } = useWindowDimensions();

  const levelNum = Number(level || 1);
  const [activeTab, setActiveTab] = React.useState<'practice' | 'theory' | 'settings'>('practice');

  const isLandscape = width > height && width >= 600;

  const getHeaderTitle = () => {
    const tabLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    return `Level ${levelNum}: ${tabLabel}`;
  };

  const renderHeaderTab = (tab: 'practice' | 'theory' | 'settings', iconName: any, label: string) => {
    const isActive = activeTab === tab;
    return (
      <Pressable
        onPress={() => setActiveTab(tab)}
        style={[
          styles.segTab,
          isActive && styles.segTabActive
        ]}
      >
        <Ionicons 
          name={iconName} 
          size={16} 
          color={isActive ? '#E2E2E6' : '#8A92A6'} 
        />
        <Text style={[
          styles.segTabText,
          isActive && styles.segTabTextActive
        ]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>

        {/* Header navigation bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={18} color="#C2C7CF" />
            </Pressable>
            <Text style={styles.screenTitle}>
              {isLandscape ? `Level ${levelNum}` : getHeaderTitle()}
            </Text>
          </View>

          {isLandscape && (
            <View style={styles.segmentedControl}>
              {renderHeaderTab('practice', 'musical-notes', 'Practice')}
              {renderHeaderTab('theory', 'book', 'Theory')}
              {renderHeaderTab('settings', 'settings', 'Settings')}
            </View>
          )}
        </View>

        {/* DOM Trainer Component */}
        <View style={styles.playerWrapper}>
          <MidiPlayerDOM 
            mode="trainer" 
            level={levelNum} 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onNextLevel={() => {
              if (levelNum < 27) {
                router.replace({
                  pathname: '/trainer',
                  params: { level: levelNum + 1 }
                });
              } else {
                router.replace('/difficulty');
              }
            }}
          />
        </View>

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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: '#111318',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1E222B',
    borderRadius: 14,
    padding: 4,
    gap: 6,
    alignItems: 'center',
  },
  segTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    gap: 8,
  },
  segTabActive: {
    backgroundColor: '#2D3342',
  },
  segTabText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8A92A6',
  },
  segTabTextActive: {
    color: '#E2E2E6',
  },
  playerWrapper: {
    flex: 1,
    alignSelf: 'stretch',
  },
});
