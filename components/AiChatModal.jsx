import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAiRecommendation } from '../services/ai';
import AiAvatar from './AiAvatar';

const QUESTIONS = [
    {
        id: 1,
        question: "What type of place do you live in?",
        options: ["Apartment", "House with small yard", "House with large yard"],
    },
    {
        id: 2,
        question: "How much time can you dedicate daily to a pet?",
        options: ["Less than 1 hour", "1–3 hours", "More than 3 hours"],
    },
    {
        id: 3,
        question: "What is your experience with pets?",
        options: ["No experience", "Some experience", "Very experienced"],
    },
    {
        id: 4,
        question: "What kind of pet do you prefer?",
        options: ["Calm & low maintenance", "Medium activity", "Very active & playful"],
    },
];

export default function AiChatModal({ visible, onClose }) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isTablet = width > 768;
    const contentWidth = isTablet ? 600 : '100%';
    const scrollRef = useRef(null);


    const [messages, setMessages] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isTyping, setIsTyping] = useState(false);
    const [showResult, setShowResult] = useState(false);

    // Initial Greeting
    useEffect(() => {
        if (visible) {
            resetChat();
        }
    }, [visible]);

    const resetChat = () => {
        setMessages([
            { id: 'intro', text: "Hi! I'm your AI Pet Matchmaker. 🤖\nI'll ask you 4 quick questions to find your perfect companion.", sender: 'ai' }
        ]);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setShowResult(false);
        setIsTyping(true);

        // Delay first question
        setTimeout(() => {
            setIsTyping(false);
            askQuestion(0);
        }, 1500);
    };

    const askQuestion = (index) => {
        const q = QUESTIONS[index];
        setMessages(prev => [...prev, { id: `q-${q.id}`, text: q.question, sender: 'ai', isQuestion: true, questionId: q.id }]);
    };

    const handleOptionSelect = (option) => {
        // 1. Add User Answer to Chat
        setMessages(prev => [...prev, { id: `a-${currentQuestionIndex}`, text: option, sender: 'user' }]);

        // 2. Save Answer
        const currentQ = QUESTIONS[currentQuestionIndex];
        const newAnswers = { ...answers, [currentQ.id]: option };
        setAnswers(newAnswers);

        // 3. Move to Next or Finish
        if (currentQuestionIndex < QUESTIONS.length - 1) {
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                setCurrentQuestionIndex(prev => prev + 1);
                askQuestion(currentQuestionIndex + 1);
            }, 2000);
        } else {
            generateRecommendation(newAnswers);
        }
    };

    const generateRecommendation = async (finalAnswers) => {
        setIsTyping(true);

        try {
            const result = await getAiRecommendation(finalAnswers);

            // Add slight delay if response is too fast, to feel natural
            setTimeout(() => {
                setMessages(prev => [...prev, { id: 'result', text: result.recommendation || "No recommendation found.", sender: 'ai', isResult: true }]);
                setShowResult(true);
                setIsTyping(false);
            }, 1000);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: 'error',
                text: "I'm having trouble connecting to my AI brain right now. 🧠🔌\nPlease try again later.",
                sender: 'ai',
                isResult: true
            }]);
            setShowResult(true);
            setIsTyping(false);
        }
    };

    // Auto-scroll
    useEffect(() => {
        if (messages.length > 2) {
            setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages, isTyping]);

    if (!visible) return null;

    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const isQuestionActive = !showResult && !isTyping && messages.length > 0 && messages[messages.length - 1].sender === 'ai';

    return (
        <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <View style={{ marginRight: 10 }}>
                            <AiAvatar size={40} />
                        </View>
                        <Text style={styles.headerTitle}>AI Pet Consultant</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <MaterialCommunityIcons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* Chat Area */}
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={[
                        styles.chatContent,
                        {
                            paddingBottom: showResult ? 180 : 450,
                            maxWidth: 800,
                            width: '100%',
                            alignSelf: 'center'
                        }
                    ]}
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.map((msg, index) => (
                        <Animated.View
                            key={msg.id}
                            entering={FadeInUp.duration(400)}
                            style={[
                                styles.messageBubble,
                                msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
                                msg.isResult && styles.resultBubble,
                                {
                                    maxWidth: msg.isResult
                                        ? (isTablet ? 700 : '95%')
                                        : (isTablet ? 500 : '85%')
                                }
                            ]}

                        >
                            {msg.sender === 'ai' && (
                                <View style={{ marginRight: 8, marginTop: 4 }}>
                                    <AiAvatar size={28} />
                                </View>
                            )}
                            <Text style={[
                                styles.messageText,
                                msg.sender === 'user' ? styles.userText : styles.aiText,
                                msg.isResult && styles.resultText,
                                { flex: 1 }
                            ]}>
                                {msg.text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return <Text key={i} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</Text>;
                                    }
                                    return <Text key={i}>{part}</Text>;
                                })}
                            </Text>
                        </Animated.View>
                    ))}

                    {isTyping && (
                        <Animated.View entering={FadeInUp} style={[styles.messageBubble, styles.aiBubble]}>
                            <View style={{ marginRight: 8, marginTop: 4 }}>
                                <AiAvatar size={28} />
                            </View>
                            <ActivityIndicator size="small" color="#000" />
                        </Animated.View>
                    )}

                    {/* Padding for bottom options - Increased to prevent overlap */}
                    {/* Spacer removed, controlled by padding */}
                </ScrollView>

                {/* Options Area */}
                {isQuestionActive && (
                    <Animated.View
                        entering={FadeInDown.duration(500)}
                        layout={Layout.springify()}
                        style={[
                            styles.optionsContainer,
                            {
                                paddingBottom: insets.bottom + 20,
                                width: contentWidth,
                                left: isTablet ? (width - 600) / 2 : 0,
                                right: undefined // Override absolute right
                            }
                        ]}
                    >
                        <Text style={styles.optionsLabel}>Select an option:</Text>
                        <View style={styles.optionsGrid}>
                            {currentQuestion.options.map((option, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={styles.optionButton}
                                    onPress={() => handleOptionSelect(option)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.optionText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {showResult && (
                    <Animated.View
                        entering={FadeInDown.duration(500)}
                        style={[
                            styles.restartContainer,
                            {
                                paddingBottom: insets.bottom + 20,
                                width: contentWidth,
                                left: isTablet ? (width - 600) / 2 : 0,
                                right: undefined
                            }
                        ]}
                    >
                        <TouchableOpacity style={styles.restartButton} onPress={resetChat}>
                            <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                            <Text style={styles.restartText}>Start Over</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#fff',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    botIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FF6B00',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    closeButton: {
        padding: 5,
    },
    chatContent: {
        padding: 20,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    aiBubble: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    userBubble: {
        backgroundColor: '#000',
        alignSelf: 'flex-end',
        borderTopRightRadius: 4,
    },
    resultBubble: {
        backgroundColor: '#FFF8E1',
        borderWidth: 2,
        borderColor: '#FFC107',
        width: '95%',
        alignSelf: 'center',
        padding: 20,
        marginBottom: 20,
        shadowColor: "#FFC107",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    miniBotIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FF6B00',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        marginTop: -2,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 24,
    },
    aiText: {
        color: '#333',
    },
    userText: {
        color: '#fff',
        fontWeight: '500',
    },
    resultText: {
        color: '#37474F',
        fontSize: 17,
        lineHeight: 26,
    },
    optionsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    optionsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    optionsGrid: {
        gap: 10,
        flexDirection: 'column',
    },
    optionButton: {
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#000',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
    },
    restartContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    restartButton: {
        flexDirection: 'row',
        backgroundColor: '#FF6B00',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: "#FF6B00",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    restartText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    }
});
