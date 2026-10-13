import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { GameLogo } from '../../components/icons/GameLogo';
import { SettingsButton } from '../../components/buttons/SettingsButton';
import { LevelProgressCard } from '../../components/cards/LevelProgressCard';
import { getProgress } from '../../storage/gameStorage';
import { GameProgress } from '../../types/game.types';
import { getNextIncompleteLevel } from '../../game/logic/levelLogic';
import { ImageButton } from '../../components/ui/ImageButton';

type RootStackParamList = {
  Home: undefined;
  LevelSelect: undefined;
  Game: { levelId: number };
  Settings: undefined;
  HowToPlay: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [progress, setProgress] = useState<GameProgress | null>(null);

  const loadProgress = useCallback(async () => {
    const data = await getProgress();
    setProgress(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const handlePlay = useCallback(() => {
    if (progress) {
      const targetLevel = getNextIncompleteLevel(progress, 100);
      navigation.navigate('Game', { levelId: targetLevel });
    }
  }, [progress, navigation]);

  const handleHowToPlay = useCallback(() => {
    navigation.navigate('HowToPlay');
  }, [navigation]);

  const handleSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  if (!progress) {
    return (
      <ScreenContainer useBackgroundImage={true} centered>
        <GameLogo />
      </ScreenContainer>
    );
  }

  const activeLevel = getNextIncompleteLevel(progress, 100);

  return (
    <ScreenContainer useBackgroundImage={true} overlayOpacity={0} style={styles.screen}>
      {/* Header: Horizontal Logo + Settings Button */}
      <View style={styles.header}>
        <GameLogo horizontal={true} />
        <SettingsButton onPress={handleSettings} size={48} />
      </View>

      {/* Current Puzzle Card */}
      <View style={styles.cardContainer}>
        <LevelProgressCard currentLevel={activeLevel} totalLevels={100} />
      </View>

      {/* Scenic Spacer letting the tropical artwork breathe */}
      <View style={styles.scenicSpacer} />

      {/* Bottom Buttons: Play and How to Play resting above wooden dock */}
      <View style={styles.bottomSection}>
        <ImageButton 
          source={require('../../assets/playbutton.png')}
          aspectRatio={2111 / 745}
          maxWidth={320}
          width="88%"
          onPress={handlePlay}
          accessibilityLabel="Play Game"
        />
        <View style={styles.secondaryAction}>
          <ImageButton 
            source={require('../../assets/howPlayButton.png')}
            aspectRatio={2027 / 776}
            maxWidth={275}
            width="76%"
            onPress={handleHowToPlay}
            accessibilityLabel="How to Play"
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  cardContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  scenicSpacer: {
    flex: 1,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 16,
  },
  secondaryAction: {
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
  },
});


