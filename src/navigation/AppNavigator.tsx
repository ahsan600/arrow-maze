import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { LevelSelectScreen } from '../screens/LevelSelect/LevelSelectScreen';
import { GameScreen } from '../screens/Game/GameScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { HowToPlayScreen } from '../screens/HowToPlay/HowToPlayScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="LevelSelect" component={LevelSelectScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
