import React, { useState, useCallback } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, LayoutAnimation, StyleSheet, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { IconButton } from '../../components/ui/IconButton';
import { getProgress, setProgress as saveProgress } from '../../storage/gameStorage';
import { GameProgress } from '../../types/game.types';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeMode } from '../../theme/types';
import Svg, { Path, Circle } from 'react-native-svg';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { mode, theme, setMode } = useTheme();
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [showPalette, setShowPalette] = useState(false);

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

  const handleTogglePalette = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowPalette(!showPalette);
  };

  if (!progress) return null;

  const cardBg = mode === 'dark' ? 'rgba(24, 24, 27, 0.9)' : 'rgba(255, 255, 255, 0.92)';

  return (
    <ScreenContainer useBackgroundImage={true} overlayOpacity={0.4}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingBottom: 16, paddingHorizontal: 8 }}>
        <IconButton 
          icon="back" 
          onPress={() => navigation.goBack()} 
          iconColor="#FFFFFF"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 22 }}
        />
        <Image
          source={require('../../assets/settingButton.png')}
          style={{ width: 36, height: 36, marginLeft: 14, marginRight: 8 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
          Settings
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingTop: 12 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Main Settings Group */}
        <View style={{ backgroundColor: cardBg, borderRadius: 20, marginBottom: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider, marginLeft: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginRight: 16 }}>🔊</Text>
              <Text style={{ fontSize: 18, fontWeight: '500', color: theme.primaryText }}>Sound</Text>
            </View>
            <Switch 
              value={progress.soundEnabled} 
              onValueChange={(val) => toggleSetting('soundEnabled', val)}
              trackColor={{ false: theme.disabledState, true: theme.primaryText }}
              thumbColor={theme.appBackground}
              style={{ marginRight: 20 }}
            />
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider, marginLeft: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginRight: 16 }}>📳</Text>
              <Text style={{ fontSize: 18, fontWeight: '500', color: theme.primaryText }}>Vibration</Text>
            </View>
            <Switch 
              value={progress.hapticsEnabled} 
              onValueChange={(val) => toggleSetting('hapticsEnabled', val)}
              trackColor={{ false: theme.disabledState, true: theme.primaryText }}
              thumbColor={theme.appBackground}
              style={{ marginRight: 20 }}
            />
          </View>

          <TouchableOpacity 
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, marginLeft: 20 }}
            onPress={handleTogglePalette}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginRight: 16 }}>🎨</Text>
              <Text style={{ fontSize: 18, fontWeight: '500', color: theme.primaryText }}>Color Palette</Text>
            </View>
            <Text style={{ color: theme.primaryText, fontSize: 24, fontWeight: '300', marginRight: 20, transform: [{ rotate: showPalette ? '90deg' : '0deg' }] }}>
              ›
            </Text>
          </TouchableOpacity>

          {showPalette && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.divider, justifyContent: 'space-around', paddingBottom: 8 }}>
              
              <View style={{ alignItems: 'center', gap: 8 }}>
                <TouchableOpacity 
                  onPress={() => toggleTheme('dark')}
                  style={{ width: 80, height: 100, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: mode === 'dark' ? theme.primaryText : 'transparent', backgroundColor: '#000000', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                >
                  <View style={{ width: '80%', height: '40%', backgroundColor: '#111111', borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#333333' }} />
                  <View style={{ width: '60%', height: 4, backgroundColor: '#ffffff', borderRadius: 2, marginBottom: 4 }} />
                  <View style={{ width: '40%', height: 4, backgroundColor: '#a3a3a3', borderRadius: 2 }} />
                  {mode === 'dark' && (
                    <View style={{ position: 'absolute', bottom: -8, right: -8, backgroundColor: theme.primaryText, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.appBackground} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M20 6L9 17l-5-5" />
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.primaryText, marginTop: 8 }}>Dark Mode</Text>
              </View>

              <View style={{ width: 1, height: 40, backgroundColor: theme.divider }} />

              <View style={{ alignItems: 'center', gap: 8 }}>
                <TouchableOpacity 
                  onPress={() => toggleTheme('white')}
                  style={{ width: 80, height: 100, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: mode === 'white' ? theme.primaryText : 'transparent', backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                >
                  <View style={{ width: '80%', height: '40%', backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e5e5e5' }} />
                  <View style={{ width: '60%', height: 4, backgroundColor: '#000000', borderRadius: 2, marginBottom: 4 }} />
                  <View style={{ width: '40%', height: 4, backgroundColor: '#525252', borderRadius: 2 }} />
                  {mode === 'white' && (
                    <View style={{ position: 'absolute', bottom: -8, right: -8, backgroundColor: theme.primaryText, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.appBackground} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M20 6L9 17l-5-5" />
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.primaryText, marginTop: 8 }}>White Mode</Text>
              </View>

            </View>
          )}
        </View>

        {/* Action Group 1 */}
        <View style={{ backgroundColor: cardBg, borderRadius: 20, marginBottom: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}>
          <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginRight: 16 }}>👤</Text>
              <Text style={{ fontSize: 18, fontWeight: '500', color: theme.primaryText }}>Save Your Progress</Text>
            </View>
            <Text style={{ color: theme.primaryText, fontSize: 24, fontWeight: '300', marginRight: 8 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Action Group 2 */}
        <View style={{ backgroundColor: cardBg, borderRadius: 20, marginBottom: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}>
          <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginRight: 16 }}>👍</Text>
              <Text style={{ fontSize: 18, fontWeight: '500', color: theme.primaryText }}>Rate Us</Text>
            </View>
            <Text style={{ color: theme.primaryText, fontSize: 24, fontWeight: '300', marginRight: 8 }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginRight: 16 }}>💬</Text>
              <Text style={{ fontSize: 18, fontWeight: '500', color: theme.primaryText }}>Feedback</Text>
            </View>
            <Text style={{ color: theme.primaryText, fontSize: 24, fontWeight: '300', marginRight: 8 }}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
};
