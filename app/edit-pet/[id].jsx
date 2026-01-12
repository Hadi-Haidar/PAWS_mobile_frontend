
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPetById, updatePet } from '../../services/pets';

const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Other'];

export default function EditPetScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pet, setPet] = useState(null);

    // Form fields
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [location, setLocation] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [gpsLoading, setGpsLoading] = useState(false);

    useEffect(() => {
        const fetchPet = async () => {
            const { data, error } = await getPetById(id);
            if (error) {
                Alert.alert('Error', 'Could not load pet details');
                router.back();
            } else {
                setPet(data);
                // Populate form fields
                setName(data.name || '');
                setType(data.type || '');
                setBreed(data.breed || '');
                setAge(data.age?.toString() || '');
                setLocation(data.location || '');
                setLatitude(data.Latitude?.toString() || '');
                setLongitude(data.Longitude?.toString() || '');
                setDescription(data.description || '');
                setImageUrl(data.images?.[0] || '');
            }
            setLoading(false);
        };
        fetchPet();
    }, [id]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 5],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUrl(result.assets[0].uri);
        }
    };

    const handleGetCurrentLocation = async () => {
        setGpsLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied');
                setGpsLoading(false);
                return;
            }

            let loc = null;

            // Strategy 1: Use cached location (INSTANT - up to 5 minutes old)
            try {
                loc = await Location.getLastKnownPositionAsync({
                    maxAge: 300000,
                    requiredAccuracy: 200,
                });
            } catch (e) { }

            // Strategy 2: Get fresh location with LOW accuracy (fastest GPS lock)
            if (!loc) {
                const locationPromise = Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Low,
                });
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('timeout')), 3000)
                );
                try {
                    loc = await Promise.race([locationPromise, timeoutPromise]);
                } catch (e) {
                    if (e.message === 'timeout') {
                        loc = await Location.getCurrentPositionAsync({
                            accuracy: Location.Accuracy.Balanced,
                        });
                    } else {
                        throw e;
                    }
                }
            }

            if (!loc) {
                throw new Error('Could not determine location');
            }

            // Update coordinates immediately
            setLatitude(loc.coords.latitude.toString());
            setLongitude(loc.coords.longitude.toString());

            // Use OpenStreetMap Nominatim API for ENGLISH + SPECIFIC place names
            let locationName = '';
            try {
                const lat = loc.coords.latitude;
                const lon = loc.coords.longitude;

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=en`,
                    { headers: { 'User-Agent': 'PAWS-App/1.0' } }
                );

                if (response.ok) {
                    const data = await response.json();
                    const addr = data.address || {};
                    const parts = [];

                    const poiName = addr.amenity || addr.building || addr.shop ||
                        addr.tourism || addr.leisure || addr.office ||
                        addr.historic || addr.place;
                    if (poiName && poiName !== 'yes') parts.push(poiName);

                    if (addr.road) {
                        if (addr.house_number) {
                            parts.push(`${addr.house_number} ${addr.road}`);
                        } else {
                            parts.push(addr.road);
                        }
                    }

                    if (addr.neighbourhood || addr.suburb || addr.quarter) {
                        const area = addr.neighbourhood || addr.suburb || addr.quarter;
                        if (!parts.includes(area)) parts.push(area);
                    }

                    const city = addr.city || addr.town || addr.village || addr.municipality;
                    if (city && !parts.includes(city)) parts.push(city);

                    if (parts.length === 0 && data.display_name) {
                        const displayParts = data.display_name.split(', ').slice(0, 3);
                        parts.push(...displayParts);
                    }

                    locationName = parts.slice(0, 3).join(', ');
                }
            } catch (geoError) {
                console.log('Nominatim geocoding failed:', geoError);
            }

            setLocation(locationName || location);

            Alert.alert(
                '✓ Location Updated',
                `${locationName || 'Unknown Location'}\n\nAccuracy: ~${Math.round(loc.coords.accuracy || 0)}m`
            );

        } catch (error) {
            console.log('Location error:', error);
            Alert.alert('Location Error', 'Could not fetch location. Please ensure GPS is enabled.');
        } finally {
            setGpsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Missing Information', 'Please enter a name for the pet.');
            return;
        }
        if (!type) {
            Alert.alert('Missing Information', 'Please select a pet type.');
            return;
        }
        if (!location.trim()) {
            Alert.alert('Missing Information', 'Please enter a location.');
            return;
        }

        setSaving(true);

        const updates = {
            name: name.trim(),
            type,
            breed: breed.trim() || null,
            age: age ? parseInt(age) : null,
            location: location.trim(),
            Latitude: latitude ? parseFloat(latitude) : null,
            Longitude: longitude ? parseFloat(longitude) : null,
            description: description.trim() || null,
            images: imageUrl ? [imageUrl] : [],
        };

        const { error } = await updatePet(id, updates);

        setSaving(false);

        if (error) {
            Alert.alert('Error', 'Failed to update pet. Please try again.');
        } else {
            Alert.alert('Success', 'Pet details updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFAF0' }}>
                <ActivityIndicator size="large" color="#FF6B00" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFAF0' }}>
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: insets.top + 8,
                paddingBottom: 16,
                paddingHorizontal: 16,
                borderBottomWidth: 2,
                borderBottomColor: 'black',
                backgroundColor: '#FFFAF0',
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        width: 44,
                        height: 44,
                        backgroundColor: '#FF6B00',
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: '#000',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 2, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                    }}
                >
                    <MaterialCommunityIcons name="paw" size={24} color="black" />
                </TouchableOpacity>

                <Text style={{
                    fontSize: 18,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                }}>
                    Edit Pet
                </Text>

                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Image Picker */}
                    <TouchableOpacity
                        onPress={pickImage}
                        style={{
                            width: '100%',
                            aspectRatio: 4 / 3,
                            backgroundColor: '#fff',
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: '#000',
                            overflow: 'hidden',
                            marginBottom: 24,
                            shadowColor: '#000',
                            shadowOffset: { width: 4, height: 4 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                        }}
                    >
                        {imageUrl ? (
                            <Image
                                source={{ uri: imageUrl }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
                                <MaterialCommunityIcons name="camera-plus" size={48} color="#9CA3AF" />
                                <Text style={{ marginTop: 8, color: '#6B7280', fontWeight: '600' }}>Tap to change photo</Text>
                            </View>
                        )}
                        <View style={{
                            position: 'absolute',
                            bottom: 12,
                            right: 12,
                            width: 40,
                            height: 40,
                            backgroundColor: '#FF6B00',
                            borderRadius: 20,
                            borderWidth: 2,
                            borderColor: '#000',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <MaterialCommunityIcons name="camera" size={20} color="white" />
                        </View>
                    </TouchableOpacity>

                    {/* Name Input */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>Pet Name *</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter pet name"
                            style={{
                                backgroundColor: '#fff',
                                borderWidth: 2,
                                borderColor: '#000',
                                borderRadius: 12,
                                padding: 16,
                                fontSize: 16,
                                fontWeight: '600',
                            }}
                        />
                    </View>

                    {/* Type Selector */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>Pet Type *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {PET_TYPES.map((petType) => (
                                <TouchableOpacity
                                    key={petType}
                                    onPress={() => setType(petType)}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 12,
                                        borderRadius: 8,
                                        borderWidth: 2,
                                        borderColor: '#000',
                                        marginRight: 8,
                                        backgroundColor: type === petType ? '#CCFF66' : '#fff',
                                    }}
                                >
                                    <Text style={{ fontWeight: '700' }}>{petType}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Breed Input */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>Breed</Text>
                        <TextInput
                            value={breed}
                            onChangeText={setBreed}
                            placeholder="Enter breed (optional)"
                            style={{
                                backgroundColor: '#fff',
                                borderWidth: 2,
                                borderColor: '#000',
                                borderRadius: 12,
                                padding: 16,
                                fontSize: 16,
                                fontWeight: '600',
                            }}
                        />
                    </View>

                    {/* Age Input */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>Age (years)</Text>
                        <TextInput
                            value={age}
                            onChangeText={setAge}
                            placeholder="Enter age"
                            keyboardType="numeric"
                            style={{
                                backgroundColor: '#fff',
                                borderWidth: 2,
                                borderColor: '#000',
                                borderRadius: 12,
                                padding: 16,
                                fontSize: 16,
                                fontWeight: '600',
                            }}
                        />
                    </View>

                    {/* Location Input */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>Location *</Text>
                        <TextInput
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Enter location"
                            style={{
                                backgroundColor: '#fff',
                                borderWidth: 2,
                                borderColor: '#000',
                                borderRadius: 12,
                                padding: 16,
                                fontSize: 16,
                                fontWeight: '600',
                            }}
                        />
                        {/* Update Location Button */}
                        <TouchableOpacity
                            onPress={handleGetCurrentLocation}
                            disabled={gpsLoading}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#CCFF66',
                                borderWidth: 2,
                                borderColor: '#000',
                                borderRadius: 12,
                                padding: 14,
                                marginTop: 8,
                                gap: 8,
                            }}
                        >
                            {gpsLoading ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#000" />
                            )}
                            <Text style={{ fontWeight: '800', color: '#000' }}>
                                {gpsLoading ? 'Getting Location...' : 'Update Current Location'}
                            </Text>
                        </TouchableOpacity>
                        {latitude && longitude && (
                            <Text style={{ fontSize: 12, color: '#666', marginTop: 6, fontWeight: '600' }}>
                                📍 GPS: {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                            </Text>
                        )}
                    </View>

                    {/* Description Input */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>Description</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Tell us about this pet..."
                            multiline
                            numberOfLines={4}
                            style={{
                                backgroundColor: '#fff',
                                borderWidth: 2,
                                borderColor: '#000',
                                borderRadius: 12,
                                padding: 16,
                                fontSize: 16,
                                fontWeight: '600',
                                minHeight: 120,
                                textAlignVertical: 'top',
                            }}
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        style={{
                            backgroundColor: '#FF6B00',
                            paddingVertical: 18,
                            borderRadius: 14,
                            borderWidth: 2,
                            borderColor: '#000',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 4, height: 4 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                        }}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={{ fontSize: 18, fontWeight: '900', color: 'white', textTransform: 'uppercase' }}>
                                    Save Changes
                                </Text>
                                <MaterialCommunityIcons name="check" size={24} color="white" />
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
