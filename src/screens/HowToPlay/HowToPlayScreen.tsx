import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { IconButton } from '../../components/ui/IconButton';
import { ImageButton } from '../../components/ui/ImageButton';
import { Button } from '../../components/ui/Button';
import { getProgress } from '../../storage/gameStorage';
import { getNextIncompleteLevel } from '../../game/logic/levelLogic';

type RootStackParamList = {
  Home: undefined;
  Game: { levelId: number };
  HowToPlay: undefined;
};

type HowToPlayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HowToPlay'>;

export const HowToPlayScreen: React.FC = () => {
  const navigation = useNavigation<HowToPlayNavigationProp>();

  const handlePlayNow = async () => {
    const progress = await getProgress();
    const targetLevel = getNextIncompleteLevel(progress, 100);
    navigation.navigate('Game', { levelId: targetLevel });
  };

  return (
    <ScreenContainer useBackgroundImage={true} overlayOpacity={0.4} style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="back"
          onPress={() => navigation.goBack()}
          iconColor="#FFFFFF"
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>HOW TO PLAY</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>GAME RULES & GUIDE</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>1</Text>
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Move the Arrows</Text>
            <Text style={styles.cardDescription}>
              Tap an arrow to send it flying forward. The arrow travels continuously along its path until it completely leaves the grid!
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.iconText}>2</Text>
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Avoid Collisions</Text>
            <Text style={styles.cardDescription}>
              Arrows cannot pass through stationary arrows. If an arrow's flight path is blocked, it shakes and you lose 1 water drop!
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: '#22c55e' }]}>
            <Text style={styles.iconText}>3</Text>
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Clear the Board</Text>
            <Text style={styles.cardDescription}>
              Carefully find the correct sequence to free all arrows. Keep all your drops to earn a perfect 3-star rating!
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.iconText}>💡</Text>
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Use Helpful Hints</Text>
            <Text style={styles.cardDescription}>
              Stuck on a tricky maze? Tap the lightbulb hint icon on the bottom right to illuminate the next arrow with a clear path.
            </Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <ImageButton
            source={require('../../assets/playbutton.png')}
            onPress={handlePlayNow}
            aspectRatio={2111 / 745}
            maxWidth={260}
            accessibilityLabel="Play Game Now"
            style={styles.playButton}
          />
          <Button
            title="GOT IT, RETURN HOME"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.returnButton}
            textClassName="text-white"
          />
        </View>
      </ScrollView>
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
    paddingVertical: 12,
    marginTop: 8,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  badgeContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  playButton: {
    marginBottom: 12,
  },
  returnButton: {
    paddingVertical: 10,
  },
});
