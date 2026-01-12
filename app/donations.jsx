
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { confirmDonation, createDonationIntent, getDonationHistory } from '../services/donations';

export default function DonationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [donations, setDonations] = useState([]);
    const [totalDonated, setTotalDonated] = useState(0);

    useEffect(() => {
        fetchDonationHistory();
    }, []);

    const fetchDonationHistory = async () => {
        setHistoryLoading(true);
        const { data, error } = await getDonationHistory();
        if (!error && data) {
            setDonations(data.donations || []);
            setTotalDonated(data.total || 0);
        }
        setHistoryLoading(false);
    };

    const handlePresetAmount = (preset) => {
        setAmount(preset.toString());
    };

    const handleDonate = async () => {
        const donationAmount = parseFloat(amount);

        if (!donationAmount || donationAmount < 1) {
            Alert.alert('Invalid Amount', 'Please enter an amount of at least $1.');
            return;
        }

        setLoading(true);

        try {
            // Step 1: Create payment intent on backend
            const { data: intentData, error: intentError } = await createDonationIntent(
                donationAmount,
                'USD',
                message
            );

            if (intentError) {
                throw new Error(intentError);
            }

            // Step 2: Initialize payment sheet
            const { error: initError } = await initPaymentSheet({
                paymentIntentClientSecret: intentData.clientSecret,
                merchantDisplayName: 'PAWS - Pet Adoption',
                returnURL: 'paws://stripe-redirect',
            });

            if (initError) {
                throw new Error(initError.message);
            }

            // Step 3: Present payment sheet
            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                if (presentError.code === 'Canceled') {
                    // User canceled - not an error
                    setLoading(false);
                    return;
                }
                throw new Error(presentError.message);
            }

            // Step 4: Confirm donation on backend
            const { error: confirmError } = await confirmDonation(
                intentData.paymentIntentId,
                donationAmount,
                'USD',
                message
            );

            if (confirmError) {
                // Payment succeeded but saving failed - still show success
                console.warn('Could not save donation record:', confirmError);
            }

            // Success!
            Alert.alert(
                '🎉 Thank You!',
                `Your donation of $${donationAmount.toFixed(2)} helps animals find their forever homes!`,
                [{
                    text: 'OK', onPress: () => {
                        setAmount('');
                        setMessage('');
                        fetchDonationHistory();
                    }
                }]
            );

        } catch (error) {
            Alert.alert('Payment Failed', error.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFAF0' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFAF0" />

            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: insets.top + 8,
                paddingBottom: 16,
                paddingHorizontal: 16,
                borderBottomWidth: 2,
                borderBottomColor: 'black',
                backgroundColor: '#FFFAF0',
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        width: 44,
                        height: 44,
                        backgroundColor: '#FF6B00',
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: '#000',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 2, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                    }}
                >
                    <MaterialCommunityIcons name="paw" size={24} color="black" />
                </TouchableOpacity>

                <Text style={{
                    fontSize: 18,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                }}>
                    Donate
                </Text>

                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Section */}
                    <View style={{
                        backgroundColor: '#CCFF66',
                        borderRadius: 20,
                        borderWidth: 2,
                        borderColor: '#000',
                        padding: 24,
                        marginBottom: 24,
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                    }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            backgroundColor: '#fff',
                            borderRadius: 40,
                            borderWidth: 2,
                            borderColor: '#000',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 16,
                        }}>
                            <MaterialCommunityIcons name="hand-heart" size={40} color="#FF6B00" />
                        </View>
                        <Text style={{ fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
                            Help Pets Find Homes
                        </Text>
                        <Text style={{ fontSize: 14, color: '#333', textAlign: 'center', lineHeight: 20 }}>
                            Your donation helps provide food, shelter, and medical care for animals in need.
                        </Text>
                    </View>

                    {/* Total Donated */}
                    {!historyLoading && totalDonated > 0 && (
                        <View style={{
                            backgroundColor: '#fff',
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: '#000',
                            padding: 16,
                            marginBottom: 24,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            shadowColor: '#000',
                            shadowOffset: { width: 3, height: 3 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                        }}>
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#666', textTransform: 'uppercase' }}>Your Total Donations</Text>
                                <Text style={{ fontSize: 28, fontWeight: '900', color: '#FF6B00' }}>${totalDonated.toFixed(2)}</Text>
                            </View>
                            <View style={{
                                backgroundColor: '#CCFF66',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20,
                                borderWidth: 2,
                                borderColor: '#000',
                            }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
                                    {donations.length} Donation{donations.length !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Amount Selection */}
                    <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Choose Amount
                    </Text>

                    {/* Preset Amount Grid - Fully Responsive */}
                    {(() => {
                        // Responsive calculations
                        const horizontalPadding = 32; // 16px on each side
                        const gapBetweenButtons = 12;
                        const totalGapsPerRow = 2; // 2 gaps for 3 buttons
                        const availableWidth = width - horizontalPadding;
                        const buttonWidth = (availableWidth - (gapBetweenButtons * totalGapsPerRow)) / 3;

                        // Dynamic sizing based on screen width
                        const isSmallDevice = width < 360;
                        const isMediumDevice = width >= 360 && width < 400;
                        const isLargeDevice = width >= 400;

                        const buttonHeight = isSmallDevice ? 48 : isMediumDevice ? 54 : 60;
                        const fontSize = isSmallDevice ? 15 : isMediumDevice ? 17 : 20;
                        const borderRadius = isSmallDevice ? 10 : 14;
                        const borderWidth = isSmallDevice ? 2 : 2.5;
                        const shadowOffset = isSmallDevice ? 3 : 4;

                        const presetAmounts = [
                            [5, 10, 25],
                            [50, 100, 250]
                        ];

                        return (
                            <View style={{ marginBottom: 20, gap: gapBetweenButtons }}>
                                {presetAmounts.map((row, rowIndex) => (
                                    <View
                                        key={rowIndex}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        {row.map((preset) => {
                                            const isSelected = amount === preset.toString();
                                            return (
                                                <TouchableOpacity
                                                    key={preset}
                                                    onPress={() => handlePresetAmount(preset)}
                                                    activeOpacity={0.8}
                                                    style={{
                                                        width: buttonWidth,
                                                        height: buttonHeight,
                                                        backgroundColor: isSelected ? '#FF6B00' : '#fff',
                                                        borderRadius: borderRadius,
                                                        borderWidth: borderWidth,
                                                        borderColor: '#000',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        shadowColor: '#000',
                                                        shadowOffset: isSelected
                                                            ? { width: 1, height: 1 }
                                                            : { width: shadowOffset, height: shadowOffset },
                                                        shadowOpacity: 1,
                                                        shadowRadius: 0,
                                                        elevation: isSelected ? 1 : shadowOffset,
                                                    }}
                                                >
                                                    <Text style={{
                                                        fontSize: fontSize,
                                                        fontWeight: '900',
                                                        color: isSelected ? '#fff' : '#000',
                                                    }}>
                                                        ${preset}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ))}
                            </View>
                        );
                    })()}

                    {/* Custom Amount Label */}
                    <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#666' }}>
                        Or Enter Custom Amount
                    </Text>

                    {/* Custom Amount Input - Fixed border clipping */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        borderWidth: 2.5,
                        borderColor: '#000',
                        borderRadius: 14,
                        marginBottom: 24,
                        height: 60,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                        elevation: 4,
                    }}>
                        <View style={{
                            width: 56,
                            height: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#CCFF66',
                            borderRightWidth: 2.5,
                            borderRightColor: '#000',
                        }}>
                            <Text style={{ fontSize: 26, fontWeight: '900', color: '#000' }}>$</Text>
                        </View>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            placeholderTextColor="#bbb"
                            keyboardType="decimal-pad"
                            style={{
                                flex: 1,
                                paddingHorizontal: 16,
                                fontSize: 24,
                                fontWeight: '800',
                                height: '100%',
                                color: '#000',
                            }}
                        />
                        {amount !== '' && (
                            <TouchableOpacity
                                onPress={() => setAmount('')}
                                style={{ paddingHorizontal: 16 }}
                            >
                                <MaterialCommunityIcons name="close-circle" size={24} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Message */}
                    <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase' }}>
                        Add a Message (Optional)
                    </Text>
                    <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Share why you're donating..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={3}
                        style={{
                            backgroundColor: '#fff',
                            borderWidth: 2,
                            borderColor: '#000',
                            borderRadius: 12,
                            padding: 16,
                            fontSize: 16,
                            minHeight: 100,
                            textAlignVertical: 'top',
                            marginBottom: 24,
                            shadowColor: '#000',
                            shadowOffset: { width: 3, height: 3 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                        }}
                    />

                    {/* Donate Button */}
                    <TouchableOpacity
                        onPress={handleDonate}
                        disabled={loading || !amount}
                        style={{
                            backgroundColor: loading || !amount ? '#ccc' : '#FF6B00',
                            paddingVertical: 18,
                            borderRadius: 14,
                            borderWidth: 2,
                            borderColor: '#000',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 4, height: 4 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="heart" size={24} color="white" />
                                <Text style={{ fontSize: 18, fontWeight: '900', color: 'white', textTransform: 'uppercase' }}>
                                    Donate {amount ? `$${amount}` : ''}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Security Note */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                        <MaterialCommunityIcons name="shield-check" size={16} color="#666" />
                        <Text style={{ fontSize: 12, color: '#666', marginLeft: 6 }}>
                            Secure payment powered by Stripe
                        </Text>
                    </View>

                    {/* Donation History */}
                    {donations.length > 0 && (
                        <View style={{ marginTop: 32 }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase' }}>
                                Your Donation History
                            </Text>
                            {donations.slice(0, 5).map((donation, index) => (
                                <View
                                    key={donation.id || index}
                                    style={{
                                        backgroundColor: '#fff',
                                        borderWidth: 2,
                                        borderColor: '#000',
                                        borderRadius: 12,
                                        padding: 14,
                                        marginBottom: 10,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="gift-outline" size={20} color="#FF6B00" />
                                        <View style={{ marginLeft: 12 }}>
                                            <Text style={{ fontSize: 16, fontWeight: '800' }}>${parseFloat(donation.amount).toFixed(2)}</Text>
                                            <Text style={{ fontSize: 11, color: '#666' }}>
                                                {new Date(donation.createdAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                    {donation.message && (
                                        <MaterialCommunityIcons name="message-text-outline" size={18} color="#999" />
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
