
import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PetCard from '../../components/PetCard';
import { getPets } from '../../services/pets';

export default function HomeScreen() {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadPets = async () => {
        if (loading) return;
        setLoading(true);
        const { data } = await getPets();
        setPets(data || []);
        setLoading(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadPets();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadPets();
    }, []);

    const renderItem = ({ item }) => <PetCard pet={item} />;

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="px-4 py-4 border-b-2 border-black mb-2 bg-primary">
                <Text className="text-2xl font-bold text-white">Find a Friend 🐾</Text>
            </View>

            {loading && !refreshing && pets.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#FF6F00" />
                </View>
            ) : (
                <FlashList
                    data={pets}
                    renderItem={renderItem}
                    estimatedItemSize={300}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        !loading && (
                            <View className="flex-1 justify-center items-center mt-20">
                                <Text className="text-lg font-bold">No pets found.</Text>
                            </View>
                        )
                    }
                />
            )}
        </SafeAreaView>
    );
}
