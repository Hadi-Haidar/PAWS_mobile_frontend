import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getChatHistory, updateMessage } from '../../services/chat';
import { updatePet } from '../../services/pets';
import socket from '../../services/socket';

export default function ChatScreen() {
    const { id, name, avatar } = useLocalSearchParams(); // id is receiverId
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const flatListRef = useRef(null);

    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        if (!user) return;

        // Fetch history
        const loadHistory = async () => {
            const { data, error } = await getChatHistory(id);
            if (data) {
                setMessages(data);
            } else {
                console.error("Failed to load chat history:", error);
            }
        };
        loadHistory();

        // Socket connection logic
        socket.auth = { userId: user.id };
        if (!socket.connected) {
            socket.connect();
        }
        socket.emit("join_chat", user.id);

        const onConnect = () => {
            setIsConnected(true);
        };

        const onDisconnect = () => {
            setIsConnected(false);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        socket.on("receive_message", (message) => {
            const isRelevant =
                (message.senderId === user.id && message.receiverId === id) ||
                (message.senderId === id && message.receiverId === user.id);

            if (isRelevant) {
                setMessages((prev) => {
                    return [...prev, message];
                });
            }
        });

        socket.on("message_updated", (updatedMsg) => {
            // Update the specific message in the list
            setMessages((prev) =>
                prev.map(msg => msg.id === updatedMsg.messageId ? { ...msg, ...updatedMsg.updates } : msg)
            );
        });

        socket.on("message_sent", (message) => {
            // success
        });

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("receive_message");
            socket.off("message_updated");
            socket.off("message_sent");
            socket.off("message_sent");
            // socket.disconnect(); // Keep connection alive for notifications
        };
    }, [user, id]);

    // Force re-render on connection change
    useEffect(() => {
        const interval = setInterval(() => {
            setIsConnected(socket.connected);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const sendMessage = () => {
        if (!input.trim() || !user) return;

        const messageData = {
            senderId: user.id,
            receiverId: id,
            content: input.trim(),
            type: 'text',
            createdAt: new Date().toISOString(),
        };

        // Optimistic update
        setMessages((prev) => [...prev, messageData]);

        socket.emit("send_message", messageData);
        setInput('');
        Keyboard.dismiss();
    };


    const updateMessageState = async (item, newType) => {
        // 1. Update backend
        const { error } = await updateMessage(item.id, { type: newType });
        if (error) {
            Alert.alert("Error", "Failed to update request status.");
            return;
        }

        // 2. Update local state immediately
        setMessages(prev => prev.map(msg => msg.id === item.id ? { ...msg, type: newType } : msg));

        // 3. Notify other user via socket to update their UI
        socket.emit("update_message", {
            messageId: item.id,
            updates: { type: newType },
            receiverId: id // The other user
        });
    };

    const handleAcceptAdoption = async (item) => {
        if (!item.ticketId) {
            Alert.alert("Error", "Invalid Request data.");
            return;
        }

        const { error } = await updatePet(item.ticketId, {
            status: 'Adopted',
            ownerId: item.senderId
        });

        if (error) {
            Alert.alert("Error", "Failed to process adoption.");
            return;
        }

        // Update the message type to 'adoption_accepted'
        await updateMessageState(item, 'adoption_accepted');
    };

    const handleRejectAdoption = async (item) => {
        // Update the message type to 'adoption_rejected'
        await updateMessageState(item, 'adoption_rejected');
    };

    const handleCancelAdoption = async (item) => {
        // Update the message type to 'adoption_cancelled'
        await updateMessageState(item, 'adoption_cancelled');
    };

    const renderItem = ({ item }) => {
        const isMe = item.senderId === user?.id;

        // Common Card Style for Request States
        const RequestCard = ({ children, borderColor = 'black' }) => (
            <View className="mb-6 w-full items-center">
                <View
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 4
                    }}
                    className={`bg-white border-2 border-${borderColor} rounded-xl p-4 w-[90%]`}
                >
                    {children}
                </View>
                <Text className="text-[10px] font-black mt-2 text-gray-400 uppercase">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );

        if (item.type === 'adoption_request') {
            return (
                <RequestCard>
                    <View className="flex-row items-center gap-2 mb-3 pb-2 border-b-2 border-gray-100">
                        <MaterialCommunityIcons name="paw" size={24} color="#FF6B00" />
                        <Text className="font-black text-lg uppercase text-black">Adoption Request</Text>
                    </View>

                    <Text className="font-bold text-gray-800 text-base mb-4 text-center">{item.content}</Text>

                    {!isMe ? (
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => handleRejectAdoption(item)}
                                className="flex-1 bg-white border-2 border-black py-3 rounded-xl items-center shadow-sm"
                            >
                                <Text className="font-bold text-black">REJECT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleAcceptAdoption(item)}
                                className="flex-1 bg-pop-green border-2 border-black py-3 rounded-xl items-center shadow-sm"
                            >
                                <Text className="font-bold text-black">ACCEPT</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="bg-gray-50 p-2 rounded-lg border-2 border-gray-200 border-dashed w-full gap-3">
                            <Text className="text-gray-500 font-bold text-center text-xs tracking-wider">WAITING FOR OWNER RESPONSE</Text>
                            <TouchableOpacity
                                onPress={() => handleCancelAdoption(item)}
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 1, height: 1 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 0,
                                    elevation: 1
                                }}
                                className="bg-white border border-gray-300 py-2 rounded-lg items-center self-center px-6"
                            >
                                <Text className="font-bold text-gray-500 text-xs">CANCEL REQUEST</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </RequestCard>
            );
        }

        if (item.type === 'adoption_accepted') {
            return (
                <RequestCard borderColor="green-500">
                    <View className="flex-row items-center justify-center gap-2">
                        <MaterialCommunityIcons name="check-circle" size={32} color="#10B981" />
                        <Text className="font-black text-xl uppercase text-green-600">ACCEPTED</Text>
                    </View>
                    <Text className="text-gray-500 text-center mt-2 font-bold opacity-60">This request has been accepted.</Text>
                </RequestCard>
            );
        }

        if (item.type === 'adoption_rejected') {
            return (
                <RequestCard borderColor="red-500">
                    <View className="flex-row items-center justify-center gap-2">
                        <MaterialCommunityIcons name="close-circle" size={32} color="#EF4444" />
                        <Text className="font-black text-xl uppercase text-red-500">REJECTED</Text>
                    </View>
                    <Text className="text-gray-500 text-center mt-2 font-bold opacity-60">This request was rejected.</Text>
                </RequestCard>
            );
        }

        if (item.type === 'adoption_cancelled') {
            return (
                <RequestCard borderColor="gray-400">
                    <View className="flex-row items-center justify-center gap-2">
                        <MaterialCommunityIcons name="cancel" size={32} color="#9CA3AF" />
                        <Text className="font-black text-xl uppercase text-gray-400">CANCELLED</Text>
                    </View>
                    <Text className="text-gray-400 text-center mt-2 font-bold opacity-60">This request was cancelled by the sender.</Text>
                </RequestCard>
            );
        }

        return (
            <View className={`flex-col max-w-[85%] mb-4 ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                <View
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 4
                    }}
                    className={`p-4 border-2 border-black rounded-2xl ${isMe
                        ? 'bg-pop-orange rounded-tr-none'
                        : 'bg-pop-pistachio rounded-tl-none'
                        }`}
                >
                    <Text className={`font-bold text-base leading-5 ${isMe ? 'text-white' : 'text-black'}`}>
                        {item.content}
                    </Text>
                </View>
                <Text className="text-[10px] font-black mt-2 mx-1 text-gray-500 uppercase">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-neo-bg">
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View
                style={{ paddingTop: insets.top + 16 }}
                className="flex-row items-center justify-between px-4 pb-4 z-10 bg-neo-bg"
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 2, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 2
                    }}
                    className="bg-pop-pistachio border-2 border-black p-2 rounded-xl"
                >
                    <MaterialCommunityIcons name="paw" size={24} color="black" />
                </TouchableOpacity>

                <View className="flex-col items-center">
                    <Text className="text-xl font-black uppercase tracking-tighter text-black">
                        {name || 'Unknown'}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => {
                        Alert.alert(
                            "⚠️ Safety Warning",
                            "Please be responsible and cautious before accepting any adoption request.\n\nVerify the adopter's profile and ensure your pet goes to a safe home.",
                            [{ text: "I Understand", style: "cancel" }]
                        );
                    }}
                    style={{
                        shadowColor: '#DC2626',
                        shadowOffset: { width: 2, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 2
                    }}
                    className="bg-red-50 border-2 border-red-600 p-2 rounded-xl"
                >
                    <MaterialCommunityIcons name="alert-decagram" size={24} color="#DC2626" />
                </TouchableOpacity>
            </View>

            {/* Chat Content Wrapped in KeyboardAvoidingView */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
            >
                {/* Chat List */}
                <View style={{ flex: 1, backgroundColor: '#FFFBF2' }}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{
                            padding: 16,
                            paddingBottom: 20, // Reduced padding since input is no longer absolute
                            backgroundColor: '#FFFBF2'
                        }}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        style={{ backgroundColor: '#FFFBF2' }}
                        keyboardShouldPersistTaps="handled"
                    />
                </View>

                {/* Input Area */}
                <View style={{
                    backgroundColor: '#FFFBF2',
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    paddingBottom: Math.max(insets.bottom, 20), // Safe area + comfort spacing
                    borderTopWidth: 2,
                    borderTopColor: '#00000008',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <View className="flex-1">
                        <TextInput
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 1,
                                shadowRadius: 0,
                                elevation: 2,
                                height: 56,
                            }}
                            className="w-full px-4 font-bold text-black bg-white border-2 border-black rounded-xl"
                            placeholder="Type a message..."
                            placeholderTextColor="#9CA3AF"
                            value={input}
                            onChangeText={setInput}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={sendMessage}
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 2, height: 2 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                            elevation: 2,
                            width: 56,
                            height: 56,
                        }}
                        className="bg-pop-orange items-center justify-center rounded-xl border-2 border-black"
                    >
                        <MaterialCommunityIcons name="arrow-right" size={32} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>


            {/* Background elements (Neo Pop) - cleaned up */}
            <View className="absolute bottom-40 -right-8 w-20 h-20 bg-blue-400 border-2 border-black rounded-lg -z-10 opacity-20 -rotate-12" />
        </View>
    );
}
