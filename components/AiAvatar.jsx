import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

export default function AiAvatar({ size = 40 }) {
    const scale = size / 40;
    const eyeBlink = useSharedValue(1);

    useEffect(() => {
        eyeBlink.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 3000 }),
                withTiming(0.2, { duration: 100 }),
                withTiming(1, { duration: 100 })
            ),
            -1,
            false
        );
    }, []);

    const rEyeStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scaleY: eyeBlink.value }]
        };
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <View style={[styles.wrapper, { transform: [{ scale }] }]}>
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

                {/* Body */}
                <View style={styles.body}>
                    <View style={styles.engineGlow} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        // Ensure no clipping if possible, or adequate size
        overflow: 'visible'
    },
    wrapper: {
        width: 40,
        alignItems: 'center',
        // Center the content relative to the scaler
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
        backgroundColor: '#FF6B00',
        marginTop: -8,
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
        marginTop: -4,
        zIndex: 4,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    engineGlow: {
        width: 12,
        height: 6,
        backgroundColor: '#00E5FF',
        borderRadius: 6,
        marginBottom: -10,
        opacity: 0.6,
        zIndex: -1,
    }
});
