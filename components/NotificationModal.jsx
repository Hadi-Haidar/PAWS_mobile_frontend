import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearNotifications, getNotifications, markNotificationAsRead } from '../services/notifications';
import socket from '../services/socket';

const TABS = [
    { id: 'pet_status', label: 'Pet Status', icon: 'paw' },
    { id: 'new_chat', label: 'Messages', icon: 'chat' },
    { id: 'appointment_update', label: 'Appointments', icon: 'calendar-clock' },
];

export default function NotificationModal({ visible, onClose, onNotificationCountChange }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pet_status');
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (visible) {
            loadNotifications();
        }
    }, [visible]);

    // Real-time updates inside modal
    useEffect(() => {
        if (!visible) return;

        const handleNew = (newNotif) => {
            setNotifications(prev => {
                const updated = [newNotif, ...prev];
                const count = updated.filter(n => !n.isRead).reduce((sum, n) => sum + (n.data?.count || 1), 0);
                onNotificationCountChange?.(count);
                return updated;
            });
        };

        const handleUpdate = (data) => {
            setNotifications(prev => {
                const updated = prev.map(n => n.id === data.id ? { ...n, message: data.message, data: { ...n.data, count: data.count } } : n);
                const count = updated.filter(n => !n.isRead).reduce((sum, n) => sum + (n.data?.count || 1), 0);
                onNotificationCountChange?.(count);
                return updated;
            });
        };

        socket.on('new_notification', handleNew);
        socket.on('notification_updated', handleUpdate);

        return () => {
            socket.off('new_notification', handleNew);
            socket.off('notification_updated', handleUpdate);
        };
    }, [visible]);

    const loadNotifications = async () => {
        setLoading(true);
        const { data } = await getNotifications();
        setNotifications(data || []);
        setLoading(false);

        // Update unread count
        const unreadCount = (data || []).filter(n => !n.isRead).reduce((sum, n) => sum + (n.data?.count || 1), 0);
        onNotificationCountChange?.(unreadCount);
    };

    const handleMarkAsRead = async (id) => {
        await markNotificationAsRead(id);

        const updatedNotifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        setNotifications(updatedNotifications);

        const unreadCount = updatedNotifications.filter(n => !n.isRead).reduce((sum, n) => sum + (n.data?.count || 1), 0);
        onNotificationCountChange?.(unreadCount);
    };

    const handleClearAll = async () => {
        await clearNotifications();
        setNotifications([]);
        onNotificationCountChange?.(0);
    };

    const filteredNotifications = notifications.filter(n => n.type === activeTab);
    const unreadByTab = (type) => notifications.filter(n => n.type === type && !n.isRead).length;

    const renderNotification = ({ item }) => (
        <TouchableOpacity
            onPress={() => handleMarkAsRead(item.id)}
            className={`flex-row items-start p-4 mb-3 rounded-xl border-2 border-black ${item.isRead ? 'bg-gray-100' : 'bg-white'}`}
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 3
            }}
        >
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${item.isRead ? 'bg-gray-300' : 'bg-primary'}`}>
                <MaterialCommunityIcons
                    name={activeTab === 'pet_status' ? 'paw' : activeTab === 'new_chat' ? 'chat' : 'calendar'}
                    size={20}
                    color={item.isRead ? '#666' : '#000'}
                />
            </View>
            <View className="flex-1">
                <Text className={`font-bold text-base ${item.isRead ? 'text-gray-500' : 'text-black'}`}>
                    {item.title}
                </Text>
                <Text className={`text-sm mt-1 ${item.isRead ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.message}
                </Text>
                <Text className="text-xs text-gray-400 mt-2">
                    {new Date(item.createdAt).toLocaleString()}
                </Text>
            </View>
            {!item.isRead && (
                <View className="w-3 h-3 rounded-full bg-red-500 absolute top-2 right-2" />
            )}
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/50">
                <View
                    className="flex-1 bg-background mt-20 rounded-t-3xl border-t-2 border-x-2 border-black"
                    style={{ paddingBottom: insets.bottom }}
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-5 py-4 border-b-2 border-black">
                        <Text className="text-2xl font-black">Notifications</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={handleClearAll}
                                className="bg-gray-200 px-3 py-2 rounded-lg border border-black"
                            >
                                <Text className="font-bold text-xs">Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={onClose}
                                className="bg-black p-2 rounded-lg"
                            >
                                <MaterialCommunityIcons name="close" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View className="flex-row px-4 py-3 gap-2">
                        {TABS.map(tab => (
                            <TouchableOpacity
                                key={tab.id}
                                onPress={() => setActiveTab(tab.id)}
                                className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border-2 ${activeTab === tab.id
                                    ? 'bg-black border-black'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                <MaterialCommunityIcons
                                    name={tab.icon}
                                    size={16}
                                    color={activeTab === tab.id ? '#FF6B00' : '#666'}
                                />
                                <Text className={`ml-1 text-xs font-bold ${activeTab === tab.id ? 'text-white' : 'text-gray-600'
                                    }`}>
                                    {tab.label}
                                </Text>
                                {unreadByTab(tab.id) > 0 && (
                                    <View className="bg-red-500 rounded-full w-4 h-4 items-center justify-center ml-1">
                                        <Text className="text-white text-[10px] font-bold">{unreadByTab(tab.id)}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#FF6B00" />
                        </View>
                    ) : (
                        <FlatList
                            data={filteredNotifications}
                            keyExtractor={(item) => item.id}
                            renderItem={renderNotification}
                            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
                            ListEmptyComponent={
                                <View className="flex-1 items-center justify-center py-20">
                                    <MaterialCommunityIcons name="bell-off-outline" size={48} color="#ccc" />
                                    <Text className="text-gray-400 font-bold mt-4">No notifications</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}
