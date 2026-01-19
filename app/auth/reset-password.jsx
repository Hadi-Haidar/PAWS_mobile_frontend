import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { updateUserPassword } from '../../services/auth';

export default function ResetPasswordScreen() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleUpdatePassword = async () => {
        if (!password) {
            Alert.alert('Required', 'Please enter a new password.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password should be at least 6 characters.');
            return;
        }

        setLoading(true);
        const { error } = await updateUserPassword(password);
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Password updated successfully!', [
                { text: 'Go to Home', onPress: () => router.replace('/(tabs)') }
            ]);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                <View className="items-center mb-8">
                    <View className="w-16 h-16 bg-primary rounded-full items-center justify-center mb-4 border-2 border-black">
                        <MaterialCommunityIcons name="lock-reset" size={32} color="black" />
                    </View>
                    <Text className="text-2xl font-bold text-center mb-2">Reset Password</Text>
                    <Text className="text-text-secondary text-center">Enter your new password below.</Text>
                </View>

                <View className="flex-row items-center bg-white border-2 border-black h-14 px-4 shadow-sm mb-6">
                    <MaterialCommunityIcons name="lock-outline" size={22} color="#666" />
                    <TextInput
                        className="flex-1 ml-3 text-base font-medium text-text"
                        placeholder="New Password"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity
                    className="w-full h-14 bg-primary items-center justify-center shadow-md border-2 border-black active:translate-y-1 active:shadow-none"
                    onPress={handleUpdatePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Text className="text-black font-bold text-lg">Update Password</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
