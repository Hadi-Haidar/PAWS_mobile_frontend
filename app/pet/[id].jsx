
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPetById } from '../../services/pets';

export default function PetDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <ActivityIndicator size="large" color="#FF6F00" />
            </View>
        );
    }

    if (!pet) return null;

    const imageUrl = pet.images && pet.images.length > 0 ? pet.images[0] : 'https://via.placeholder.com/400';

    return (
        <View className="flex-1 bg-background">
            <ScrollView bounces={false}>
                <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-80 border-b-2 border-black"
                    contentFit="cover"
                />

                <View className="p-6">
                    <View className="flex-row justify-between items-start mb-4">
                        <View>
                            <Text className="text-3xl font-bold text-black mb-1">{pet.name}</Text>
                            <Text className="text-lg text-text-secondary">{pet.breed || pet.type}</Text>
                        </View>
                        <View className="bg-secondary px-3 py-1 border-2 border-black rounded-full">
                            <Text className="font-bold">{pet.age ? `${pet.age} yrs` : 'Baby'}</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center mb-6">
                        <FontAwesome name="map-marker" size={20} color="#FF6F00" />
                        <Text className="ml-2 text-lg font-bold">{pet.location}</Text>
                    </View>

                    <View className="bg-surface p-4 border-2 border-black shadow-md mb-6">
                        <Text className="text-lg font-bold mb-2">About {pet.name}</Text>
                        <Text className="text-text-secondary leading-6">
                            {pet.description}
                        </Text>
                    </View>

                    {/* QR Code Section - Only for styling demo, logically would be a modal or separate view */}
                    {/* <TouchableOpacity className="bg-gray-200 p-4 border-2 border-black mb-6 items-center">
             <Text className="font-bold text-xs uppercase tracking-widest">Shelter QR Code Available</Text>
          </TouchableOpacity> */}

                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <SafeAreaView edges={['bottom']} className="bg-white border-t-2 border-black p-4">
                <TouchableOpacity
                    className="w-full h-14 bg-primary items-center justify-center shadow-md border-2 border-black active:translate-y-1 active:shadow-none"
                    onPress={() => Alert.alert('Adopt', 'Adoption request flow would start here!')}
                >
                    <Text className="text-white font-bold text-xl uppercase tracking-wider">Adopt Me</Text>
                </TouchableOpacity>
            </SafeAreaView>

            {/* Back Button */}
            <TouchableOpacity
                className="absolute top-12 left-4 w-10 h-10 bg-white border-2 border-black justify-center items-center shadow-md active:shadow-none active:translate-y-1"
                onPress={() => router.back()}
            >
                <FontAwesome name="arrow-left" size={20} color="black" />
            </TouchableOpacity>
        </View>
    );
}
