import React, { useState, useCallback } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Line, Pattern, Rect, Defs, Circle, Path } from 'react-native-svg';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { IconButton } from '../../components/ui/IconButton';
import { PaperCard } from '../../components/cards/PaperCard';
import { PaperButton } from '../../components/buttons/PaperButton';
import { Modal } from '../../components/ui/Modal';
import { getProgress, setProgress as saveProgress, resetProgress } from '../../storage/gameStorage';
import { GameProgress } from '../../types/game.types';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeMode } from '../../theme/types';

/**
 * Sun & Moon Paper Cut-Out Switch
 * Day: Golden paper sun cut-out
 * Night: Origami crescent moon and star
 */
const SunMoonSwitch = ({ mode, onToggle, theme }: { mode: 'white' | 'dark'; onToggle: (m: ThemeMode) => void; theme: any }) => {
  return (
    <View style={styles.sunMoonContainer}>
      <TouchableOpacity
        onPress={() => onToggle('white')}
        style={[
          styles.switchTab,
          mode === 'white' && styles.switchTabActive,
          {
            backgroundColor: mode === 'white' ? theme.surface : 'transparent',
            borderColor: mode === 'white' ? theme.primary : 'transparent',
          },
        ]}
        activeOpacity={0.8}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={6} fill={mode === 'white' ? theme.primary : theme.mutedText} />
          <Path
            d="M 12 2 L 12 4 M 12 20 L 12 22 M 2 12 L 4 12 M 20 12 L 22 12 M 5 5 L 6.5 6.5 M 17.5 17.5 L 19 19 M 5 19 L 6.5 17.5 M 17.5 6.5 L 19 5"
            stroke={mode === 'white' ? theme.primary : theme.mutedText}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
        <Text style={[styles.switchTabText, { color: mode === 'white' ? theme.primaryText : theme.mutedText }]}>
          Washi Day
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onToggle('dark')}
        style={[
          styles.switchTab,
          mode === 'dark' && styles.switchTabActive,
          {
            backgroundColor: mode === 'dark' ? theme.surface : 'transparent',
            borderColor: mode === 'dark' ? theme.primary : 'transparent',
          },
        ]}
        activeOpacity={0.8}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path
            d="M 15 4 C 10 5 6 10 7 16 C 8 20 12 23 17 22 C 11 22 7 17 7 11 C 7 6 11 4 15 4 Z"
            fill={mode === 'dark' ? theme.primary : theme.mutedText}
          />
        </Svg>
        <Text style={[styles.switchTabText, { color: mode === 'dark' ? theme.primaryText : theme.mutedText }]}>
          Night Kraft
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { mode, theme, setMode } = useTheme();
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    const data = await getProgress();
    setProgress(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const toggleSetting = useCallback(async (key: 'soundEnabled' | 'hapticsEnabled', value: boolean) => {
    if (progress) {
      const newProgress = { ...progress, [key]: value };
      setProgress(newProgress);
      await saveProgress(newProgress);
    }
  }, [progress]);

  const toggleTheme = useCallback(async (newMode: ThemeMode) => {
    if (progress) {
      const newProgress = { ...progress, theme: newMode };
      setProgress(newProgress);
      setMode(newMode);
      await saveProgress(newProgress);
    }
  }, [progress, setMode]);

  const handleResetConfirm = useCallback(async () => {
    setShowResetModal(false);
    await resetProgress(true);
    await loadProgress();
    setResetSuccessMessage('Progress successfully reset to Level 1');
    setTimeout(() => {
      setResetSuccessMessage(null);
    }, 3500);
  }, [loadProgress]);

  if (!progress) return null;

  return (
    <ScreenContainer style={styles.container}>
      {/* Notebook Ruled-Line Faint Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="notebookLines" width="100%" height="28" patternUnits="userSpaceOnUse">
              <Line x1="0" y1="28" x2="100%" y2="28" stroke={theme.crease} strokeWidth="1" opacity={0.4} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#notebookLines)" />
        </Svg>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="back"
          onPress={() => navigation.goBack()}
          iconColor={theme.primaryText}
          style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        />
        <Text style={[styles.headerTitle, { color: theme.primaryText }]}>CRAFT NOTEBOOK</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Audio & Haptics (Paper Pull-Tabs) */}
        <Text style={[styles.sectionHeading, { color: theme.primary }]}>PHYSICAL SENSATIONS</Text>

        <PaperCard dogEar={true} radiusSize="md" style={styles.settingsCard}>
          {/* Sound Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.labelCol}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Paper Swish Sounds</Text>
              <Text style={[styles.settingSub, { color: theme.mutedText }]}>Soft sliding paper fold audio</Text>
            </View>
            <Switch
              value={progress.soundEnabled}
              onValueChange={val => toggleSetting('soundEnabled', val)}
              trackColor={{ false: theme.disabledState, true: theme.primary }}
              thumbColor={theme.surface}
            />
          </View>

          <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />

          {/* Haptics Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.labelCol}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Tactile Haptics</Text>
              <Text style={[styles.settingSub, { color: theme.mutedText }]}>Gentle cardstock tap vibration</Text>
            </View>
            <Switch
              value={progress.hapticsEnabled}
              onValueChange={val => toggleSetting('hapticsEnabled', val)}
              trackColor={{ false: theme.disabledState, true: theme.primary }}
              thumbColor={theme.surface}
            />
          </View>
        </PaperCard>

        {/* Section 2: Color Palette (Sun / Moon Switch) */}
        <Text style={[styles.sectionHeading, { color: theme.primary, marginTop: 22 }]}>PAPER SHADE</Text>

        <PaperCard dogEar={false} radiusSize="md" style={styles.settingsCard}>
          <Text style={[styles.settingSub, { color: theme.mutedText, marginBottom: 12 }]}>
            Choose between warm handmade day washi and deep night kraft paper.
          </Text>
          <SunMoonSwitch mode={mode} onToggle={toggleTheme} theme={theme} />
        </PaperCard>

        {/* Section 3: Game Information */}
        <Text style={[styles.sectionHeading, { color: theme.primary, marginTop: 22 }]}>ABOUT THIS CRAFT</Text>

        <PaperCard dogEar={false} radiusSize="md" style={styles.settingsCard}>
          <View style={styles.infoRow}>
            <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Total Crafted Puzzles</Text>
            <Text style={[styles.infoValue, { color: theme.primary }]}>Unlimited Levels</Text>
          </View>
          <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Origami Engine</Text>
            <Text style={[styles.infoValue, { color: theme.primaryText }]}>v1.0 Paper Edition</Text>
          </View>
        </PaperCard>

        {/* Section 4: Progress & Reset */}
        <Text style={[styles.sectionHeading, { color: theme.primary, marginTop: 22 }]}>SAVED PROGRESS</Text>

        <PaperCard dogEar={false} radiusSize="md" style={styles.settingsCard}>
          <View style={styles.infoRow}>
            <View style={styles.labelCol}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Current Journey</Text>
              <Text style={[styles.settingSub, { color: theme.mutedText }]}>
                {progress.completedLevels?.length || 0} puzzles folded & completed
              </Text>
            </View>
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: mode === 'dark' ? 'rgba(235, 172, 70, 0.15)' : 'rgba(217, 85, 43, 0.12)',
                  borderColor: theme.primary,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: theme.primary }]}>Level {progress.currentLevel}</Text>
            </View>
          </View>

          {resetSuccessMessage && (
            <View
              style={[
                styles.successNotice,
                {
                  backgroundColor: mode === 'dark' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.12)',
                  borderColor: theme.success,
                },
              ]}
            >
              <Text style={[styles.successNoticeText, { color: theme.success }]}>
                ✓ {resetSuccessMessage}
              </Text>
            </View>
          )}

          <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />

          <Text style={[styles.settingSub, { color: theme.mutedText, marginBottom: 14 }]}>
            Resetting your journey will restore your craft notebook to Level 1 and clear your solved puzzle history. Your sound and theme settings will be preserved.
          </Text>

          <PaperButton
            title="Reset Progress"
            variant="danger"
            fullWidth
            radiusSize="md"
            onPress={() => setShowResetModal(true)}
            icon={
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  stroke="#FFFFFF"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
          />
        </PaperCard>

        {/* Stamped craft footer */}
        <View style={styles.footerStamp}>
          <Svg width={14} height={14} viewBox="0 0 24 24" style={{ marginRight: 6 }}>
            <Path d="M 12 2 L 15 9 L 22 9 L 17 14 L 19 21 L 12 17 L 5 21 L 7 14 L 2 9 L 9 9 Z" fill={theme.primary} />
          </Svg>
          <Text style={[styles.footerText, { color: theme.mutedText }]}>
            Arrow Amaze Go • Handcrafted Origami
          </Text>
        </View>
      </ScrollView>

      {/* Reset Confirmation Modal */}
      <Modal visible={showResetModal} onClose={() => setShowResetModal(false)} position="center">
        <View style={styles.modalContent}>
          <View
            style={[
              styles.modalIconWrap,
              {
                backgroundColor: mode === 'dark' ? 'rgba(211, 47, 47, 0.2)' : 'rgba(211, 47, 47, 0.12)',
                borderColor: theme.error,
              },
            ]}
          >
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke={theme.error}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>

          <Text style={[styles.modalTitle, { color: theme.primaryText }]}>Reset All Progress?</Text>

          <Text style={[styles.modalMessage, { color: theme.mutedText }]}>
            This will permanently rewind your craft notebook back to{' '}
            <Text style={{ fontWeight: 'bold', color: theme.primaryText }}>Level 1</Text> and clear all{' '}
            <Text style={{ fontWeight: 'bold', color: theme.primaryText }}>{progress.completedLevels?.length || 0}</Text>{' '}
            completed puzzle stamps.
          </Text>

          <Text style={[styles.modalSubMessage, { color: theme.error }]}>
            This action cannot be undone.
          </Text>

          <View style={styles.modalActionGroup}>
            <PaperButton
              title="Yes, Reset Progress"
              variant="danger"
              fullWidth
              radiusSize="md"
              onPress={handleResetConfirm}
              style={{ marginBottom: 10 }}
            />
            <PaperButton
              title="Keep Progress"
              variant="secondary"
              fullWidth
              radiusSize="md"
              onPress={() => setShowResetModal(false)}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 16,
    zIndex: 10,
  },
  backBtn: {
    borderRadius: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  labelCol: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  sunMoonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  switchTabActive: {
    borderTopWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  switchTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successNotice: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    alignItems: 'center',
  },
  successNoticeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  modalContent: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubMessage: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 22,
  },
  modalActionGroup: {
    width: '100%',
    marginTop: 4,
  },
});
