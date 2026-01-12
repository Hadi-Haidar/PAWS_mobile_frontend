
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function AddAnimalScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { token } = useAuth();

    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        breed: '',
        age: '',
        location: '',
        description: '',
        latitude: '',
        longitude: ''
    });

    const pickImage = async () => {
        console.log('ImagePicker Keys:', Object.keys(ImagePicker));
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleGetCurrentLocation = async () => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied');
                setLoading(false);
                return;
            }

            let location = null;

            // First, try to get the last known location (instant, cached)
            try {
                location = await Location.getLastKnownPositionAsync({
                    maxAge: 60000, // Accept cached location up to 1 minute old
                    requiredAccuracy: 100, // Within 100 meters
                });
            } catch (e) {
                // Last known not available, continue to get current
            }

            // If no cached location or it's too old, get fresh location
            if (!location) {
                // Use balanced accuracy for faster response
                location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced, // Good balance of speed vs accuracy
                    timeInterval: 5000, // Update every 5 seconds max
                    distanceInterval: 10, // Update every 10 meters
                });
            }

            if (location) {
                setFormData(prev => ({
                    ...prev,
                    latitude: location.coords.latitude.toString(),
                    longitude: location.coords.longitude.toString()
                }));
                Alert.alert('✓ Location Set', `GPS coordinates captured successfully!\n\nAccuracy: ~${Math.round(location.coords.accuracy || 0)}m`);
            } else {
                throw new Error('Could not determine location');
            }
        } catch (error) {
            console.log('Location error:', error);
            Alert.alert('Location Error', 'Could not fetch location. Please ensure:\n\n• GPS is enabled\n• You are outdoors or near a window\n• Location permissions are granted');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.type || !formData.location) {
            Alert.alert('Missing Fields', 'Please fill in required fields (Name, Type, Location Name).');
            return;
        }

        if (!formData.latitude || !formData.longitude) {
            Alert.alert('Missing GPS', 'Please click "Set Current Location" to attach GPS coordinates.');
            return;
        }

        setLoading(true);

        try {
            const API_URL = __DEV__
                ? 'http://192.168.10.111:5000/api'
                : 'http://localhost:5000/api';

            const payload = {
                ...formData,
                age: formData.age ? parseInt(formData.age) : null,
                description: formData.description || `Found/Reported: ${formData.name}`,
                imageUrl: image
            };

            const response = await fetch(`${API_URL}/pets/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create pet');
            }

            Alert.alert('Success', 'Animal reported successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error('Submit Error:', error);
            Alert.alert('Error', error.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    // Neo-Pop Styles
    const inputStyle = {
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: 'black',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12, // Ensure reasonable height
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 2, // Android hard shadow approximation
    };

    const labelStyle = {
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
        fontStyle: 'italic'
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFAF0' }}>
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingTop: insets.top + 16,
                paddingBottom: 20,
                paddingHorizontal: 20,
                borderBottomWidth: 3,
                borderBottomColor: 'black',
                backgroundColor: '#FFFAF0',
                zIndex: 10
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                    style={{
                        width: 48,
                        height: 48,
                        backgroundColor: '#FF6B00',
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: 'black',
                        alignItems: 'center', // Center content horizontally
                        justifyContent: 'center', // Center content vertically
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 5,
                        marginRight: 16
                    }}
                >
                    <MaterialIcons name="pets" size={28} color="white" />
                </TouchableOpacity>

                <Text style={{
                    fontSize: 24,
                    fontWeight: '900',
                    fontStyle: 'italic',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                }}>
                    Add Animal
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Photo Upload */}
                    <Text style={labelStyle}>Pet Photos</Text>
                    <TouchableOpacity
                        onPress={pickImage}
                        activeOpacity={0.8}
                        style={{
                            width: '100%',
                            height: 200,
                            backgroundColor: 'white',
                            borderRadius: 16,
                            borderWidth: 3,
                            borderColor: 'black',
                            borderStyle: 'dashed', // Dashed border for upload area
                            marginBottom: 24,
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        {image ? (
                            <Image
                                source={{ uri: image }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={{ alignItems: 'center' }}>
                                <View style={{
                                    width: 64, height: 64,
                                    backgroundColor: '#CCFF66', // Pop Green
                                    borderRadius: 32,
                                    borderWidth: 2,
                                    borderColor: 'black',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 12,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 1,
                                    shadowRadius: 0,
                                }}>
                                    <MaterialIcons name="add-a-photo" size={32} color="black" />
                                </View>
                                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Tap to upload photos</Text>
                                <Text style={{ color: '#666', fontSize: 12 }}>Supports JPG, PNG</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Show selected image thumbnail separate if needed, but doing simple inline above for now */}
                    {image && (
                        <View style={{ marginBottom: 24, flexDirection: 'row' }}>
                            <View style={{
                                width: 80, height: 80,
                                borderRadius: 12,
                                borderWidth: 3,
                                borderColor: 'black',
                                overflow: 'hidden',
                                shadowColor: '#000',
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 1,
                                shadowRadius: 0,
                            }}>
                                <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} />
                                <TouchableOpacity
                                    onPress={() => setImage(null)}
                                    style={{
                                        position: 'absolute', top: -5, left: -5,
                                        backgroundColor: '#FF4444', width: 24, height: 24,
                                        borderRadius: 12, borderWidth: 1, borderColor: 'black',
                                        alignItems: 'center', justifyContent: 'center', zIndex: 10
                                    }}>
                                    <MaterialIcons name="close" size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Name */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={labelStyle}>Name</Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="e.g. Barnaby"
                            placeholderTextColor="#9CA3AF"
                            value={formData.name}
                            onChangeText={(t) => setFormData({ ...formData, name: t })}
                        />
                    </View>

                    {/* Type & Breed Row */}
                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={labelStyle}>Type</Text>
                            <TextInput
                                style={inputStyle}
                                placeholder="Dog, Cat..."
                                placeholderTextColor="#9CA3AF"
                                value={formData.type}
                                onChangeText={(t) => setFormData({ ...formData, type: t })}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={labelStyle}>Breed</Text>
                            <TextInput
                                style={inputStyle}
                                placeholder="e.g. Pug"
                                placeholderTextColor="#9CA3AF"
                                value={formData.breed}
                                onChangeText={(t) => setFormData({ ...formData, breed: t })}
                            />
                        </View>
                    </View>

                    {/* Age */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={labelStyle}>Age (Years)</Text>
                        <View>
                            <TextInput
                                style={inputStyle}
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                value={formData.age}
                                onChangeText={(t) => setFormData({ ...formData, age: t })}
                                keyboardType="numeric"
                            />
                            <Text style={{
                                position: 'absolute',
                                right: 16,
                                top: 16,
                                fontWeight: 'bold',
                                color: '#9CA3AF',
                                fontSize: 16
                            }}>Yrs</Text>
                        </View>
                    </View>

                    {/* Location */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={labelStyle}>Location Name</Text>
                        <View style={{ gap: 12 }}>
                            <TextInput
                                style={inputStyle}
                                placeholder="City, State or Zip"
                                placeholderTextColor="#9CA3AF"
                                value={formData.location}
                                onChangeText={(t) => setFormData({ ...formData, location: t })}
                            />
                            <TouchableOpacity
                                onPress={handleGetCurrentLocation}
                                activeOpacity={0.8}
                                style={{
                                    height: 50,
                                    backgroundColor: '#CCFF66', // Pop Green
                                    borderWidth: 3,
                                    borderColor: 'black',
                                    borderRadius: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 1,
                                    shadowRadius: 0,
                                    elevation: 2,
                                }}
                            >
                                <MaterialIcons name="my-location" size={24} color="black" />
                                <Text style={{ fontWeight: '900', textTransform: 'uppercase' }}>Set Current Location</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={labelStyle}>Description</Text>
                        <TextInput
                            style={[inputStyle, { height: 120, textAlignVertical: 'top' }]}
                            placeholder="Tell us about their personality, history, and needs..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={5}
                            value={formData.description}
                            onChangeText={(t) => setFormData({ ...formData, description: t })}
                        />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Bottom Button */}
            <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 20,
                paddingBottom: insets.bottom + 10,
                backgroundColor: 'transparent' // We can add gradient here if we had a library, but transparent or solid is fine
            }}>
                {/* Gradient-like overlay hint to hide scroll content? 
                    For now, straightforward button container */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.9}
                    style={{
                        height: 64,
                        backgroundColor: '#FF6B00', // Pop Orange
                        borderRadius: 16,
                        borderWidth: 3,
                        borderColor: 'black',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 }, // Hard shadow neo-hover like
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 5,
                    }}
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <>
                            <MaterialIcons name="pets" size={28} color="black" />
                            <Text style={{ fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Submit for Review</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
