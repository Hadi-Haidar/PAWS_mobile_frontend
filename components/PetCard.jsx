import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const PetCard = memo(({ pet }) => {
    const router = useRouter();
    const imageUrl = pet.images?.[0] || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80';
    const isFromShelter = pet.ownerId?.includes('shelter') || pet.id % 2 === 0;

    return (
        <TouchableOpacity
            onPress={() => router.push(`/pet/${pet.id}`)}
            activeOpacity={0.9}
            style={{
                flex: 1,
                margin: 6, // uniform margin
                backgroundColor: '#fff',
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#000',
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 4,
                overflow: 'visible', // allow shadow
            }}
        >
            {/* Image Container */}
            <View style={{
                width: '100%',
                aspectRatio: 4 / 5,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                overflow: 'hidden',
                borderBottomWidth: 2,
                borderBottomColor: '#000',
            }}>
                <Image
                    source={{ uri: imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={300}
                />

                {/* Source Badge */}
                <View
                    style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: isFromShelter ? '#FF6B00' : '#CCFF66',
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
                        name={isFromShelter ? "home-heart" : "account"}
                        size={10}
                        color="black"
                    />
                    <Text style={{ color: '#000', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', marginLeft: 4 }}>
                        {isFromShelter ? 'Shelter' : 'User'}
                    </Text>
                </View>

                {/* Favorite Button */}
                <TouchableOpacity
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
                    <MaterialCommunityIcons name="heart-outline" size={14} color="black" />
                </TouchableOpacity>
            </View>

            {/* Info Container */}
            <View style={{ p: 10, paddingHorizontal: 10, paddingBottom: 10, paddingTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#000', flex: 1 }} numberOfLines={1}>
                        {pet.name}
                    </Text>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#CCFF66',
                            paddingHorizontal: 4,
                            paddingVertical: 2,
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: '#000',
                            marginLeft: 4,
                        }}
                    >
                        <MaterialCommunityIcons name="map-marker" size={8} color="black" />
                        <Text style={{ color: '#000', fontSize: 8, fontWeight: '700', marginLeft: 1 }}>2.5m</Text>
                    </View>
                </View>
                <Text style={{ color: '#4B5563', fontSize: 10, fontWeight: '700', marginBottom: 2 }} numberOfLines={1}>
                    {pet.breed || pet.type} • {pet.age ? `${pet.age} yrs` : 'Unknown'}
                </Text>
                <Text style={{ color: '#9CA3AF', fontSize: 8, fontFamily: 'monospace' }} numberOfLines={1}>
                    {pet.location || 'Local Shelter'}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

PetCard.displayName = 'PetCard';

export default PetCard;
