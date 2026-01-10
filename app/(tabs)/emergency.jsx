import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

export default function EmergencyScreen() {
    return (
        <View className="flex-1 bg-pop-bg items-center justify-center px-6">
            <View
                className="bg-white border-2 border-black rounded-xl p-8 items-center w-full"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 4, height: 4 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                }}
            >
                <View className="bg-red-500 w-20 h-20 rounded-full items-center justify-center border-2 border-black mb-4">
                    <MaterialCommunityIcons name="medical-bag" size={40} color="white" />
                </View>
                <Text className="text-2xl font-bold text-black">Emergency</Text>
                <Text className="text-gray-500 text-center mt-2 mb-6">
                    Need urgent help for a pet?
                </Text>
                <TouchableOpacity
                    className="bg-pop-orange px-8 py-4 rounded-xl border-2 border-black"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                    }}
                >
                    <Text className="text-black font-bold text-lg">Call Emergency Vet</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
