
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QRScannerScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    const handleBarCodeScanned = ({ type, data }) => {
        if (scanned) return;

        setScanned(true);
        Vibration.vibrate(100);

        // Check if it's a Pet URL (e.g. https://.../pet/123)
        const petMatch = data.match(/\/pet\/([a-zA-Z0-9-]+)/);
        const petId = petMatch ? petMatch[1] : null;

        if (petId) {
            Alert.alert(
                'Pet Discovered',
                'How would you like to view this pet?',
                [
                    {
                        text: 'View in App',
                        onPress: () => router.push(`/pet/${petId}`)
                    },
                    {
                        text: 'View on Web',
                        onPress: () => Linking.openURL(data)
                    },
                    {
                        text: 'Cancel',
                        onPress: () => setScanned(false),
                        style: 'cancel'
                    }
                ]
            );
        } else if (data.startsWith('http')) {
            Alert.alert(
                'External Link',
                'Open this link in browser?',
                [
                    { text: 'Open', onPress: () => Linking.openURL(data) },
                    { text: 'Cancel', onPress: () => setScanned(false), style: 'cancel' }
                ]
            );
        } else {
            Alert.alert(
                'Scanned Data',
                data,
                [
                    { text: 'OK', onPress: () => setScanned(false) }
                ]
            );
        }
    };

    if (!permission) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.message}>Requesting camera permission...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.permissionBox}>
                    <MaterialCommunityIcons name="camera-off" size={64} color="#FF6B00" />
                    <Text style={styles.permissionTitle}>Camera Access Required</Text>
                    <Text style={styles.permissionText}>
                        We need camera access to scan QR codes for pet identification
                    </Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestPermission}
                    >
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                enableTorch={flashOn}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={handleBarCodeScanned}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.headerButton}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>SCAN QR CODE</Text>

                    <TouchableOpacity
                        onPress={() => setFlashOn(!flashOn)}
                        style={[styles.headerButton, flashOn && styles.headerButtonActive]}
                    >
                        <MaterialIcons name={flashOn ? "flash-on" : "flash-off"} size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Scanner Frame */}
                <View style={styles.scannerArea}>
                    <View style={styles.scannerFrame}>
                        {/* Corner decorations */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />

                        {/* Paw icon in center */}
                        <MaterialCommunityIcons name="paw" size={48} color="rgba(255, 107, 0, 0.3)" />
                    </View>
                </View>

                {/* Instructions */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
                    <View style={styles.instructionBox}>
                        <MaterialCommunityIcons name="qrcode" size={24} color="#FF6B00" />
                        <Text style={styles.instructionText}>
                            Point your camera at a pet's QR code to view their details
                        </Text>
                    </View>

                    {scanned && (
                        <TouchableOpacity
                            style={styles.scanAgainButton}
                            onPress={() => setScanned(false)}
                        >
                            <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    message: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        padding: 20,
    },
    permissionBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#FFFAF0',
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: 'black',
        marginTop: 24,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
    },
    permissionButton: {
        marginTop: 32,
        backgroundColor: '#FF6B00',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'black',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 5,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerButtonActive: {
        backgroundColor: '#FF6B00',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    scannerArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerFrame: {
        width: 280,
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#FF6B00',
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 12,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 12,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 12,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 12,
    },
    footer: {
        padding: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    instructionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'black',
        gap: 12,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        lineHeight: 20,
    },
    scanAgainButton: {
        marginTop: 16,
        backgroundColor: '#CCFF66',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'black',
        alignItems: 'center',
    },
    scanAgainText: {
        fontSize: 16,
        fontWeight: '800',
        color: 'black',
        textTransform: 'uppercase',
    },
});
