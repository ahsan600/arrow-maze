import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GameLogo } from '../../components/icons/GameLogo';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { getProgress } from '../../storage/gameStorage';

type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
};

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    const initialize = async () => {
      // Just ensure we can read storage and wait for minimal splash time
      await Promise.all([
        new Promise(resolve => setTimeout(() => resolve(true), 1500)), // minimal splash duration
        getProgress(),
      ]);
      
      navigation.replace('Home');
    };

    initialize();
  }, [navigation]);

  return (
    <ScreenContainer centered>
      <GameLogo />
    </ScreenContainer>
  );
};
