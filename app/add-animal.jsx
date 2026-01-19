
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
import { uploadImage } from '../services/storage';

export default function AddAnimalScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { token } = useAuth();

    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('Submit for Review');
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
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleGetCurrentLocation = async () => {
        setLoading(true);
        try {
            // Check permissions first (fast)
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied');
                setLoading(false);
                return;
            }

            let location = null;

            // Strategy 1: Use cached location (INSTANT - up to 5 minutes old)
            try {
                location = await Location.getLastKnownPositionAsync({
                    maxAge: 300000, // 5 minutes - much more aggressive caching
                    requiredAccuracy: 200, // Allow 200m accuracy for speed
                });
            } catch (e) {
                // Cached location not available
            }

            // Strategy 2: Get fresh location with LOW accuracy (fastest GPS lock)
            if (!location) {
                // Use a timeout to prevent long waits
                const locationPromise = Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Low, // Fastest - ~3km accuracy is fine for city/area
                });

                // Race against a 3-second timeout
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('timeout')), 3000)
                );

                try {
                    location = await Promise.race([locationPromise, timeoutPromise]);
                } catch (e) {
                    // If Low accuracy times out, try Balanced as fallback
                    if (e.message === 'timeout') {
                        location = await Location.getCurrentPositionAsync({
                            accuracy: Location.Accuracy.Balanced,
                        });
                    } else {
                        throw e;
                    }
                }
            }

            if (!location) {
                throw new Error('Could not determine location');
            }

            // Update coordinates immediately (user sees instant feedback)
            setFormData(prev => ({
                ...prev,
                latitude: location.coords.latitude.toString(),
                longitude: location.coords.longitude.toString()
            }));

            // Use OpenStreetMap Nominatim API for ENGLISH + SPECIFIC place names
            let locationName = '';
            try {
                const lat = location.coords.latitude;
                const lon = location.coords.longitude;

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=en`,
                    {
                        headers: {
                            'User-Agent': 'PAWS-App/1.0' // Required by Nominatim
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const addr = data.address || {};
                    const parts = [];

                    // 1. SPECIFIC POI NAME (Most accurate - building, shop, amenity)
                    const poiName = addr.amenity || addr.building || addr.shop ||
                        addr.tourism || addr.leisure || addr.office ||
                        addr.historic || addr.place;
                    if (poiName && poiName !== 'yes') {
                        parts.push(poiName);
                    }

                    // 2. Street Address
                    if (addr.road) {
                        if (addr.house_number) {
                            parts.push(`${addr.house_number} ${addr.road}`);
                        } else {
                            parts.push(addr.road);
                        }
                    }

                    // 3. Neighborhood/Suburb
                    if (addr.neighbourhood || addr.suburb || addr.quarter) {
                        const area = addr.neighbourhood || addr.suburb || addr.quarter;
                        if (!parts.includes(area)) {
                            parts.push(area);
                        }
                    }

                    // 4. City/Town
                    const city = addr.city || addr.town || addr.village || addr.municipality;
                    if (city && !parts.includes(city)) {
                        parts.push(city);
                    }

                    // 5. Fallback to display_name if nothing specific found
                    if (parts.length === 0 && data.display_name) {
                        // Take first 2-3 parts of display_name
                        const displayParts = data.display_name.split(', ').slice(0, 3);
                        parts.push(...displayParts);
                    }

                    locationName = parts.slice(0, 3).join(', '); // Max 3 parts for readability
                }
            } catch (geoError) {

                // Fallback to expo-location if Nominatim fails
                try {
                    const reverseGeocode = await Location.reverseGeocodeAsync({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude
                    });
                    if (reverseGeocode && reverseGeocode.length > 0) {
                        const addr = reverseGeocode[0];
                        locationName = [addr.name, addr.city].filter(Boolean).join(', ');
                    }
                } catch (e) {
                    // Silently fail
                }
            }

            // Final update with location name
            setFormData(prev => ({
                ...prev,
                location: locationName || prev.location
            }));

            Alert.alert(
                '✓ Location Set',
                `${locationName || 'Unknown Location'}\n\nAccuracy: ~${Math.round(location.coords.accuracy || 0)}m`
            );

        } catch (error) {

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
        setStatusText(image ? 'Uploading Photo...' : 'Saving Details...');

        try {
            // Upload image to Supabase Storage first
            let uploadedImageUrl = null;
            if (image) {
                uploadedImageUrl = await uploadImage(image);
                setStatusText('Saving Details...');
            }

            const API_URL = __DEV__
                ? 'http://192.168.10.111:5000/api'
                : 'http://localhost:5000/api';

            const payload = {
                ...formData,
                age: formData.age ? parseInt(formData.age) : null,
                description: formData.description || `Found/Reported: ${formData.name}`,
                imageUrl: uploadedImageUrl
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

            Alert.alert('Error', error.message || 'Failed to submit report');
        } finally {
            setLoading(false);
            setStatusText('Submit for Review');
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <ActivityIndicator color="black" />
                            <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase' }}>{statusText}</Text>
                        </View>
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
