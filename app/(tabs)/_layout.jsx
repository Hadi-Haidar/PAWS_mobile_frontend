import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Dimensions, Platform, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#000000',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    borderTopWidth: 2,
                    borderTopColor: '#000000',
                    backgroundColor: '#FFFFFF',
                    height: Platform.OS === 'ios' ? 90 : 75,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    paddingHorizontal: 4,
                },
                tabBarLabelStyle: {
                    fontSize: 9,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                    marginTop: 4,
                },
                tabBarItemStyle: {
                    flex: 1,
                    paddingVertical: 2,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={[
                                {
                                    height: 40,
                                    width: 48,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 8,
                                },
                                focused && {
                                    backgroundColor: '#CCFF66',
                                    borderWidth: 2,
                                    borderColor: '#000',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 1,
                                    shadowRadius: 0,
                                    elevation: 3,
                                }
                            ]}
                        >
                            <MaterialCommunityIcons name="home" size={24} color={focused ? '#000' : color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'Messages',
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={[
                                {
                                    height: 40,
                                    width: 48,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 8,
                                },
                                focused && {
                                    backgroundColor: '#CCFF66',
                                    borderWidth: 2,
                                    borderColor: '#000',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 1,
                                    shadowRadius: 0,
                                    elevation: 3,
                                }
                            ]}
                        >
                            <MaterialCommunityIcons name="email-outline" size={24} color={focused ? '#000' : color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="shop"
                options={{
                    title: 'Shop',
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={[
                                {
                                    height: 40,
                                    width: 48,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 8,
                                },
                                focused && {
                                    backgroundColor: '#CCFF66',
                                    borderWidth: 2,
                                    borderColor: '#000',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 1,
                                    shadowRadius: 0,
                                    elevation: 3,
                                }
                            ]}
                        >
                            <MaterialCommunityIcons name="shopping-outline" size={24} color={focused ? '#000' : color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="emergency"
                options={{
                    title: 'Emergency',
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={[
                                {
                                    height: 40,
                                    width: 48,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 8,
                                },
                                focused && {
                                    backgroundColor: '#CCFF66',
                                    borderWidth: 2,
                                    borderColor: '#000',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 1,
                                    shadowRadius: 0,
                                    elevation: 3,
                                }
                            ]}
                        >
                            <MaterialCommunityIcons name="medical-bag" size={24} color={focused ? '#000' : color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="activity"
                options={{
                    title: 'Activity',
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={[
                                {
                                    height: 40,
                                    width: 48,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 8,
                                },
                                focused && {
                                    backgroundColor: '#CCFF66',
                                    borderWidth: 2,
                                    borderColor: '#000',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 1,
                                    shadowRadius: 0,
                                    elevation: 3,
                                }
                            ]}
                        >
                            <MaterialCommunityIcons name="history" size={24} color={focused ? '#000' : color} />
                        </View>
                    ),
                }}
            />
            {/* Hidden screens */}
            <Tabs.Screen name="donate" options={{ href: null }} />
            <Tabs.Screen name="profile" options={{ href: null }} />
            <Tabs.Screen name="search" options={{ href: null }} />
        </Tabs>
    );
}
