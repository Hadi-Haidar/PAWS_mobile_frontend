
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PetCard from '../components/PetCard';
import { useFavorites } from '../context/FavoritesContext';

export default function FavoritesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { favorites } = useFavorites();

    const renderItem = ({ item }) => (
        <PetCard pet={item} />
    );

    const EmptyComponent = () => (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 }}>
            <View style={{
                width: 100,
                height: 100,
                backgroundColor: '#fff',
                borderRadius: 50,
                borderWidth: 2,
                borderColor: '#000',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 0,
            }}>
                <MaterialCommunityIcons name="heart-broken" size={48} color="#FF6B00" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 8 }}>No Favorites Yet</Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', maxWidth: 250 }}>
                Start exploring and tap the heart icon to save your favorite pets here!
            </Text>
            <TouchableOpacity
                onPress={() => router.push('/(tabs)')}
                style={{
                    marginTop: 24,
                    backgroundColor: '#CCFF66',
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#000',
                    shadowColor: '#000',
                    shadowOffset: { width: 4, height: 4 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                }}
            >
                <Text style={{ fontSize: 16, fontWeight: '800', textTransform: 'uppercase' }}>Explore Pets</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFAF0' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFAF0" />

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
                zIndex: 10
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
                        elevation: 5,
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
                    My Favorites
                </Text>

                <View style={{ width: 44 }} />
            </View>

            <FlashList
                data={favorites}
                renderItem={renderItem}
                estimatedItemSize={250}
                numColumns={2}
                ListEmptyComponent={EmptyComponent}
                contentContainerStyle={{
                    paddingHorizontal: 10,
                    paddingTop: 16,
                    paddingBottom: 100
                }}
                keyExtractor={(item) => item.id.toString()}
            />
        </View>
    );
}
