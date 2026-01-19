import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getActivities } from '../../services/activity';

const TABS = ['All', 'Adoptions', 'Visits', 'Orders'];

export default function ActivityScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isTablet = width > 700;
    const [activeTab, setActiveTab] = useState('All');

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchActivities = async () => {
        setLoading(true);
        const { data } = await getActivities();
        setActivities(data || []);
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchActivities();
        }, [])
    );

    // Filter logic
    const filteredData = activeTab === 'All'
        ? activities
        : activities.filter(item => {
            if (activeTab === 'Adoptions') return item.type === 'ADOPTION';
            if (activeTab === 'Visits') return item.type === 'APPOINTMENT';
            if (activeTab === 'Orders') return item.type === 'SHOP';
            return true;
        });

    const renderItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => setSelectedItem(item)}
            activeOpacity={0.9}
            style={{
                backgroundColor: 'white',
                marginBottom: 16,
                borderRadius: 16,
                borderWidth: 3,
                borderColor: 'black',
                flexDirection: 'row',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 4,
                flex: isTablet ? 1 : 0,
                maxWidth: isTablet ? '48%' : '100%',
                marginRight: 0 // handled by columnWrapper or gap gap logic if supported, or manually
            }}
        >
            {/* Left Color Strip */}
            <View style={{ width: 12, backgroundColor: item.color || '#000', borderRightWidth: 3, borderRightColor: 'black' }} />

            <View style={{ flex: 1, padding: 16, flexDirection: 'row', gap: 12 }}>
                {/* Image or Icon */}
                <View style={{
                    width: 56, height: 56,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: 'black',
                    backgroundColor: '#f0f0f0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                }}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    ) : (
                        item.type === 'SHOP' ? <MaterialIcons name="shopping-bag" size={28} color="black" /> :
                            item.type === 'APPOINTMENT' ? <MaterialCommunityIcons name="doctor" size={28} color="black" /> :
                                <MaterialIcons name="notifications" size={28} color="black" />
                    )}
                </View>

                {/* Content */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase' }}>
                            {item.title}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#666' }}>
                            {new Date(item.date).toLocaleDateString()}
                        </Text>
                    </View>

                    <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 }}>
                        {item.subtitle}
                    </Text>

                    {/* Status Badge */}
                    <View style={{ alignSelf: 'flex-start', backgroundColor: 'black', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ color: item.statusColor || 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>
                            {item.status || 'Update'}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderDetails = () => {
        if (!selectedItem) return null;
        const { details, type } = selectedItem;

        if (!details) return (
            <View className="items-center py-8">
                <Text className="font-bold text-gray-500">No additional details available.</Text>
            </View>
        );

        if (type === 'SHOP') {
            return (
                <View>
                    <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 12 }}>Order Summary</Text>
                    <View style={{ gap: 12 }}>
                        {details.products && details.products.map((prod, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 8 }}>
                                <View>
                                    <Text style={{ fontWeight: '700', fontSize: 14 }}>{prod.name}</Text>
                                    <Text style={{ color: '#666', fontSize: 12 }}>Qty: {prod.quantity} x ${prod.price}</Text>
                                </View>
                                <Text style={{ fontWeight: '800' }}>${(prod.quantity * prod.price).toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 2, borderColor: '#000' }}>
                        <Text style={{ fontWeight: '900', fontSize: 16 }}>TOTAL</Text>
                        <Text style={{ fontWeight: '900', fontSize: 20, color: '#FF6B00' }}>${details.totalAmount?.toFixed(2)}</Text>
                    </View>

                    <View style={{ marginTop: 24, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontWeight: '800', fontSize: 13, marginBottom: 4, textTransform: 'uppercase' }}>Delivery To:</Text>
                        <Text style={{ fontSize: 14 }}>{details.deliveryAddress || 'No Address'}</Text>
                        <Text style={{ fontSize: 14, marginTop: 4 }}>{details.contactPhone || 'No Phone'}</Text>
                    </View>
                </View>
            );
        }

        if (type === 'APPOINTMENT') {
            return (
                <View style={{ gap: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ padding: 10, backgroundColor: '#E0F2F1', borderRadius: 50 }}>
                            <MaterialCommunityIcons name="paw" size={24} color="#009688" />
                        </View>
                        <View>
                            <Text style={{ fontSize: 12, color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>Patient</Text>
                            <Text style={{ fontSize: 16, fontWeight: '900' }}>{details.petName || 'Unknown Pet'}</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ padding: 10, backgroundColor: '#E3F2FD', borderRadius: 50 }}>
                            <MaterialCommunityIcons name="doctor" size={24} color="#2196F3" />
                        </View>
                        <View>
                            <Text style={{ fontSize: 12, color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>Veterinarian</Text>
                            <Text style={{ fontSize: 16, fontWeight: '900' }}>{details.doctorName || 'Any Available Vet'}</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ padding: 10, backgroundColor: '#FFF3E0', borderRadius: 50 }}>
                            <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#FF9800" />
                        </View>
                        <View>
                            <Text style={{ fontSize: 12, color: '#666', fontWeight: '700', textTransform: 'uppercase' }}>Reason</Text>
                            <Text style={{ fontSize: 16, fontWeight: '900' }}>{details.visitReason || 'Check-up'}</Text>
                        </View>
                    </View>

                </View>
            );
        }

        // Fallback for Adoption or other
        return (
            <View>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>{selectedItem.subtitle}</Text>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFAF0' }}>
            {/* Header */}
            <View style={{
                paddingTop: insets.top + 20,
                paddingBottom: 20,
                paddingHorizontal: 20,
                backgroundColor: '#FFFAF0',
                borderBottomWidth: 3,
                borderBottomColor: 'black',
                zIndex: 10
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 32, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Activity
                    </Text>
                    <View style={{
                        width: 44, height: 44,
                        backgroundColor: '#CCFF66',
                        borderRadius: 22,
                        borderWidth: 2,
                        borderColor: 'black',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0
                    }}>
                        <MaterialIcons name="history" size={26} color="black" />
                    </View>
                </View>

                {/* Filter Tabs */}
                <View style={{ flexDirection: 'row', marginTop: 24, gap: 10 }}>
                    <FlatList
                        data={TABS}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12 }}
                        renderItem={({ item }) => {
                            const isActive = activeTab === item;
                            return (
                                <TouchableOpacity
                                    onPress={() => setActiveTab(item)}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        backgroundColor: isActive ? 'black' : 'white',
                                        borderRadius: 12,
                                        borderWidth: 2,
                                        borderColor: 'black',
                                        shadowColor: isActive ? 'transparent' : '#000',
                                        shadowOffset: { width: 2, height: 2 },
                                        shadowOpacity: isActive ? 0 : 1,
                                        shadowRadius: 0,
                                        transform: [{ translateY: isActive ? 2 : 0 }] // subtle press effect state
                                    }}
                                >
                                    <Text style={{
                                        color: isActive ? '#CCFF66' : 'black',
                                        fontWeight: '900',
                                        textTransform: 'uppercase',
                                        fontSize: 12
                                    }}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#000" />
                </View>
            ) : (
                <FlatList
                    key={isTablet ? 'tablet-grid' : 'phone-list'}
                    data={filteredData}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    numColumns={isTablet ? 2 : 1}
                    columnWrapperStyle={isTablet ? { justifyContent: 'space-between' } : null}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 60, opacity: 0.5 }}>
                            <MaterialCommunityIcons name="timeline-text-outline" size={80} color="black" />
                            <Text style={{ marginTop: 16, fontSize: 18, fontWeight: 'bold' }}>No activity yet</Text>
                            <Text style={{ marginTop: 8, fontSize: 14, color: '#666', textAlign: 'center', maxWidth: 250 }}>
                                Try adopting a pet, booking an appointment, or making a purchase!
                            </Text>
                        </View>
                    }
                />
            )}

            {/* DETAILS MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={!!selectedItem}
                onRequestClose={() => setSelectedItem(null)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: isTablet ? 'center' : 'flex-end',
                    alignItems: isTablet ? 'center' : 'stretch',
                    padding: isTablet ? 20 : 0
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        borderRadius: isTablet ? 24 : 0,
                        borderTopLeftRadius: isTablet ? 24 : 30,
                        borderTopRightRadius: isTablet ? 24 : 30,
                        borderWidth: 3,
                        borderColor: 'black',
                        maxHeight: '80%',
                        width: isTablet ? 600 : '100%',
                        padding: 24,
                        paddingBottom: isTablet ? 24 : 40,
                        alignSelf: isTablet ? 'center' : undefined,
                        shadowColor: '#000',
                        shadowOffset: { width: 8, height: 8 },
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                    }}>
                        {/* Modal Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <View>
                                <Text style={{ fontSize: 24, fontWeight: '900', textTransform: 'uppercase' }}>
                                    {selectedItem?.title}
                                </Text>
                                <Text style={{ color: '#666', fontWeight: '700' }}>
                                    {selectedItem && new Date(selectedItem.date).toLocaleString()}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setSelectedItem(null)}
                                style={{ padding: 8, backgroundColor: '#f0f0f0', borderRadius: 50, borderWidth: 2 }}
                            >
                                <MaterialIcons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {renderDetails()}
                        </ScrollView>

                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={() => setSelectedItem(null)}
                            style={{
                                marginTop: 24,
                                backgroundColor: 'black',
                                paddingVertical: 16,
                                borderRadius: 16,
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: 'black'
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                                Close
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
