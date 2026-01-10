import { Stack } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

export default function AuthCallback() {
    return (
        <View className="flex-1 justify-center items-center bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <ActivityIndicator size="large" color="#FF6F00" />
            <Text className="mt-4 text-gray-500">Verifying login...</Text>
        </View>
    );
}
