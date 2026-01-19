import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { verifyOtp } from '../../services/auth';

export default function VerifyResetOtpScreen() {
    const { email: emailParam } = useLocalSearchParams();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleVerifyOtp = async () => {
        if (!otp) {
            Alert.alert('Error', 'Please enter the code');
            return;
        }
        setLoading(true);
        // For password reset/recovery via OTP, type is 'magiclink' or 'recovery'.
        // 'recovery' is correct for resetPasswordForEmail flow.
        const { error } = await verifyOtp(emailParam, otp, 'recovery');
        setLoading(false);

        if (error) {
            Alert.alert('Verification Failed', "Invalid or expired code.");
        } else {
            // Success! Navigate to password reset form.
            router.replace('/auth/reset-password');
        }
    };

    return (
        <View className="flex-1 justify-center items-center bg-background p-6">
            <View className="w-full max-w-sm bg-surface p-8 shadow-md border-2 border-black">
                <Text className="text-2xl font-bold mb-2 text-text text-center">Reset Password 🔒</Text>
                <Text className="text-text-secondary mb-8 text-center">
                    Enter the 6-digit code sent to{'\n'}
                    <Text className="font-bold">{emailParam}</Text>
                </Text>

                <TextInput
                    className="w-full h-12 border-2 border-black mb-4 px-4 bg-white text-lg font-medium text-center tracking-widest"
                    placeholder="000000"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                />

                <TouchableOpacity
                    className="w-full h-12 bg-primary items-center justify-center shadow-md border-2 border-black active:translate-y-1 active:shadow-none mb-4"
                    onPress={handleVerifyOtp}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Text className="text-black font-bold text-lg">Verify Code</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-text-secondary text-center underline">Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
