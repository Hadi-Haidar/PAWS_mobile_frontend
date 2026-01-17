import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getPetById } from '../../services/pets';
import socket from '../../services/socket';

import { useFavorites } from '../../context/FavoritesContext';

export default function PetDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(false);
    const { isFavorite, toggleFavorite } = useFavorites();
    const { user } = useAuth(); // Get current user
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const isFav = isFavorite(pet?.id);

    // Responsive calculations
    const isSmallDevice = screenWidth < 375;
    const isMediumDevice = screenWidth >= 375 && screenWidth < 414;
    const isLargeDevice = screenWidth >= 414;
    const isTablet = screenWidth >= 600;

    // Dynamic sizing based on screen
    const imageHeight = isTablet ? 400 : isLargeDevice ? 320 : isMediumDevice ? 280 : 240;
    const titleFontSize = isTablet ? 42 : isLargeDevice ? 34 : isMediumDevice ? 30 : 26;
    const ageBadgePadding = isSmallDevice ? { h: 12, v: 8 } : { h: 16, v: 10 };
    const contentPadding = isTablet ? 24 : 16;
    const footerButtonHeight = isSmallDevice ? 52 : 60;
    const chatButtonHeight = isSmallDevice ? 48 : 54;

    useEffect(() => {
        const fetchPet = async () => {
            const { data, error } = await getPetById(id);
            if (error) {
                Alert.alert('Error', 'Could not load pet details');
                router.back();
            } else {
                setPet(data);
            }
            setLoading(false);
        };
        fetchPet();
    }, [id]);

    const handleAdopt = () => {
        if (!user) {
            Alert.alert('Sign In Required', 'You must be signed in to adopt a pet.');
            return;
        }

        if (pet.ownerId === user.id) {
            Alert.alert('Ownership', 'You cannot adopt your own pet!');
            return;
        }

        Alert.alert(
            'Adoption Request',
            `Send adoption request for ${pet.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Request',
                    onPress: () => {
                        // Ensure socket is open
                        if (!socket.connected) {
                            socket.auth = { userId: user.id };
                            socket.connect();
                        }

                        const messageData = {
                            senderId: user.id,
                            receiverId: pet.ownerId,
                            content: `I would like to adopt ${pet.name}!`,
                            type: 'adoption_request',
                            ticketId: pet.id, // Using ticketId for petId
                        };

                        socket.emit("send_message", messageData);

                        // Navigate to chat
                        router.push({
                            pathname: `/chat/${pet.ownerId}`,
                            params: {
                                name: pet.contactName || 'Owner',
                            }
                        });
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFAF0' }}>
                <ActivityIndicator size="large" color="#FF6B00" />
            </View>
        );
    }

    if (!pet) return null;

    const imageUrl = pet.images && pet.images.length > 0 ? pet.images[0] : null;

    // Determine role badge
    const roleLabel = pet.ownerRole === 'Admin' ? 'Shelter' : 'User';

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFAF0' }}>
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: insets.top + 8,
                paddingBottom: 16,
                paddingHorizontal: contentPadding,
                borderBottomWidth: 2,
                borderBottomColor: 'black',
                backgroundColor: '#FFFAF0',
                zIndex: 10
            }}>
                {/* Back/Paw Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                    style={{
                        width: 44,
                        height: 44,
                        backgroundColor: 'white',
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: 'black',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 5,
                    }}
                >
                    <MaterialCommunityIcons name="paw" size={24} color="#FF6B00" />
                </TouchableOpacity>

                {/* Title */}
                <Text style={{
                    fontSize: isSmallDevice ? 16 : 18,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                }}>
                    Pet Details
                </Text>

                {/* Favorite Button */}
                <TouchableOpacity
                    onPress={() => toggleFavorite(pet)}
                    activeOpacity={0.7}
                    style={{
                        width: 44,
                        height: 44,
                        backgroundColor: 'white',
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: 'black',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 5,
                    }}
                >
                    <MaterialIcons
                        name={isFav ? "favorite" : "favorite-border"}
                        size={24}
                        color={isFav ? "#FF6B00" : "black"}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{
                    paddingBottom: 200, // Extra space for fixed footer
                    flexGrow: 1
                }}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {/* Pet Image Section */}
                <View style={{ padding: contentPadding }}>
                    <View style={{
                        width: '100%',
                        backgroundColor: 'white',
                        borderRadius: 20,
                        borderWidth: 2,
                        borderColor: 'black',
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 5,
                    }}>
                        {imageUrl && (
                            <Image
                                source={{ uri: imageUrl }}
                                style={{ width: '100%', height: imageHeight }}
                                contentFit="cover"
                            />
                        )}
                        {!imageUrl && (
                            <View style={{
                                width: '100%',
                                height: imageHeight,
                                backgroundColor: '#e5e7eb',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <MaterialCommunityIcons name="paw" size={isTablet ? 80 : 64} color="#9CA3AF" />
                                <Text style={{ color: '#6B7280', marginTop: 8, fontWeight: '600', fontSize: isTablet ? 16 : 14 }}>
                                    No Image Available
                                </Text>
                            </View>
                        )}
                        {/* Owner Role Badge */}
                        <View style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            backgroundColor: '#CCFF66',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: 'black',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            shadowColor: '#000',
                            shadowOffset: { width: 2, height: 2 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                        }}>
                            <MaterialIcons name="person" size={14} color="black" />
                            <Text style={{ fontSize: 11, fontWeight: '800', color: 'black' }}>{roleLabel}</Text>
                        </View>
                    </View>
                </View>

                {/* Pet Info Section */}
                <View style={{ paddingHorizontal: contentPadding + 4, marginBottom: 16 }}>
                    {/* Name and Age Row - Wrapped for long names */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 8,
                        flexWrap: 'wrap',
                        gap: 8
                    }}>
                        {/* Pet Name - Flexible and wrappable */}
                        <Text
                            style={{
                                fontSize: titleFontSize,
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: -1,
                                color: 'black',
                                flex: 1,
                                minWidth: '50%',
                                flexShrink: 1,
                            }}
                            numberOfLines={2}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.7}
                        >
                            {pet.name}
                        </Text>

                        {/* Age Badge - Rotated */}
                        <View style={{
                            backgroundColor: '#CCFF66',
                            paddingHorizontal: ageBadgePadding.h,
                            paddingVertical: ageBadgePadding.v,
                            borderRadius: 24,
                            borderWidth: 2,
                            borderColor: 'black',
                            transform: [{ rotate: '-3deg' }],
                            shadowColor: '#000',
                            shadowOffset: { width: 4, height: 4 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                            flexShrink: 0,
                        }}>
                            <Text style={{ fontSize: isSmallDevice ? 14 : 16, fontWeight: '900', color: 'black' }}>
                                {pet.age ? `${pet.age} yrs` : 'Puppy'}
                            </Text>
                        </View>
                    </View>

                    {/* Type and Breed - Wrappable */}
                    <Text
                        style={{
                            fontSize: isSmallDevice ? 15 : 17,
                            fontWeight: '700',
                            color: '#4B5563',
                            marginBottom: 8,
                        }}
                        numberOfLines={2}
                    >
                        {pet.type}{pet.breed ? ` • ${pet.breed}` : ''}
                    </Text>

                    {/* Location - Wrappable */}
                    {pet.location && (
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <MaterialIcons
                                name="location-on"
                                size={20}
                                color="#CCFF66"
                                style={{
                                    textShadowColor: 'black',
                                    textShadowOffset: { width: 1, height: 1 },
                                    textShadowRadius: 1,
                                    marginTop: 2
                                }}
                            />
                            <Text
                                style={{
                                    fontSize: isSmallDevice ? 14 : 15,
                                    fontWeight: '700',
                                    color: 'black',
                                    marginLeft: 4,
                                    flex: 1,
                                    flexWrap: 'wrap'
                                }}
                                numberOfLines={3}
                            >
                                {pet.location}
                            </Text>
                        </View>
                    )}
                </View>

                {/* About Section */}
                <View style={{ paddingHorizontal: contentPadding }}>
                    <View style={{
                        backgroundColor: 'white',
                        borderRadius: 20,
                        borderWidth: 2,
                        borderColor: 'black',
                        padding: isTablet ? 24 : 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 5,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                            <Text
                                style={{
                                    fontSize: isTablet ? 22 : isSmallDevice ? 18 : 20,
                                    fontWeight: '900',
                                    color: 'black',
                                    flexShrink: 1
                                }}
                                numberOfLines={1}
                                adjustsFontSizeToFit={true}
                                minimumFontScale={0.8}
                            >
                                About {pet.name}
                            </Text>
                            <MaterialCommunityIcons name="paw" size={22} color="#FF6B00" style={{ marginLeft: 8 }} />
                        </View>

                        {/* Description - Fully expandable, no line limit */}
                        <Text style={{
                            fontSize: isTablet ? 16 : isSmallDevice ? 14 : 15,
                            fontWeight: '500',
                            lineHeight: isTablet ? 28 : isSmallDevice ? 22 : 24,
                            color: '#374151',
                        }}>
                            {pet.description || `${pet.name} is looking for a loving forever home. Come meet this adorable companion!`}
                        </Text>
                    </View>
                </View>

                {/* Location Map Section - Collapsible */}
                {(pet.Latitude && pet.Longitude) && (
                    <View style={{ paddingHorizontal: contentPadding, marginTop: 16 }}>
                        <View style={{
                            backgroundColor: 'white',
                            borderRadius: 20,
                            borderWidth: 2,
                            borderColor: 'black',
                            overflow: 'hidden',
                            shadowColor: '#000',
                            shadowOffset: { width: 4, height: 4 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                            elevation: 5,
                        }}>
                            {/* Toggle Button */}
                            <TouchableOpacity
                                onPress={() => setShowMap(!showMap)}
                                activeOpacity={0.8}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: isTablet ? 20 : 16,
                                    backgroundColor: showMap ? '#CCFF66' : 'white',
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={{
                                        width: 40,
                                        height: 40,
                                        backgroundColor: showMap ? '#fff' : '#FF6B00',
                                        borderRadius: 10,
                                        borderWidth: 2,
                                        borderColor: 'black',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <MaterialIcons name="location-on" size={22} color={showMap ? '#FF6B00' : 'white'} />
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: isTablet ? 18 : 16, fontWeight: '800', color: 'black' }}>
                                            {showMap ? 'Hide Location' : 'See Location'}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: '#666', fontWeight: '600' }}>
                                            {pet.location}
                                        </Text>
                                    </View>
                                </View>
                                <MaterialCommunityIcons
                                    name={showMap ? "chevron-up" : "chevron-down"}
                                    size={28}
                                    color="black"
                                />
                            </TouchableOpacity>

                            {/* Map View - Collapsible */}
                            {showMap && (
                                <TouchableOpacity
                                    onPress={() => {
                                        const url = `https://www.google.com/maps/search/?api=1&query=${pet.Latitude},${pet.Longitude}`;
                                        Linking.openURL(url);
                                    }}
                                    activeOpacity={0.9}
                                    style={{
                                        borderTopWidth: 2,
                                        borderTopColor: 'black',
                                    }}
                                >
                                    {/* Static Map Image */}
                                    <Image
                                        source={{
                                            uri: `https://maps.googleapis.com/maps/api/staticmap?center=${pet.Latitude},${pet.Longitude}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${pet.Latitude},${pet.Longitude}&key=AIzaSyDummyKey`
                                        }}
                                        style={{
                                            width: '100%',
                                            height: 180,
                                            backgroundColor: '#e5e7eb',
                                        }}
                                        contentFit="cover"
                                    />

                                    {/* Fallback Map Placeholder */}
                                    <View style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: '#e8f4e8',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <MaterialIcons name="map" size={48} color="#9CA3AF" />
                                        <View style={{
                                            position: 'absolute',
                                            backgroundColor: '#FF6B00',
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            borderRadius: 20,
                                            borderWidth: 2,
                                            borderColor: 'black',
                                            bottom: 60,
                                        }}>
                                            <MaterialIcons name="location-on" size={24} color="white" />
                                        </View>
                                    </View>

                                    {/* Open in Google Maps Button */}
                                    <View style={{
                                        position: 'absolute',
                                        bottom: 12,
                                        left: 12,
                                        right: 12,
                                        backgroundColor: '#FF6B00',
                                        paddingVertical: 12,
                                        borderRadius: 12,
                                        borderWidth: 2,
                                        borderColor: 'black',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 2, height: 2 },
                                        shadowOpacity: 1,
                                        shadowRadius: 0,
                                    }}>
                                        <MaterialCommunityIcons name="google-maps" size={20} color="white" />
                                        <Text style={{ fontSize: 14, fontWeight: '800', color: 'white' }}>
                                            Open in Google Maps
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Fixed Footer Buttons */}
            <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                paddingHorizontal: contentPadding,
                paddingTop: 16,
                paddingBottom: insets.bottom + 16,
                backgroundColor: 'rgba(255, 250, 240, 0.98)',
                borderTopWidth: 2,
                borderTopColor: 'black',
            }}>
                {/* Adopt Me Button */}
                <TouchableOpacity
                    onPress={handleAdopt}
                    activeOpacity={0.9}
                    style={{
                        height: footerButtonHeight,
                        backgroundColor: '#FF6B00',
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: 'black',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        marginBottom: 12,
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 5,
                    }}
                >
                    <Text style={{
                        fontSize: isSmallDevice ? 16 : 18,
                        fontWeight: '900',
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                    }}>
                        Adopt Me
                    </Text>
                    <MaterialCommunityIcons name="paw" size={isSmallDevice ? 22 : 24} color="white" />
                </TouchableOpacity>

                {/* Chat with Owner Button */}
                <TouchableOpacity
                    onPress={() => {
                        router.push({
                            pathname: `/chat/${pet.ownerId || 'unknown'}`,
                            params: {
                                name: pet.contactName || 'Owner',
                                avatar: null
                            }
                        });
                    }}
                    activeOpacity={0.9}
                    style={{
                        height: chatButtonHeight,
                        backgroundColor: '#CCFF66',
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: 'black',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 5,
                    }}
                >
                    <Text style={{
                        fontSize: isSmallDevice ? 14 : 16,
                        fontWeight: '800',
                        color: 'black',
                    }}>
                        Chat with Owner
                    </Text>
                    <MaterialIcons name="chat-bubble" size={isSmallDevice ? 20 : 22} color="black" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
