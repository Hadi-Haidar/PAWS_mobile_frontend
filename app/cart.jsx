import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    PixelRatio,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { confirmOrder, createOrderIntent } from '../services/products';

// Responsive utilities
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

const fontScale = PixelRatio.getFontScale();
const normalizeFont = (size) => {
    const newSize = moderateScale(size);
    return Math.round(PixelRatio.roundToNearestPixel(newSize / fontScale));
};

const HORIZONTAL_PADDING = moderateScale(16);

const THEME = {
    primary: '#ee8c2b',
    pistachio: '#C1F2B0',
    background: '#fcfaf8',
};

export default function CartScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const { subtotal, tax, total } = getCartTotal();

    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [processing, setProcessing] = useState(false);

    // Delivery info state
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [deliveryInfoAdded, setDeliveryInfoAdded] = useState(false);

    const handleSaveDeliveryInfo = () => {
        if (!phoneNumber.trim()) {
            Alert.alert('Required', 'Please enter your phone number');
            return;
        }
        if (!address.trim()) {
            Alert.alert('Required', 'Please enter your delivery address');
            return;
        }
        setDeliveryInfoAdded(true);
        setShowDeliveryModal(false);
        Alert.alert('Success', 'Delivery information saved!');
    };

    const handleCheckout = async () => {
        if (!user) {
            Alert.alert('Login Required', 'Please login to checkout', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Login', onPress: () => router.push('/auth/signin') }
            ]);
            return;
        }

        if (!deliveryInfoAdded) {
            Alert.alert('Delivery Info Required', 'Please add your delivery information before checkout');
            return;
        }

        if (cart.length === 0) return;

        setProcessing(true);

        try {
            // Create payment intent
            const { data, error } = await createOrderIntent(cart, total);

            if (error || !data?.clientSecret) {
                throw new Error(error || 'Failed to create payment');
            }

            // Initialize payment sheet
            const { error: initError } = await initPaymentSheet({
                paymentIntentClientSecret: data.clientSecret,
                merchantDisplayName: 'PAWS Pet Shop',
                defaultBillingDetails: {
                    name: user.email?.split('@')[0], // Basic placeholder
                }
            });

            if (initError) throw new Error(initError.message);

            // Present payment sheet
            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                if (paymentError.code === 'Canceled') {
                    setProcessing(false);
                    return;
                }
                throw new Error(paymentError.message);
            }

            // Confirm order in backend
            const { error: confirmError } = await confirmOrder(
                data.paymentIntentId,
                cart,
                total
            );

            if (confirmError) console.error('Order confirmation failed:', confirmError);

            // Success
            clearCart();
            Alert.alert(
                '🎉 Order Success!',
                `Your payment of $${total.toFixed(2)} was successful!`,
                [{ text: 'Back to Shop', onPress: () => router.back() }]
            );

        } catch (error) {
            console.error('Checkout error:', error);
            Alert.alert('Checkout Failed', error.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <MaterialCommunityIcons name="paw" size={24} color="#FF6B00" />
                </TouchableOpacity>

                <View style={{ width: 40 }} />

                <View style={{ width: 40 }} />
            </View>

            {/* Cart Items Section */}
            {cart.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="cart-outline" size={moderateScale(70)} color="#ccc" />
                    <Text style={styles.emptyText}>Your cart is empty</Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.continueButton}
                    >
                        <Text style={styles.continueButtonText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {/* Cart Items List */}
                    <View style={[
                        styles.itemsContainer,
                        cart.length > 2 && { maxHeight: moderateScale(400) }
                    ]}>
                        <ScrollView
                            showsVerticalScrollIndicator={cart.length > 2}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {cart.map((item) => (
                                <View key={item.productId} style={styles.card}>
                                    <View style={{ flexDirection: 'row', gap: moderateScale(10) }}>
                                        {/* Image */}
                                        <View style={styles.imageContainer}>
                                            <Image
                                                source={{ uri: item.imageUrl }}
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                            />
                                        </View>

                                        {/* Details */}
                                        <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: moderateScale(4) }}>
                                            <View>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <Text style={styles.itemName} numberOfLines={2}>
                                                        {item.name}
                                                    </Text>
                                                    <TouchableOpacity
                                                        onPress={() => removeFromCart(item.productId)}
                                                        style={{ padding: moderateScale(4) }}
                                                    >
                                                        <MaterialCommunityIcons name="delete-outline" size={moderateScale(20)} color="#9CA3AF" />
                                                    </TouchableOpacity>
                                                </View>
                                                <Text style={styles.itemVariant}>
                                                    {item.category || 'Standard'}
                                                </Text>
                                            </View>

                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: moderateScale(8) }}>
                                                <Text style={styles.itemPrice}>
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </Text>

                                                {/* Stepper */}
                                                <View style={styles.stepperContainer}>
                                                    <TouchableOpacity
                                                        onPress={() => updateQuantity(item.productId, -1)}
                                                        style={styles.stepperButton}
                                                    >
                                                        <MaterialCommunityIcons name="minus" size={moderateScale(14)} color="#000" />
                                                    </TouchableOpacity>

                                                    <Text style={styles.stepperValue}>{item.quantity}</Text>

                                                    <TouchableOpacity
                                                        onPress={() => updateQuantity(item.productId, 1)}
                                                        style={styles.stepperButton}
                                                    >
                                                        <MaterialCommunityIcons name="plus" size={moderateScale(14)} color="#000" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Summary Section */}
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                        </View>

                        <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.summaryLabel}>Shipping</Text>
                            <Text style={[styles.summaryValue, { color: THEME.pistachio, textTransform: 'uppercase' }]}>
                                Free
                            </Text>
                        </View>

                        {/* Spacer for sticky footer */}
                        <View style={{ height: moderateScale(100) }} />
                    </View>
                </View>
            )}

            {/* Sticky Footer */}
            {cart.length > 0 && (
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 20, 32) }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                        <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                    </View>

                    {/* Add Delivery Info Button */}
                    <TouchableOpacity
                        onPress={() => setShowDeliveryModal(true)}
                        style={styles.deliveryInfoButton}
                    >
                        <Text style={styles.deliveryInfoButtonText}>
                            {deliveryInfoAdded ? '✓ DELIVERY INFO ADDED' : 'ADD DELIVERY INFO'}
                        </Text>
                        <MaterialCommunityIcons name="plus" size={24} color="#000" />
                    </TouchableOpacity>

                    {/* Checkout Button */}
                    <TouchableOpacity
                        onPress={handleCheckout}
                        disabled={processing || !deliveryInfoAdded}
                        style={[
                            styles.checkoutButton,
                            (!deliveryInfoAdded || processing) && styles.checkoutButtonDisabled
                        ]}
                    >
                        {processing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.checkoutButtonText}>Checkout with Stripe</Text>
                                <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Delivery Info Modal */}
            <Modal
                visible={showDeliveryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDeliveryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Delivery Information</Text>
                            <TouchableOpacity onPress={() => setShowDeliveryModal(false)}>
                                <MaterialCommunityIcons name="close" size={28} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Phone Number *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your phone number"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Delivery Address *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter your full delivery address"
                                value={address}
                                onChangeText={setAddress}
                                multiline
                                numberOfLines={4}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleSaveDeliveryInfo}
                            style={styles.saveButton}
                        >
                            <Text style={styles.saveButtonText}>Save Delivery Info</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        backgroundColor: '#fff',
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#000',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        // Neo shadow sm
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    itemsContainer: {
        // Container for cart items that becomes scrollable when > 3 items
    },
    scrollContent: {
        padding: moderateScale(18),
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: moderateScale(16),
        borderWidth: 2,
        borderColor: '#000',
        // Neo shadow
        shadowColor: '#000',
        shadowOffset: { width: moderateScale(4), height: moderateScale(4) },
        shadowOpacity: 1,
        shadowRadius: 0,
        padding: moderateScale(12),
        marginBottom: moderateScale(16),
    },
    imageContainer: {
        width: moderateScale(75),
        height: moderateScale(75),
        borderRadius: moderateScale(8),
        borderWidth: 2,
        borderColor: '#000',
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
    },
    itemName: {
        fontSize: normalizeFont(15),
        fontWeight: '800',
        color: '#1b140d',
        flex: 1,
        marginRight: moderateScale(8),
    },
    itemVariant: {
        fontSize: normalizeFont(12),
        fontWeight: '600',
        color: '#6B7280',
        marginTop: moderateScale(3),
    },
    itemPrice: {
        fontSize: normalizeFont(16),
        fontWeight: '800',
        color: '#1b140d',
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.pistachio,
        borderRadius: 999, // full
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(4),
        borderWidth: 2,
        borderColor: '#000',
        height: moderateScale(34),
        gap: moderateScale(8),
    },
    stepperButton: {
        width: moderateScale(24),
        height: moderateScale(24),
        borderRadius: moderateScale(12),
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperValue: {
        fontSize: normalizeFont(13),
        fontWeight: '800',
        color: '#000',
        minWidth: moderateScale(16),
        textAlign: 'center',
    },
    summaryContainer: {
        paddingTop: moderateScale(8),
        paddingHorizontal: moderateScale(8),
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: moderateScale(10),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        borderStyle: 'dashed',
    },
    summaryLabel: {
        fontSize: normalizeFont(13),
        fontWeight: '600',
        color: '#4B5563',
    },
    summaryValue: {
        fontSize: normalizeFont(13),
        fontWeight: '800',
        color: '#1b140d',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 2,
        borderTopColor: '#000',
        padding: HORIZONTAL_PADDING,
        // Shadow up
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    totalLabel: {
        fontSize: normalizeFont(13),
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    totalValue: {
        fontSize: normalizeFont(28),
        fontWeight: '900',
        color: '#1b140d',
    },
    checkoutButton: {
        backgroundColor: THEME.primary,
        borderRadius: moderateScale(16),
        paddingVertical: moderateScale(14),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(8),
        borderWidth: 2,
        borderColor: '#000',
        // Neo shadow
        shadowColor: '#000',
        shadowOffset: { width: moderateScale(4), height: moderateScale(4) },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    checkoutButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.6,
    },
    checkoutButtonText: {
        color: '#fff',
        fontSize: normalizeFont(16),
        fontWeight: '800',
    },
    deliveryInfoButton: {
        backgroundColor: THEME.pistachio,
        borderRadius: moderateScale(16),
        paddingVertical: moderateScale(14),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(8),
        borderWidth: 2,
        borderColor: '#000',
        marginBottom: moderateScale(10),
        shadowColor: '#000',
        shadowOffset: { width: moderateScale(4), height: moderateScale(4) },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    deliveryInfoButtonText: {
        color: '#000',
        fontSize: normalizeFont(14),
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: moderateScale(24),
        borderTopRightRadius: moderateScale(24),
        borderWidth: 2,
        borderColor: '#000',
        padding: HORIZONTAL_PADDING,
        paddingBottom: moderateScale(36),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(20),
    },
    modalTitle: {
        fontSize: normalizeFont(20),
        fontWeight: '900',
        color: '#000',
        textTransform: 'uppercase',
    },
    inputContainer: {
        marginBottom: moderateScale(18),
    },
    inputLabel: {
        fontSize: normalizeFont(13),
        fontWeight: '700',
        color: '#1b140d',
        marginBottom: moderateScale(8),
        textTransform: 'uppercase',
    },
    input: {
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: moderateScale(12),
        padding: moderateScale(14),
        fontSize: normalizeFont(15),
        backgroundColor: '#fff',
        color: '#1b140d',
    },
    textArea: {
        height: moderateScale(90),
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: THEME.primary,
        borderRadius: moderateScale(16),
        paddingVertical: moderateScale(14),
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
        marginTop: moderateScale(8),
        shadowColor: '#000',
        shadowOffset: { width: moderateScale(4), height: moderateScale(4) },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: normalizeFont(16),
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: moderateScale(50),
    },
    emptyText: {
        fontSize: normalizeFont(18),
        fontWeight: '700',
        color: '#9CA3AF',
        marginTop: moderateScale(16),
        marginBottom: moderateScale(24),
    },
    continueButton: {
        paddingHorizontal: moderateScale(22),
        paddingVertical: moderateScale(12),
        backgroundColor: '#000',
        borderRadius: moderateScale(12),
    },
    continueButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: normalizeFont(14),
    }
});
