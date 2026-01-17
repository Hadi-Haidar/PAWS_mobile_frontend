import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getInbox } from '../../services/chat';
import socket from '../../services/socket';

export default function MessagesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadInbox = async () => {
        if (!user) return;
        // Don't set loading to true on background refreshes to avoid flicker
        // Only on initial load if empty
        if (conversations.length === 0) setLoading(true);

        const { data, error } = await getInbox();

        if (data) {
            const formatted = data.map(msg => ({
                id: msg.otherUserId,
                name: msg.name, // If this is 'Unknown User', we know why
                lastMessage: msg.content,
                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                avatar: 'https://via.placeholder.com/150',
                unread: !msg.isRead && msg.receiverId === user.id
            }));
            setConversations(formatted);
        } else {
            console.error("Inbox load error:", error);
        }
        setLoading(false);
    };

    // Reload when tab is focused (just once to ensure sync)
    useFocusEffect(
        useCallback(() => {
            loadInbox();
            return () => { };
        }, [user])
    );

    useEffect(() => {
        if (!user) return;

        if (!socket.connected) socket.connect();
        socket.emit("join_chat", user.id);

        const onReceiveMessage = (newMessage) => {
            setConversations(prev => {
                const otherId = newMessage.senderId === user.id ? newMessage.receiverId : newMessage.senderId;
                const existingIndex = prev.findIndex(c => c.id === otherId);
                let updatedList = [...prev];

                if (existingIndex > -1) {
                    // Update existing conversation
                    const [existingItem] = updatedList.splice(existingIndex, 1);
                    updatedList.unshift({
                        ...existingItem,
                        lastMessage: newMessage.content,
                        time: new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        unread: newMessage.receiverId === user.id // Mark unread if I am receiving
                    });
                } else {
                    // Add new conversation (Name comes from backend now)
                    updatedList.unshift({
                        id: otherId,
                        name: newMessage.senderName || 'New Message',
                        lastMessage: newMessage.content,
                        time: new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        avatar: 'https://via.placeholder.com/150',
                        unread: true
                    });
                }
                return updatedList;
            });
        };

        socket.on("receive_message", onReceiveMessage);

        // We also want to update the inbox instantly if WE send a message from the Chat screen (if sending from PetCard, we are on a different screen, but if we go back...)
        // Actually message_sent event usually goes to the specific socket that sent it, but good to listen.
        socket.on("message_sent", onReceiveMessage);

        return () => {
            socket.off("receive_message", onReceiveMessage);
            socket.off("message_sent", onReceiveMessage);
        };
    }, [user]);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => router.push({ pathname: `/chat/${item.id}`, params: { name: item.name, avatar: item.avatar } })}
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 6, height: 6 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 6
            }}
            className="bg-white border-[2.5px] border-black rounded-2xl p-4 mb-4 active:scale-95 transition-transform"
        >
            <View className="flex-row gap-4">
                <View className="relative">
                    <View className={`w-14 h-14 ${item.name === 'Main Shelter' ? 'bg-pop-orange' : 'bg-pop-green'} border-2 border-black rounded-full items-center justify-center overflow-hidden`}>
                        <MaterialCommunityIcons name="paw" size={32} color="black" opacity={0.5} />
                    </View>
                </View>
                <View className="flex-1 min-w-0 justify-center">
                    <View className="flex-row justify-between items-start mb-1">
                        <Text className="font-bold text-lg truncate text-black">{item.name}</Text>
                        <Text className={`text-xs font-bold ${item.unread ? 'text-pop-orange' : 'text-neutral-500'}`}>
                            {item.time}
                        </Text>
                    </View>
                    <Text
                        numberOfLines={1}
                        className={`text-sm truncate ${item.unread ? 'text-black font-bold' : 'text-neutral-500 font-medium'}`}
                    >
                        {item.lastMessage}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, paddingTop: insets.top + 16, backgroundColor: '#FFFBF2' }} className="px-6 pb-4">
            <View className="flex-row items-center justify-between border-b-2 border-black pb-4 mb-6">
                <View className="flex-row items-center gap-3">
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <MaterialCommunityIcons name="paw" size={22} color="#FF6B00" />
                    </View>
                    <Text className="text-2xl font-extrabold tracking-tight text-black">Messages</Text>
                </View>
                <TouchableOpacity
                    onPress={loadInbox}
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 4
                    }}
                    className="w-10 h-10 bg-pop-green border-[2.5px] border-black rounded-xl items-center justify-center"
                >
                    <MaterialCommunityIcons name="refresh" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {loading && conversations.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#FF6B00" />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <MaterialCommunityIcons name="message-text-outline" size={64} color="#9CA3AF" />
                            <Text className="text-gray-500 font-bold mt-4">No messages yet</Text>
                            <Text className="text-gray-400 text-xs mt-1">Chat with pet owners to see them here</Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}

        </View>
    );
}
