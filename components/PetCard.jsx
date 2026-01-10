
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const PetCard = ({ pet }) => {
    const imageUrl = pet.images && pet.images.length > 0 ? pet.images[0] : 'https://via.placeholder.com/300';

    return (
        <Link href={`/pet/${pet.id}`} asChild>
            <TouchableOpacity className="bg-surface mb-6 mx-4 p-0 shadow-md border-2 border-black active:translate-y-1 active:shadow-none">
                <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-48 border-b-2 border-black"
                    contentFit="cover"
                    transition={200}
                />
                <View className="p-4 bg-white">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-xl font-bold text-black">{pet.name}</Text>
                        <View className="bg-secondary px-2 py-1 border-2 border-black rounded-full">
                            <Text className="text-xs font-bold">{pet.type}</Text>
                        </View>
                    </View>
                    <Text className="text-text-secondary line-clamp-2 mb-3 h-10">
                        {pet.description}
                    </Text>
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                        <Text className="text-xs font-bold text-black">{pet.location}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );
};

export default memo(PetCard);
