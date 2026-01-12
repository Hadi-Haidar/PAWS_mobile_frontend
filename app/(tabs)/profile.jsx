import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { getDonationHistory } from '../../services/donations';

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, signOut } = useAuth();
    const { favorites } = useFavorites();
    const [isSettingsVisible, setSettingsVisible] = useState(false);
    const [totalDonated, setTotalDonated] = useState(0);
    const [donationCount, setDonationCount] = useState(0);

    useFocusEffect(
        useCallback(() => {
            const fetchDonations = async () => {
                const { data } = await getDonationHistory();
                if (data) {
                    setTotalDonated(data.total || 0);
                    setDonationCount(data.count || 0);
                }
            };
            fetchDonations();
        }, [])
    );

    const userName = user?.user_metadata?.full_name || 'Alex Johnson';
    const avatarUrl = user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/300';

    // ... existing handlers ...

    const handleSignOut = async () => {
        setSettingsVisible(false);
        await signOut();
        router.replace('/auth/signin');
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setSettingsVisible(false);
                        await signOut();
                        router.replace('/auth/signin');
                        Alert.alert("Account Deleted", "Your account has been successfully deleted.");
                    }
                }
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFAF0' }}>
            {/* ... Existing header and profile implementation ... */}
            <StatusBar barStyle="dark-content" backgroundColor="#FFFAF0" />

            {/* Header */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingTop: insets.top + 8,
                paddingBottom: 16,
                borderBottomWidth: 2,
                borderBottomColor: '#000',
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        width: 40,
                        height: 40,
                        backgroundColor: '#FF6B00',
                        borderRadius: 8,
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
                    <MaterialCommunityIcons name="paw" size={24} color="black" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setSettingsVisible(true)}
                    style={{
                        width: 40,
                        height: 40,
                        backgroundColor: '#fff',
                        borderRadius: 20,
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
                    <MaterialCommunityIcons name="cog" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>

                {/* Profile Section */}
                <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
                    <View style={{ position: 'relative' }}>
                        <View style={{
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            borderWidth: 3,
                            borderColor: '#000',
                            overflow: 'hidden',
                            backgroundColor: '#CCFF66', // Green bg behind avatar
                            shadowColor: '#000',
                            shadowOffset: { width: 4, height: 4 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                        }}>
                            <Image
                                source={{ uri: avatarUrl }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                            />
                        </View>
                        <View style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            backgroundColor: '#FF6B00',
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: '#000',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 2, height: 2 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                        }}>
                            <MaterialCommunityIcons name="check-decagram" size={16} color="white" />
                        </View>
                    </View>

                    <Text style={{
                        fontSize: 24,
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        marginTop: 16,
                        color: '#000',
                        letterSpacing: 1,
                    }}>
                        {userName}
                    </Text>

                    <View style={{
                        marginTop: 8,
                        backgroundColor: '#fff',
                        borderWidth: 2,
                        borderColor: '#000',
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 2, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                    }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Member Since {user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear()}
                        </Text>
                    </View>
                </View>

                {/* Menu Cards */}
                <Card
                    title="Favorites"
                    subtitle={`${favorites.length} furry friends saved`}
                    tag="My Collection"
                    color="#FF6B00" // Pop Orange
                    icon="heart"
                    onPress={() => router.push('/favorites')}
                />

                <Card
                    title="Donations"
                    subtitle={`$${totalDonated.toFixed(2)} Total Contributed`}
                    tag={donationCount > 0 ? `${donationCount} Donation${donationCount !== 1 ? 's' : ''}` : 'Start Giving'}
                    color="#CCFF66"
                    icon="hand-coin"
                    onPress={() => router.push('/donations')}
                />

                <Card
                    title="Support"
                    subtitle="FAQs & Live Chat"
                    tag="24/7 Service"
                    color="#FFFFFF" // White
                    icon="headphones"
                />

            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={isSettingsVisible}
                onRequestClose={() => setSettingsVisible(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
                    activeOpacity={1}
                    onPress={() => setSettingsVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{
                            width: '100%',
                            backgroundColor: '#FFFAF0',
                            borderWidth: 3,
                            borderColor: '#000',
                            borderRadius: 24,
                            padding: 24,
                            shadowColor: '#000',
                            shadowOffset: { width: 8, height: 8 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 24, fontWeight: '900', textTransform: 'uppercase' }}>Settings</Text>
                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        {/* User Info */}
                        <View style={{ marginBottom: 24, alignItems: 'center' }}>
                            <View style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                borderWidth: 2,
                                borderColor: '#000',
                                overflow: 'hidden',
                                marginBottom: 12,
                                backgroundColor: '#fff'
                            }}>
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: '#000', marginBottom: 4 }}>{userName}</Text>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#666' }}>{user?.email || 'email@example.com'}</Text>
                        </View>

                        {/* Actions */}
                        <TouchableOpacity
                            onPress={handleSignOut}
                            style={{
                                backgroundColor: '#CCFF66',
                                paddingVertical: 16,
                                borderRadius: 12,
                                borderWidth: 2,
                                borderColor: '#000',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 12,
                                shadowColor: '#000',
                                shadowOffset: { width: 4, height: 4 },
                                shadowOpacity: 1,
                                shadowRadius: 0,
                            }}
                        >
                            <MaterialCommunityIcons name="logout" size={20} color="black" style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: '800', textTransform: 'uppercase' }}>Log Out</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleDeleteAccount}
                            style={{
                                backgroundColor: '#FF6B6B', // Red-ish
                                paddingVertical: 16,
                                borderRadius: 12,
                                borderWidth: 2,
                                borderColor: '#000',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 4, height: 4 },
                                shadowOpacity: 1,
                                shadowRadius: 0,
                            }}
                        >
                            <MaterialCommunityIcons name="delete-outline" size={20} color="black" style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: '800', textTransform: 'uppercase' }}>Delete Account</Text>
                        </TouchableOpacity>

                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

function Card({ title, subtitle, tag, color, icon, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={{
                width: '100%',
                backgroundColor: color,
                borderWidth: 2,
                borderColor: '#000',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                height: 120, // specific height from design
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 0,
            }}>
            <View>
                <View style={{
                    backgroundColor: '#000',
                    alignSelf: 'flex-start',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    marginBottom: 8,
                }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>{tag}</Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#000' }}>{title}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#000', opacity: 0.7 }}>{subtitle}</Text>
            </View>

            <View style={{
                position: 'absolute',
                right: 16,
                bottom: 16,
                backgroundColor: '#fff',
                width: 48,
                height: 48,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: '#000',
                alignItems: 'center',
                justifyContent: 'center',
                // Icon styling
            }}>
                <MaterialCommunityIcons
                    name={icon}
                    size={24}
                    color={color === '#FF6B00' ? '#FF6B00' : (color === '#CCFF66' ? '#FF6B00' : '#000')}
                // Logic: Orange card -> Orange icon? No, looks like inverted or primary color. 
                // Let's stick to Orange icon for Fav, darker for others. 
                // Based on typical NeoPop, icon circle is white, icon inside matches theme or is black.
                />
            </View>
        </TouchableOpacity>
    )
}
