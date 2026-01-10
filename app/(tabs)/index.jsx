import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PetCard from '../../components/PetCard';
import { useAuth } from '../../context/AuthContext';
import { getPets } from '../../services/pets';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: 'paw' },
    { id: 'Dog', label: 'Dogs', icon: 'dog' },
    { id: 'Cat', label: 'Cats', icon: 'cat' },
    { id: 'Bird', label: 'Birds', icon: 'bird' },
    { id: 'Fish', label: 'Fish', icon: 'fish' },
];

export default function HomeScreen() {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const fetchPets = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const filters = {};
        if (selectedCategory !== 'all') filters.type = selectedCategory;
        if (searchQuery) filters.search = searchQuery;

        const { data, error } = await getPets(filters);

        if (!error && data) {
            setPets(data);
        }

        setLoading(false);
        setRefreshing(false);
    }, [selectedCategory, searchQuery]);

    useEffect(() => {
        fetchPets();
    }, [fetchPets]);

    const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Human';

    // Header Component for FlashList
    const ListHeader = () => (
        <>
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingTop: insets.top + 8,
                paddingBottom: 12,
                borderBottomWidth: 2,
                borderBottomColor: '#000',
                backgroundColor: '#FFFAF0',
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    {/* Profile Image */}
                    <TouchableOpacity
                        onPress={() => router.push('/profile')}
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            borderWidth: 2,
                            borderColor: '#000',
                            overflow: 'hidden',
                            backgroundColor: '#e5e5e5',
                            shadowColor: '#000',
                            shadowOffset: { width: 2, height: 2 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                        }}
                    >
                        <Image
                            source={{ uri: user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/100' }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                        />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <View
                            style={{
                                backgroundColor: '#CCFF66',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderWidth: 1,
                                borderColor: '#000',
                                alignSelf: 'flex-start',
                                marginBottom: 4,
                                shadowColor: '#000',
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 1,
                                shadowRadius: 0,
                            }}
                        >
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#000', textTransform: 'uppercase', letterSpacing: 0.5 }}>Welcome back</Text>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#000' }} numberOfLines={1}>Hello, {userName}! 👋</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={{
                        width: 48,
                        height: 48,
                        backgroundColor: '#FF6B00',
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: '#000',
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                    }}
                >
                    <MaterialCommunityIcons name="qrcode-scan" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        borderWidth: 2,
                        borderColor: '#000',
                        borderRadius: 12,
                        height: 56,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                    }}
                >
                    <View style={{ paddingLeft: 16 }}>
                        <MaterialCommunityIcons name="magnify" size={24} color="black" />
                    </View>
                    <TextInput
                        style={{ flex: 1, paddingHorizontal: 12, fontSize: 16, fontWeight: '600', color: '#000' }}
                        placeholder="Search breed, age..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={() => fetchPets()}
                    />
                    <TouchableOpacity style={{
                        height: '100%',
                        aspectRatio: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderLeftWidth: 2,
                        borderLeftColor: '#000',
                        backgroundColor: '#CCFF66'
                    }}>
                        <MaterialCommunityIcons name="tune-variant" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Category Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}
            >
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        onPress={() => setSelectedCategory(cat.id)}
                        style={[
                            {
                                flexDirection: 'row',
                                alignItems: 'center',
                                height: 40,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                                borderWidth: 2,
                            },
                            selectedCategory === cat.id
                                ? {
                                    backgroundColor: '#000',
                                    borderColor: 'transparent',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 4, height: 4 },
                                    shadowOpacity: 1,
                                    shadowRadius: 0,
                                }
                                : {
                                    backgroundColor: '#fff',
                                    borderColor: '#000',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 1,
                                    shadowRadius: 0,
                                }
                        ]}
                    >
                        <MaterialCommunityIcons
                            name={cat.icon}
                            size={18}
                            color={selectedCategory === cat.id ? '#FF6B00' : '#000'}
                        />
                        <Text style={{
                            marginLeft: 8,
                            fontSize: 13,
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            color: selectedCategory === cat.id ? '#fff' : '#000',
                        }}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </>
    );

    const renderItem = ({ item }) => (
        <PetCard pet={item} />
    );

    const EmptyComponent = () => (
        !loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, width: '100%' }}>
                <MaterialCommunityIcons name="paw-off" size={48} color="#ccc" />
                <Text style={{ color: '#9CA3AF', fontSize: 18, fontWeight: '700', marginTop: 16 }}>No pets found</Text>
            </View>
        ) : null
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFAF0' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFAF0" />

            {loading && pets.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ListHeader />
                    <View style={{ paddingVertical: 40 }}>
                        <ActivityIndicator size="large" color="#FF6B00" />
                    </View>
                </View>
            ) : (
                <FlashList
                    data={pets}
                    renderItem={renderItem}
                    estimatedItemSize={250}
                    numColumns={2}
                    ListHeaderComponent={ListHeader}
                    ListEmptyComponent={EmptyComponent}
                    contentContainerStyle={{
                        paddingHorizontal: 10,
                        paddingBottom: 20
                    }}
                    keyExtractor={(item) => item.id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchPets(true)} colors={['#FF6B00']} />
                    }
                />
            )}
        </View>
    );
}
