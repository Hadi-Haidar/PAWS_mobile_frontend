import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export default function ShopScreen() {
    return (
        <View className="flex-1 bg-pop-bg items-center justify-center px-6">
            <View
                className="bg-white border-2 border-black rounded-xl p-8 items-center"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 4, height: 4 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                }}
            >
                <MaterialCommunityIcons name="shopping-outline" size={64} color="#FF6B00" />
                <Text className="text-2xl font-bold text-black mt-4">Pet Shop</Text>
                <Text className="text-gray-500 text-center mt-2">
                    Browse pet supplies and accessories
                </Text>
            </View>
        </View>
    );
}
