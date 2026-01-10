
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
// Actually I defined colors in tailwind, but expo-router tabs use JS objects.
// Let's standardise on my Neo-Pop colors manually here.

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#FF6F00', // Primary Orange
                tabBarInactiveTintColor: '#1E1E1E',
                tabBarStyle: {
                    borderTopWidth: 2,
                    borderTopColor: '#000000',
                    backgroundColor: '#FFFFFF',
                    height: 60,
                    paddingBottom: 5,
                },
                tabBarLabelStyle: {
                    fontFamily: Platform.select({ ios: 'Arial', android: 'Roboto' }), // Should be Neo-Pop font if available
                    fontSize: 12,
                    fontWeight: 'bold',
                }
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Adopt',
                    tabBarIcon: ({ color }) => <FontAwesome name="paw" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ color }) => <FontAwesome name="search" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="donate"
                options={{
                    title: 'Donate',
                    tabBarIcon: ({ color }) => <FontAwesome name="heart" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
