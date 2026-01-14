import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    PixelRatio,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { getProducts } from '../../services/products';

// Responsive utilities
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive font scaling
const fontScale = PixelRatio.getFontScale();
const normalizeFont = (size) => {
    const newSize = moderateScale(size);
    return Math.round(PixelRatio.roundToNearestPixel(newSize / fontScale));
};

// Dynamic column calculation based on screen width
const getNumColumns = () => {
    if (SCREEN_WIDTH >= 768) return 3; // Tablet
    if (SCREEN_WIDTH >= 480) return 2; // Large phone
    return 2; // Regular phone
};

const NUM_COLUMNS = getNumColumns();
const HORIZONTAL_PADDING = moderateScale(16);
const CARD_GAP = moderateScale(12);
const CARD_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - (CARD_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

const CATEGORIES = ['All', 'Food', 'Accessories', 'Medical'];

// Category backgrounds for visual appeal
const CATEGORY_COLORS = {
    'Food': '#CDE8C3',
    'Accessories': '#BFDBFE',
    'Medical': '#FED7AA',
    'default': '#E5E7EB'
};

export default function ShopScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { cart, addToCart, getCartTotal } = useCart();
    const { itemCount } = getCartTotal();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Fetch products
    const fetchProducts = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        const { data, error } = await getProducts(selectedCategory);
        if (data) {
            setProducts(data);
        }
        setLoading(false);
        setRefreshing(false);
    }, [selectedCategory]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchProducts(false);
    };

    const handleAddToCart = (product) => {
        addToCart(product);
        Alert.alert('Added to Cart', `${product.name} added to cart!`, [{ text: 'OK' }]);
    };

    // Render product card
    const renderProduct = ({ item }) => {
        const bgColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['default'];

        return (
            <View
                style={{
                    width: CARD_WIDTH,
                    backgroundColor: '#fff',
                    borderRadius: moderateScale(16),
                    borderWidth: 2,
                    borderColor: '#000',
                    padding: moderateScale(10),
                    marginBottom: moderateScale(12),
                    marginHorizontal: CARD_GAP / 2,
                    shadowColor: '#000',
                    shadowOffset: { width: moderateScale(4), height: moderateScale(4) },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                    elevation: 4,
                }}
            >
                {/* Product Image */}
                <View
                    style={{
                        aspectRatio: 1,
                        borderRadius: moderateScale(12),
                        borderWidth: 2,
                        borderColor: '#000',
                        overflow: 'hidden',
                        backgroundColor: bgColor,
                        marginBottom: moderateScale(10),
                    }}
                >
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                    />
                    {/* Stock Badge */}
                    {item.stock < 5 && (
                        <View
                            style={{
                                position: 'absolute',
                                top: moderateScale(6),
                                right: moderateScale(6),
                                backgroundColor: item.stock === 0 ? '#EF4444' : '#FF6B00',
                                paddingHorizontal: moderateScale(6),
                                paddingVertical: moderateScale(3),
                                borderRadius: moderateScale(6),
                                borderWidth: 2,
                                borderColor: '#000',
                            }}
                        >
                            <Text style={{ fontSize: normalizeFont(9), fontWeight: '900', color: '#fff' }}>
                                {item.stock === 0 ? 'SOLD OUT' : `${item.stock} LEFT`}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Product Info */}
                <View style={{ marginBottom: moderateScale(10) }}>
                    <Text
                        numberOfLines={1}
                        style={{
                            fontSize: normalizeFont(14),
                            fontWeight: '800',
                            color: '#1b140d',
                            marginBottom: moderateScale(3),
                        }}
                    >
                        {item.name}
                    </Text>
                    <Text
                        style={{
                            fontSize: normalizeFont(10),
                            fontWeight: '700',
                            color: '#6B7280',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}
                    >
                        {item.category}
                    </Text>
                </View>

                {/* Price & Add Button */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: normalizeFont(16), fontWeight: '900', color: '#1b140d' }}>
                        ${parseFloat(item.price).toFixed(2)}
                    </Text>
                    <TouchableOpacity
                        onPress={() => handleAddToCart(item)}
                        disabled={item.stock === 0}
                        style={{
                            width: moderateScale(32),
                            height: moderateScale(32),
                            backgroundColor: item.stock === 0 ? '#9CA3AF' : '#FF6B00',
                            borderRadius: moderateScale(8),
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
                        <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFAF0' }}>
            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: insets.top + moderateScale(8),
                    paddingBottom: moderateScale(14),
                    paddingHorizontal: HORIZONTAL_PADDING,
                    borderBottomWidth: 2,
                    borderBottomColor: '#000',
                    backgroundColor: '#fff',
                }}
            >
                <View
                    style={{
                        width: moderateScale(40),
                        height: moderateScale(40),
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <MaterialCommunityIcons name="paw" size={moderateScale(22)} color="#FF6B00" />
                </View>

                <Text
                    style={{
                        fontSize: normalizeFont(20),
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        color: '#1b140d',
                    }}
                >
                    Pet Shop
                </Text>

                {/* Cart Button */}
                <TouchableOpacity
                    onPress={() => router.push('/cart')}
                    style={{
                        width: moderateScale(40),
                        height: moderateScale(40),
                        backgroundColor: itemCount > 0 ? '#FF6B00' : '#fff',
                        borderRadius: moderateScale(20),
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
                    <MaterialCommunityIcons name="cart" size={moderateScale(20)} color={itemCount > 0 ? '#fff' : '#000'} />
                    {itemCount > 0 && (
                        <View
                            style={{
                                position: 'absolute',
                                top: moderateScale(-5),
                                right: moderateScale(-5),
                                backgroundColor: '#CCFF66',
                                borderRadius: moderateScale(10),
                                borderWidth: 2,
                                borderColor: '#000',
                                minWidth: moderateScale(18),
                                height: moderateScale(18),
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: normalizeFont(10), fontWeight: '900', color: '#000' }}>
                                {itemCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Category Chips */}
            <View
                style={{
                    backgroundColor: '#FFFAF0',
                    borderBottomWidth: 2,
                    borderBottomColor: '#000',
                    paddingVertical: moderateScale(14),
                }}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, gap: moderateScale(10) }}
                >
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setSelectedCategory(cat)}
                            style={{
                                height: moderateScale(36),
                                paddingHorizontal: moderateScale(18),
                                borderRadius: moderateScale(18),
                                borderWidth: 2,
                                borderColor: '#000',
                                backgroundColor: selectedCategory === cat ? '#000' : '#fff',
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 1,
                                shadowRadius: 0,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: normalizeFont(12),
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    color: selectedCategory === cat ? '#fff' : '#1b140d',
                                }}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Products Grid */}
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#FF6B00" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={NUM_COLUMNS}
                    key={NUM_COLUMNS}
                    columnWrapperStyle={{
                        paddingHorizontal: HORIZONTAL_PADDING - (CARD_GAP / 2),
                    }}
                    contentContainerStyle={{
                        paddingTop: moderateScale(14),
                        paddingBottom: moderateScale(100)
                    }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#FF6B00']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: moderateScale(50) }}>
                            <MaterialCommunityIcons name="shopping-outline" size={moderateScale(56)} color="#ccc" />
                            <Text style={{ color: '#9CA3AF', fontSize: normalizeFont(16), fontWeight: '700', marginTop: moderateScale(14) }}>
                                No products found
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        products.length > 0 ? (
                            <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
                                {/* Free Delivery Banner */}
                                <View
                                    style={{
                                        backgroundColor: '#FF6B00',
                                        borderRadius: 16,
                                        borderWidth: 2,
                                        borderColor: '#000',
                                        padding: 20,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        shadowColor: '#000',
                                        shadowOffset: { width: 4, height: 4 },
                                        shadowOpacity: 1,
                                        shadowRadius: 0,
                                    }}
                                >
                                    <View>
                                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', fontStyle: 'italic', textTransform: 'uppercase' }}>
                                            Free Delivery
                                        </Text>
                                        <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>
                                            On orders over $50
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: '#fff',
                                            borderRadius: 12,
                                            borderWidth: 2,
                                            borderColor: '#000',
                                            padding: 10,
                                        }}
                                    >
                                        <MaterialCommunityIcons name="truck-fast" size={28} color="#000" />
                                    </View>
                                </View>
                            </View>
                        ) : null
                    }
                />
            )}


        </View>
    );
}
