import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Text, TouchableOpacity, Vibration, View, useWindowDimensions } from 'react-native';

import { useFavorites } from '../context/FavoritesContext';

const PetCard = memo(({ pet, isSelected, onLongPress, selectionMode, isMine }) => {

    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavorites();
    const isFav = isFavorite(pet.id);
    const imageUrl = pet.images && pet.images.length > 0 ? pet.images[0] : null;
    const { width } = useWindowDimensions();
    const isTablet = width > 600;

    // Default to 'User' if not specified. Real app would check user role or owner type.
    const isFromShelter = false;

    const handlePress = () => {
        if (selectionMode) {
            // In selection mode, tap toggles selection (or deselects)
            onLongPress?.(pet);
        } else {
            router.push(`/pet/${pet.id}`);
        }
    };

    const handleLongPress = () => {
        Vibration.vibrate(50);
        onLongPress?.(pet);
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            onLongPress={handleLongPress}
            delayLongPress={400}
            activeOpacity={0.9}
            style={{
                flex: 1,
                margin: 6, // uniform margin
                backgroundColor: isSelected ? '#CCFF66' : '#fff',
                borderRadius: 12,
                borderWidth: isSelected ? 3 : 2,
                borderColor: isSelected ? '#FF6B00' : '#000',
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 4,
                overflow: 'visible', // allow shadow
            }}
        >
            {/* Selection Indicator */}
            {isSelected && (
                <View style={{
                    position: 'absolute',
                    top: -8,
                    left: -8,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#FF6B00',
                    borderWidth: 2,
                    borderColor: '#000',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                }}>
                    <MaterialCommunityIcons name="check" size={16} color="white" />
                </View>
            )}

            {/* Image Container */}
            <View style={{
                width: '100%',
                aspectRatio: 4 / 5,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                overflow: 'hidden',
                borderBottomWidth: 2,
                borderBottomColor: '#000',
                backgroundColor: '#f3f4f6', // light gray bg for no-image
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={300}
                    />
                ) : (
                    <View style={{ alignItems: 'center', opacity: 0.5 }}>
                        <MaterialCommunityIcons name="paw" size={32} color="#9CA3AF" />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', marginTop: 4 }}>
                            No Photo
                        </Text>
                    </View>
                )}

                {/* Ownership Badge */}
                {isMine && (
                    <View style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: '#000',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: '#fff',
                        zIndex: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4
                    }}>
                        <MaterialCommunityIcons name="account" size={10} color="white" />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: 'white', textTransform: 'uppercase' }}>
                            MY PET
                        </Text>
                    </View>
                )}

                {/* Source Badge - Only show if we actually know it's a shelter (hidden for now as logic was fake) */}
                {isFromShelter && !isMine && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            backgroundColor: '#FF6B00',
                            borderWidth: 2,
                            borderColor: '#000',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                            flexDirection: 'row',
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 1, height: 1 },
                            shadowOpacity: 0.8,
                            shadowRadius: 0,
                        }}
                    >
                        <MaterialCommunityIcons
                            name="home-heart"
                            size={10}
                            color="black"
                        />
                        <Text style={{ color: '#000', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', marginLeft: 4 }}>
                            Shelter
                        </Text>
                    </View>
                )}

                {/* Favorite Button - Hide in selection mode */}
                {!selectionMode && (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation(); // Prevent navigation
                            toggleFavorite(pet);
                        }}
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 28,
                            height: 28,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 14,
                            backgroundColor: '#fff',
                            borderWidth: 2,
                            borderColor: '#000',
                            shadowColor: '#000',
                            shadowOffset: { width: 1, height: 1 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                        }}
                    >
                        <MaterialCommunityIcons
                            name={isFav ? "heart" : "heart-outline"}
                            size={14}
                            color={isFav ? "#FF6B00" : "black"}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Info Container */}
            <View style={{ padding: 10, paddingHorizontal: 10, paddingBottom: 10, paddingTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <Text style={{ fontSize: isTablet ? 18 : 14, fontWeight: '900', color: '#000', flex: 1 }} numberOfLines={1}>
                        {pet.name}
                    </Text>
                </View>
                <Text style={{ color: '#4B5563', fontSize: isTablet ? 14 : 10, fontWeight: '700', marginBottom: 2 }} numberOfLines={1}>
                    {pet.breed || pet.type} • {pet.age ? `${pet.age} yrs` : 'Unknown'}
                </Text>

                {pet.location && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <MaterialCommunityIcons name="map-marker" size={isTablet ? 14 : 10} color="#6B7280" />
                        <Text style={{ color: '#9CA3AF', fontSize: isTablet ? 12 : 9, fontFamily: 'monospace', marginLeft: 2 }} numberOfLines={1}>
                            {pet.location}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
});

PetCard.displayName = 'PetCard';

export default PetCard;
