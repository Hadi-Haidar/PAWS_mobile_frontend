import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

// Robot Configuration
const ROBOT_WIDTH = 40;
const TRACK_PADDING = 0; // Removed padding

export default function AiLine() {
    const translateX = useSharedValue(0);
    const floatY = useSharedValue(0);
    const eyeBlink = useSharedValue(1);
    const rotation = useSharedValue(0); // Re-introduced rotation
    const [containerWidth, setContainerWidth] = useState(0);

    const onLayout = (e) => {
        setContainerWidth(e.nativeEvent.layout.width);
    };

    const moveDistance = containerWidth > 0 ? containerWidth - ROBOT_WIDTH : 0;

    useEffect(() => {
        if (moveDistance <= 0) return;

        const HALF_MOVE_DURATION = 2000;
        const SPIN_DURATION = 1000;
        const END_WAIT_DURATION = 2000;
        const halfDistance = moveDistance / 2;

        // 1. Explicit Sequence: Move Half -> Wait (Spin) -> Move End -> Wait -> Return...
        translateX.value = withRepeat(
            withSequence(
                // Forward Leg
                withTiming(halfDistance, { duration: HALF_MOVE_DURATION, easing: Easing.inOut(Easing.ease) }),
                withDelay(SPIN_DURATION, withTiming(halfDistance, { duration: 0 })), // Wait for spin
                withTiming(moveDistance, { duration: HALF_MOVE_DURATION, easing: Easing.inOut(Easing.ease) }),
                withDelay(END_WAIT_DURATION, withTiming(moveDistance, { duration: 0 })), // Wait at end

                // Return Leg
                withTiming(halfDistance, { duration: HALF_MOVE_DURATION, easing: Easing.inOut(Easing.ease) }),
                withDelay(SPIN_DURATION, withTiming(halfDistance, { duration: 0 })), // Wait for spin
                withTiming(0, { duration: HALF_MOVE_DURATION, easing: Easing.inOut(Easing.ease) }),
                withDelay(END_WAIT_DURATION, withTiming(0, { duration: 0 })) // Wait at start
            ),
            -1, // Infinite
            false // No auto-reverse
        );

        // 2. Rotation Sequence (Synchronized)
        // Reset rotation to 0 at start of each spin for simplicity, or continuous?
        // Continuous is better. 0->360, 360->720...
        // But reset is easier to manage.
        // Seq: Wait(MoveHalf) -> Spin(0-360) -> Wait(MoveHalf + EndWait + ReturnMoveHalf) -> Spin(360-720? or 0-360) 

        // Let's us simple 0->360 spin for both times.
        const spinSeq = withSequence(
            withTiming(360, { duration: SPIN_DURATION, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 0 }) // Instant Reset to 0
        );

        rotation.value = withRepeat(
            withSequence(
                withDelay(HALF_MOVE_DURATION, spinSeq), // Spin 1 timing
                withDelay(HALF_MOVE_DURATION + END_WAIT_DURATION + HALF_MOVE_DURATION, spinSeq), // Spin 2 timing
                withDelay(HALF_MOVE_DURATION + END_WAIT_DURATION, withTiming(0, { duration: 0 })) // Padding for loop end
            ),
            -1,
            false
        );

    }, [moveDistance]);

    // Float and Blink can run immediately
    useEffect(() => {
        // 2. Floating/Bobbing Effect
        floatY.value = withRepeat(
            withSequence(
                withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // 3. Eye Blinking
        eyeBlink.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 3000 }),
                withTiming(0.2, { duration: 100 }),
                withTiming(1, { duration: 100 })
            ),
            -1,
            false
        );

        return () => {
            cancelAnimation(translateX);
            cancelAnimation(floatY);
            cancelAnimation(eyeBlink);
            cancelAnimation(rotation);
        };
    }, []);

    const rRobotStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: floatY.value },
                { rotateZ: `${rotation.value}deg` }
            ]
        };
    });

    const rEyeStyle = useAnimatedStyle(() => {
        return {
            opacity: eyeBlink.value,
            transform: [{ scaleY: eyeBlink.value }]
        };
    });

    return (
        <View style={styles.container} onLayout={onLayout}>
            {/* The AI Robot Character */}
            <Animated.View style={[styles.robotWrapper, rRobotStyle]}>
                {/* Antenna */}
                <View style={styles.antennaGroup}>
                    <View style={styles.antennaStick} />
                    <View style={styles.antennaBall} />
                </View>

                {/* Head */}
                <View style={styles.head}>
                    <View style={styles.face}>
                        <Animated.View style={[styles.eye, styles.eyeLeft, rEyeStyle]} />
                        <Animated.View style={[styles.eye, styles.eyeRight, rEyeStyle]} />
                    </View>
                </View>

                {/* Body/Propulsion */}
                <View style={styles.body}>
                    {/* Engine Glow */}
                    <View style={styles.engineGlow} />
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, // Take available width
        height: 50, // Enough height for robot
        justifyContent: 'center',
        paddingHorizontal: 0,
        // Removed margins to fit in header
    },
    trackContainer: {
        position: 'absolute',
        left: TRACK_PADDING,
        right: TRACK_PADDING,
        height: 2,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        top: '60%', // Align track lower so robot floats above/on it
    },
    trackLine: {
        flex: 1,
        backgroundColor: '#000', // Strong black line
        height: 2,
        borderRadius: 1,
    },
    dot: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#000',
        transform: [{ translateX: -3 }, { translateY: 0 }], // Center on line
        top: -2
    },
    robotWrapper: {
        width: ROBOT_WIDTH,
        alignItems: 'center',
        // Visual debugging: backgroundColor: 'rgba(255,0,0,0.1)',
    },
    antennaGroup: {
        alignItems: 'center',
        marginBottom: -2,
        zIndex: 10,
    },
    antennaStick: {
        width: 2,
        height: 8,
        backgroundColor: '#000',
    },
    antennaBall: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF6B00', // Pop color (Primary)
        marginTop: -8, // Place on top of stick
        borderWidth: 1,
        borderColor: '#000',
    },
    head: {
        width: 36,
        height: 28,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 0,
        elevation: 4,
    },
    face: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 2,
    },
    eye: {
        width: 6,
        height: 8,
        backgroundColor: '#000',
        borderRadius: 3,
    },
    body: {
        width: 24,
        height: 12,
        backgroundColor: '#333',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        marginTop: -4, // tuck under head
        zIndex: 4,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    engineGlow: {
        width: 12,
        height: 6,
        backgroundColor: '#00E5FF', // Blue glow
        borderRadius: 6,
        marginBottom: -10, // Below body
        opacity: 0.6,
        zIndex: -1,
    }
});
