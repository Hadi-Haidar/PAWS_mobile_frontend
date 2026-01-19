import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { sendPasswordResetEmail } from '../../services/auth';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSendReset = async () => {
        if (!email) {
            Alert.alert('Required', 'Please enter your email address.');
            return;
        }
        setLoading(true);
        const { error } = await sendPasswordResetEmail(email);
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.push({ pathname: '/auth/verify-reset-otp', params: { email } });
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-4 z-10 p-2">
                    <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
                </TouchableOpacity>

                <View className="items-center mb-8">
                    <View className="w-16 h-16 bg-primary rounded-full items-center justify-center mb-4 border-2 border-black">
                        <MaterialCommunityIcons name="email-lock" size={32} color="black" />
                    </View>
                    <Text className="text-2xl font-bold text-center mb-2">Forgot Password?</Text>
                    <Text className="text-text-secondary text-center">Enter your email and we'll send you a link to reset your password.</Text>
                </View>

                {/* Email Input */}
                <View className="mb-6">
                    <View className="flex-row items-center bg-white border-2 border-black h-14 px-4 shadow-sm">
                        <MaterialCommunityIcons name="email-outline" size={22} color="#666" />
                        <TextInput
                            className="flex-1 ml-3 text-base font-medium text-text"
                            placeholder="Email Address"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoComplete="email"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    className="w-full h-14 bg-primary items-center justify-center shadow-md border-2 border-black active:translate-y-1 active:shadow-none"
                    onPress={handleSendReset}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Text className="text-black font-bold text-lg">Send Reset Link</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
