import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Rect, Circle, Line, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { IconButton } from '../../components/ui/IconButton';
import { PaperButton } from '../../components/buttons/PaperButton';
import { PaperCard } from '../../components/cards/PaperCard';
import { WaterDrop } from '../../components/icons/WaterDrop';
import { OrigamiStar } from '../../components/ui/StarsDisplay';
import { getProgress } from '../../storage/gameStorage';
import { getNextIncompleteLevel } from '../../game/logic/levelLogic';
import { useTheme } from '../../theme/ThemeContext';

type RootStackParamList = {
  Home: undefined;
  Game: { levelId: number };
  HowToPlay: undefined;
};

type HowToPlayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HowToPlay'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_WIDTH = SCREEN_WIDTH - 32;

/**
 * Animated Looped Demos for each booklet page
 */

// Demo 1: Arrow sliding off board
const DemoSlideLaunch = ({ theme, mode }: { theme: any; mode: any }) => {
  const transX = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    transX.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 600 }),
        withTiming(110, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(110, { duration: 400 }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100 }),
        withTiming(0, { duration: 400 }),
        withTiming(1, { duration: 400 }),
      ),
      -1,
      false,
    );
  }, [transX, opacity]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: transX.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.demoBoardContainer}>
      <PaperCard dogEar={false} radiusSize="md" style={styles.miniBoard}>
        {/* Faint fold lines */}
        <Svg width={180} height={120} viewBox="0 0 180 120">
          <Line x1="60" y1="0" x2="60" y2="120" stroke={theme.crease} strokeWidth="1" strokeDasharray="3 3" />
          <Line x1="120" y1="0" x2="120" y2="120" stroke={theme.crease} strokeWidth="1" strokeDasharray="3 3" />
          <Line x1="0" y1="60" x2="180" y2="60" stroke={theme.crease} strokeWidth="1" strokeDasharray="3 3" />
        </Svg>

        {/* Animated gliding arrow */}
        <Animated.View style={[styles.demoArrowPosition, arrowStyle]}>
          <Svg width={54} height={24} viewBox="0 0 54 24">
            <Path d="M 0 12 L 36 12" stroke={theme.arrow} strokeWidth={8} strokeLinecap="round" />
            <Path d="M 32 4 L 48 12 L 32 20 Z" fill={theme.arrow} />
            <Path d="M 32 12 L 48 12" stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
          </Svg>
        </Animated.View>
      </PaperCard>
    </View>
  );
};

// Demo 2: Blocked arrow flutter shake with red ink X
const DemoBlockedFlutter = ({ theme }: { theme: any }) => {
  const shakeX = useSharedValue(0);
  const stampOpacity = useSharedValue(0);

  React.useEffect(() => {
    shakeX.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 800 }),
        withTiming(6, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
        withTiming(0, { duration: 800 }),
      ),
      -1,
      false,
    );
    stampOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 800 }),
        withTiming(1, { duration: 100 }),
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 200 }),
        withTiming(0, { duration: 400 }),
      ),
      -1,
      false,
    );
  }, [shakeX, stampOpacity]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const stampStyle = useAnimatedStyle(() => ({
    opacity: stampOpacity.value,
  }));

  return (
    <View style={styles.demoBoardContainer}>
      <PaperCard dogEar={false} radiusSize="md" style={styles.miniBoard}>
        {/* Stationary obstacle arrow */}
        <View style={{ position: 'absolute', right: 30, top: 40 }}>
          <Svg width={24} height={48} viewBox="0 0 24 48">
            <Path d="M 12 48 L 12 12" stroke={theme.mutedText} strokeWidth={8} strokeLinecap="round" />
            <Path d="M 4 16 L 12 0 L 20 16 Z" fill={theme.mutedText} />
          </Svg>
        </View>

        {/* Shaking blocked arrow */}
        <Animated.View style={[{ position: 'absolute', left: 30, top: 50 }, shakeStyle]}>
          <Svg width={54} height={24} viewBox="0 0 54 24">
            <Path d="M 0 12 L 36 12" stroke={theme.error} strokeWidth={8} strokeLinecap="round" />
            <Path d="M 32 4 L 48 12 L 32 20 Z" fill={theme.error} />
          </Svg>
        </Animated.View>

        {/* Popping red ink stamp X */}
        <Animated.View style={[{ position: 'absolute', left: 66, top: 44 }, stampStyle]}>
          <Svg width={28} height={28} viewBox="0 0 28 28">
            <Line x1="6" y1="6" x2="22" y2="22" stroke={theme.hanko} strokeWidth={3.5} strokeLinecap="round" />
            <Line x1="22" y1="6" x2="6" y2="22" stroke={theme.hanko} strokeWidth={3.5} strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </PaperCard>
    </View>
  );
};

// Demo 3: Hanko stamps showcase
const DemoHankoLives = ({ theme }: { theme: any }) => (
  <View style={styles.demoBoardContainer}>
    <PaperCard dogEar={false} radiusSize="md" style={[styles.miniBoard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 }]}>
      <WaterDrop size={34} empty={false} />
      <WaterDrop size={34} empty={false} />
      <WaterDrop size={34} empty={true} />
    </PaperCard>
  </View>
);

// Demo 4: Hint highlighter underline
const DemoHintHighlight = ({ theme }: { theme: any }) => (
  <View style={styles.demoBoardContainer}>
    <PaperCard dogEar={false} radiusSize="md" style={styles.miniBoard}>
      {/* Yellow highlighter underline strip */}
      <View style={[styles.highlighterDemoStrip, { backgroundColor: 'rgba(242, 177, 52, 0.45)', borderColor: theme.warning }]} />
      {/* Stitch trajectory line */}
      <Svg width={180} height={120} viewBox="0 0 180 120" style={StyleSheet.absoluteFill}>
        <Line x1="30" y1="60" x2="160" y2="60" stroke={theme.success} strokeWidth="3" strokeDasharray="5 4" />
      </Svg>
      <View style={{ position: 'absolute', left: 35, top: 48 }}>
        <Svg width={54} height={24} viewBox="0 0 54 24">
          <Path d="M 0 12 L 36 12" stroke={theme.arrow} strokeWidth={8} strokeLinecap="round" />
          <Path d="M 32 4 L 48 12 L 32 20 Z" fill={theme.arrow} />
        </Svg>
      </View>
    </PaperCard>
  </View>
);

export const HowToPlayScreen: React.FC = () => {
  const navigation = useNavigation<HowToPlayNavigationProp>();
  const { theme, mode } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const pages = [
    {
      title: 'Move the Arrows',
      desc: 'Tap an arrow to send it gliding along its crease. As it clears the board, it folds into a paper plane!',
      component: <DemoSlideLaunch theme={theme} mode={mode} />,
    },
    {
      title: 'Avoid Collisions',
      desc: 'Arrows cannot cross stationary pieces. A collision causes a paper flutter shake and loses 1 Hanko stamp!',
      component: <DemoBlockedFlutter theme={theme} />,
    },
    {
      title: 'Hanko Life Stamps',
      desc: 'You start with 3 red Hanko ink stamps. Keep all your stamps to claim a perfect 3-star Origami Certificate!',
      component: <DemoHankoLives theme={theme} />,
    },
    {
      title: 'Highlighter Hints',
      desc: 'Stuck on a tricky labyrinth? Tap the Hint button to illuminate the open path with sewing thread stitches.',
      component: <DemoHintHighlight theme={theme} />,
    },
  ];

  const handlePlayNow = async () => {
    const progress = await getProgress();
    const targetLevel = getNextIncompleteLevel(progress, 10000);
    navigation.navigate('Game', { levelId: targetLevel });
  };

  const handleScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / PAGE_WIDTH);
    if (index >= 0 && index < pages.length) {
      setCurrentPage(index);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="back"
          onPress={() => navigation.goBack()}
          iconColor={theme.primaryText}
          style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        />
        <Text style={[styles.headerTitle, { color: theme.primaryText }]}>ORIGAMI GUIDE</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Horizontal Booklet Pager */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={pages}
          keyExtractor={(_, i) => i.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <View style={[styles.pageWrapper, { width: PAGE_WIDTH }]}>
              <PaperCard dogEar={true} radiusSize="lg" style={styles.bookletPageCard}>
                {/* Page index stamp */}
                <View style={[styles.pageNumberBadge, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <Text style={[styles.pageNumberText, { color: theme.primary }]}>PAGE {index + 1} / 4</Text>
                </View>

                {/* Looped Animated Demo Canvas */}
                {item.component}

                {/* Descriptive Copy */}
                <Text style={[styles.pageTitle, { color: theme.primaryText }]}>{item.title}</Text>
                <Text style={[styles.pageDesc, { color: theme.secondaryText }]}>{item.desc}</Text>
              </PaperCard>
            </View>
          )}
        />
      </View>

      {/* Booklet Dot Indicators (Tiny Paper Circles) */}
      <View style={styles.dotsRow}>
        {pages.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => flatListRef.current?.scrollToIndex({ index: i, animated: true })}
            style={[
              styles.dotCircle,
              {
                backgroundColor: i === currentPage ? theme.primary : theme.disabledState,
                width: i === currentPage ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom Action Button */}
      <View style={styles.bottomAction}>
        <PaperButton
          title={currentPage === 3 ? "Got It, Let's Play!" : "Next Page"}
          variant="primary"
          radiusSize="md"
          fullWidth
          onPress={() => {
            if (currentPage < 3) {
              flatListRef.current?.scrollToIndex({ index: currentPage + 1, animated: true });
            } else {
              handlePlayNow();
            }
          }}
        />
      </View>
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
    paddingBottom: 12,
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
  pageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  bookletPageCard: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  pageNumberBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 16,
  },
  pageNumberText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  demoBoardContainer: {
    width: '100%',
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  miniBoard: {
    width: 200,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  demoArrowPosition: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
  highlighterDemoStrip: {
    position: 'absolute',
    left: 25,
    top: 42,
    width: 80,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  pageDesc: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: 14,
  },
  dotCircle: {
    height: 8,
    borderRadius: 4,
  },
  bottomAction: {
    paddingBottom: 24,
    width: '100%',
  },
});
