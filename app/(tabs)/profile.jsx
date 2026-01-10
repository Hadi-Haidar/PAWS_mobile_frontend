
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/auth';

export default function ProfileScreen() {
    const { user } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.replace('/auth/signin');
    };

    return (
        <View className="flex-1 justify-center items-center bg-background p-6">
            <Text className="text-2xl font-bold mb-4">Hello, {user?.email}!</Text>

            <TouchableOpacity
                className="w-full h-12 bg-danger items-center justify-center shadow-md border-2 border-black active:translate-y-1 active:shadow-none bg-red-500"
                onPress={handleSignOut}
            >
                <Text className="text-white font-bold text-lg">Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}
