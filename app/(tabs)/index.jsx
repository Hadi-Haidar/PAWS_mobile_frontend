
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AiChatModal from '../../components/AiChatModal';
import AiLine from '../../components/AiLine';
import PetCard from '../../components/PetCard';
import { useAuth } from '../../context/AuthContext';
import { deletePet, getPets } from '../../services/pets';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: 'paw' },
    { id: 'mine', label: 'My Pets', icon: 'account-heart' },
    { id: 'Dog', label: 'Dogs', icon: 'dog' },
    { id: 'Cat', label: 'Cats', icon: 'cat' },
    { id: 'Bird', label: 'Birds', icon: 'bird' },
    { id: 'Fish', label: 'Fish', icon: 'fish' },
];

// Memoized Category Button to prevent re-renders
const CategoryButton = memo(({ cat, isSelected, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            {
                flexDirection: 'row',
                alignItems: 'center',
                height: 40,
                paddingHorizontal: 16,
                borderRadius: 8,
                borderWidth: 2,
            },
            isSelected
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
            color={isSelected ? '#FF6B00' : '#000'}
        />
        <Text style={{
            marginLeft: 8,
            fontSize: 13,
            fontWeight: '700',
            textTransform: 'uppercase',
            color: isSelected ? '#fff' : '#000',
        }}>
            {cat.label}
        </Text>
    </TouchableOpacity>
));

CategoryButton.displayName = 'CategoryButton';

export default function HomeScreen() {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Selection mode state
    const [selectedPet, setSelectedPet] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showAi, setShowAi] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const isFirstRender = useRef(true);

    // Memoize userName to prevent recalculation
    const userName = useMemo(() => {
        return user?.user_metadata?.full_name?.split(' ')[0] || 'Human';
    }, [user?.user_metadata?.full_name]);

    // Memoize avatar URL
    const avatarUrl = useMemo(() => {
        return user?.user_metadata?.avatar_url || null;
    }, [user?.user_metadata?.avatar_url]);

    useFocusEffect(
        useCallback(() => {
            const loadAiMode = async () => {
                try {
                    const savedMode = await AsyncStorage.getItem('AI_MODE');
                    if (savedMode !== null) {
                        setShowAi(savedMode === 'true');
                    }
                } catch (e) {
                    console.error('Failed to load AI mode', e);
                }
            };
            loadAiMode();
        }, [])
    );

    const fetchPets = useCallback(async (isRefresh = false, showLoading = true) => {
        if (isRefresh) {
            setRefreshing(true);
        } else if (showLoading && !initialLoad) {
            // Only show loading spinner for non-initial fetches if explicitly requested
            // This prevents the jank when switching categories
        }

        const filters = {};
        if (selectedCategory === 'mine') {
            if (user?.id) filters.ownerId = user.id;
        } else if (selectedCategory !== 'all') {
            filters.type = selectedCategory;
        }
        if (searchQuery) filters.search = searchQuery;

        const { data, error } = await getPets(filters);

        if (!error && data) {
            setPets(data);
        }

        setLoading(false);
        setRefreshing(false);
        setInitialLoad(false);
    }, [selectedCategory, searchQuery, initialLoad, user?.id]);

    // Initial load
    useEffect(() => {
        fetchPets(false, true);
    }, []);

    // Category/search changes - fetch without full loading state
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        // Fetch without showing loading spinner to prevent jank
        fetchPets(false, false);
    }, [selectedCategory, searchQuery]);

    const handleCategoryPress = useCallback((catId) => {
        setSelectedCategory(catId);
        // Exit selection mode when changing category
        setSelectedPet(null);
    }, []);

    const handleSearchSubmit = useCallback(() => {
        fetchPets(false, false);
    }, [fetchPets]);

    const handleRefresh = useCallback(() => {
        fetchPets(true, false);
    }, [fetchPets]);

    // Handle long press on pet card
    const handlePetLongPress = useCallback((pet) => {
        // Only allow selection of user's own pets
        if (pet.ownerId === user?.id) {
            if (selectedPet?.id === pet.id) {
                // Deselect if already selected
                setSelectedPet(null);
            } else {
                setSelectedPet(pet);
            }
        } else {
            // Not the owner
            Alert.alert('Not Your Pet', 'You can only edit or delete pets you have added.');
        }
    }, [user?.id, selectedPet]);

    // Cancel selection
    const handleCancelSelection = useCallback(() => {
        setSelectedPet(null);
    }, []);

    // Edit selected pet
    const handleEditPet = useCallback(() => {
        if (selectedPet) {
            router.push(`/edit-pet/${selectedPet.id}`);
            setSelectedPet(null);
        }
    }, [selectedPet, router]);

    // Delete selected pet
    const handleDeletePet = useCallback(() => {
        if (!selectedPet) return;

        Alert.alert(
            'Delete Pet',
            `Are you sure you want to delete "${selectedPet.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        const { error } = await deletePet(selectedPet.id);
                        setIsDeleting(false);

                        if (error) {
                            Alert.alert('Error', 'Failed to delete pet. Please try again.');
                        } else {
                            Alert.alert('Success', `${selectedPet.name} has been removed.`);
                            setSelectedPet(null);
                            // Refresh the list
                            fetchPets(true, false);
                        }
                    }
                }
            ]
        );
    }, [selectedPet, fetchPets]);

    // Memoized render item with selection support
    const renderItem = useCallback(({ item }) => (
        <PetCard
            pet={item}
            isSelected={selectedPet?.id === item.id}
            selectionMode={!!selectedPet}
            onLongPress={handlePetLongPress}
        />
    ), [selectedPet, handlePetLongPress]);

    // Memoized key extractor
    const keyExtractor = useCallback((item) => item.id.toString(), []);

    // Memoized empty component
    const EmptyComponent = useMemo(() => (
        !loading && !initialLoad ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, width: '100%' }}>
                <MaterialCommunityIcons name="paw-off" size={48} color="#ccc" />
                <Text style={{ color: '#9CA3AF', fontSize: 18, fontWeight: '700', marginTop: 16 }}>No pets found</Text>
            </View>
        ) : null
    ), [loading, initialLoad]);

    // Selection Mode Header
    const SelectionHeader = useMemo(() => (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            borderBottomWidth: 2,
            borderBottomColor: '#000',
            backgroundColor: '#FF6B00',
        }}>
            {/* Cancel Button */}
            <TouchableOpacity
                onPress={handleCancelSelection}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    height: 44,
                    paddingHorizontal: 12,
                    backgroundColor: '#fff',
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: '#000',
                    shadowColor: '#000',
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                }}
            >
                <MaterialCommunityIcons name="close" size={20} color="black" />
                <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '800', color: '#000' }}>Cancel</Text>
            </TouchableOpacity>

            {/* Selected Pet Name */}
            <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'center' }} numberOfLines={1}>
                    {selectedPet?.name}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
                    SELECTED
                </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* Edit Button */}
                <TouchableOpacity
                    onPress={handleEditPet}
                    style={{
                        width: 44,
                        height: 44,
                        backgroundColor: '#CCFF66',
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
                    <MaterialCommunityIcons name="pencil" size={22} color="black" />
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                    onPress={handleDeletePet}
                    disabled={isDeleting}
                    style={{
                        width: 44,
                        height: 44,
                        backgroundColor: '#FF6B6B',
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
                    {isDeleting ? (
                        <ActivityIndicator size="small" color="black" />
                    ) : (
                        <MaterialCommunityIcons name="delete" size={22} color="black" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    ), [insets.top, selectedPet, handleCancelSelection, handleEditPet, handleDeletePet, isDeleting]);

    // Normal Header
    const NormalHeader = useMemo(() => (
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
            {/* Left Side: Profile & Notification */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
                    {avatarUrl ? (
                        <Image
                            source={{ uri: avatarUrl }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#CCFF66' }}>
                            <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>
                                {userName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Notification Button - Transparent, no bg */}
                <TouchableOpacity
                    onPress={() => Alert.alert('Notifications', 'No new notifications')}
                    style={{
                        width: 40,
                        height: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <MaterialCommunityIcons name="bell" size={28} color="#99CC00" />
                </TouchableOpacity>
            </View>

            {/* Center: AI Robot Timeline */}
            <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => setIsChatOpen(true)}
            >
                {showAi && <AiLine />}
            </TouchableOpacity>

            {/* Right Side: QR Scanner */}
            <TouchableOpacity
                onPress={() => router.push('/qr-scanner')}
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
    ), [insets.top, avatarUrl, router, showAi, setIsChatOpen]);

    // Memoized Header Component - CRITICAL: Must be stable to prevent FlashList re-measuring
    const ListHeader = useMemo(() => (
        <>
            {/* Search Bar - Fixed height to prevent collapse */}
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
                        minHeight: 56, // Ensure minimum height
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                    }}
                >
                    <View style={{ paddingLeft: 16, width: 48 }}>
                        <MaterialCommunityIcons name="magnify" size={24} color="black" />
                    </View>
                    <TextInput
                        style={{
                            flex: 1,
                            paddingHorizontal: 12,
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#000',
                            height: '100%', // Full height
                        }}
                        placeholder="Search name, age, location..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearchSubmit}
                    />
                    <TouchableOpacity style={{
                        height: '100%',
                        width: 56, // Fixed width instead of aspectRatio
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
                    <CategoryButton
                        key={cat.id}
                        cat={cat}
                        isSelected={selectedCategory === cat.id}
                        onPress={() => handleCategoryPress(cat.id)}
                    />
                ))}
            </ScrollView>
        </>
    ), [searchQuery, selectedCategory, handleCategoryPress, handleSearchSubmit]);

    // Memoized refresh control
    const refreshControl = useMemo(() => (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B00']}
            tintColor="#FF6B00"
        />
    ), [refreshing, handleRefresh]);

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFAF0' }}>
            <StatusBar barStyle="dark-content" backgroundColor={selectedPet ? '#FF6B00' : '#FFFAF0'} />

            {/* Conditional Header */}
            {selectedPet ? SelectionHeader : NormalHeader}

            {/* Fixed Search Bar */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFAF0' }}>
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
                    <View style={{ paddingLeft: 16, width: 48 }}>
                        <MaterialCommunityIcons name="magnify" size={24} color="black" />
                    </View>
                    <TextInput
                        style={{
                            flex: 1,
                            paddingHorizontal: 12,
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#000',
                            height: '100%',
                        }}
                        placeholder="Search name..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearchSubmit}
                    />
                    <TouchableOpacity style={{
                        height: '100%',
                        width: 56,
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

            {/* Fixed Category Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 12 }}
                style={{ flexGrow: 0, backgroundColor: '#FFFAF0' }}
            >
                {CATEGORIES.map((cat) => (
                    <CategoryButton
                        key={cat.id}
                        cat={cat}
                        isSelected={selectedCategory === cat.id}
                        onPress={() => handleCategoryPress(cat.id)}
                    />
                ))}
            </ScrollView>

            {/* Scrollable Pet List */}
            <View style={{ flex: 1 }}>
                <FlashList
                    data={pets}
                    renderItem={renderItem}
                    estimatedItemSize={250}
                    numColumns={2}
                    ListEmptyComponent={initialLoad ? (
                        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#FF6B00" />
                        </View>
                    ) : EmptyComponent}
                    contentContainerStyle={{
                        paddingHorizontal: 10,
                        paddingBottom: 100,
                        paddingTop: 8
                    }}
                    keyExtractor={keyExtractor}
                    refreshControl={refreshControl}
                    extraData={selectedPet}
                    drawDistance={250}
                    overrideItemLayout={(layout, item, index) => {
                        layout.size = 250;
                    }}
                />
            </View>

            {/* Floating Action Button - Hide in selection mode */}
            {!selectedPet && (
                <TouchableOpacity
                    onPress={() => router.push('/add-animal')}
                    style={{
                        position: 'absolute',
                        bottom: 24,
                        right: 24,
                        width: 64,
                        height: 64,
                        backgroundColor: '#FF6B00',
                        borderRadius: 32,
                        borderWidth: 2,
                        borderColor: '#000',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 5,
                        zIndex: 100
                    }}
                >
                    <MaterialCommunityIcons name="plus" size={32} color="black" />
                </TouchableOpacity>
            )}
            {/* AI Chat Modal */}
            <AiChatModal visible={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </View>
    );
}
