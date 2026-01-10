import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { verifyOtp } from '../../services/auth';

export default function VerifyOtpScreen() {
    const { email: emailParam } = useLocalSearchParams();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            router.replace('/(tabs)');
        }
    }, [user]);

    const handleVerifyOtp = async () => {
        if (!otp) {
            Alert.alert('Error', 'Please enter the OTP');
            return;
        }
        setLoading(true);
        const { error } = await verifyOtp(emailParam, otp);
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace('/(tabs)');
        }
    };

    return (
        <View className="flex-1 justify-center items-center bg-background p-6">
            <View className="w-full max-w-sm bg-surface p-8 shadow-md border-2 border-black">
                <Text className="text-3xl font-bold mb-2 text-text">Verify Email 🐾</Text>
                <Text className="text-text-secondary mb-8">
                    Enter the verification code sent to{'\n'}
                    <Text className="font-bold">{emailParam}</Text>
                </Text>

                <TextInput
                    className="w-full h-12 border-2 border-black mb-4 px-4 bg-white text-lg font-medium text-center tracking-widest"
                    placeholder="123456"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                />

                <TouchableOpacity
                    className="w-full h-12 bg-secondary items-center justify-center shadow-md border-2 border-black active:translate-y-1 active:shadow-none mb-4"
                    onPress={handleVerifyOtp}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Text className="text-black font-bold text-lg">Verify & Continue</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-text-secondary text-center underline">Go Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
