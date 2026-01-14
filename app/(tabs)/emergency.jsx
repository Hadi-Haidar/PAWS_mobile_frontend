import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    PixelRatio,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
    bookAppointment,
    getAppointments,
    getAvailableSlots,
    getUserPets,
    getVets
} from '../../services/appointments';


// Responsive utilities with dynamic dimensions support
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Device type detection
const isTablet = SCREEN_WIDTH >= 768;
const isSmallDevice = SCREEN_WIDTH < 375;

// Clamp utility for min/max bounds
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Horizontal scaling
const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

// Vertical scaling for height-dependent elements
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

// Moderate scaling with adjustable factor (better for text and spacing)
const moderateScale = (size, factor = 0.5) => {
    const scaledSize = size + (scale(size) - size) * factor;
    // Clamp to reasonable bounds for very large/small screens
    return clamp(scaledSize, size * 0.8, size * 1.6);
};

// Font scaling that respects user accessibility settings while staying readable
const fontScale = PixelRatio.getFontScale();
const normalizeFont = (size) => {
    const newSize = moderateScale(size, 0.4);
    const scaled = Math.round(PixelRatio.roundToNearestPixel(newSize));
    // Ensure minimum readability and maximum bounds
    return clamp(scaled, size * 0.85, size * 1.4);
};

// Dynamic padding based on screen width
const HORIZONTAL_PADDING = clamp(moderateScale(20), 16, 32);

const THEME = {
    primary: '#FF6B00',
    pistachio: '#D1F2A5',
    pistachioDark: '#8FB35B',
    background: '#FDFBF6',
    surface: '#FFFFFF',
    text: '#000000',
};

const VISIT_REASONS = [
    'Annual Checkup',
    'Vaccination',
    'Injury / Illness',
    'Grooming',
    'Emergency',
];

// Pet emoji mapping
const getPetEmoji = (type) => {
    const typeLC = type?.toLowerCase() || '';
    if (typeLC.includes('dog')) return '🐕';
    if (typeLC.includes('cat')) return '🐈';
    if (typeLC.includes('rabbit') || typeLC.includes('bunny')) return '🐇';
    if (typeLC.includes('bird')) return '🐦';
    if (typeLC.includes('fish')) return '🐠';
    if (typeLC.includes('hamster')) return '🐹';
    return '🐾';
};

export default function EmergencyScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();

    // State
    const [pets, setPets] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [vets, setVets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);

    // Form state
    const [selectedPet, setSelectedPet] = useState(null);
    const [selectedReason, setSelectedReason] = useState(VISIT_REASONS[0]);
    const [selectedVet, setSelectedVet] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Modal states
    const [showPetModal, setShowPetModal] = useState(false);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [showVetModal, setShowVetModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Display first 3 pets, rest shown in modal
    const displayedPets = pets.slice(0, 3);
    const hiddenPets = pets.slice(3);

    // Fetch data on mount
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [petsRes, appointmentsRes, vetsRes] = await Promise.all([
                getUserPets(),
                getAppointments(),
                getVets()
            ]);

            if (petsRes.data) setPets(petsRes.data);
            if (appointmentsRes.data) setAppointments(appointmentsRes.data);
            if (vetsRes.data) setVets(vetsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch data using useFocusEffect to refresh when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    // Realtime subscription for appointment updates
    useEffect(() => {
        if (!user) return;

        const subscription = supabase
            .channel('appointments_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'Appointment',
                    filter: `userId=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Realtime Appointment Update:', payload);
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user, fetchData]);

    // Fetch available slots when date changes
    const fetchSlots = useCallback(async (date) => {
        setLoadingSlots(true);
        try {
            const { data, error } = await getAvailableSlots(date.toISOString());
            if (data) {
                setAvailableSlots(data);
                if (data.length > 0 && !selectedTime) {
                    setSelectedTime(data[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching slots:', error);
        } finally {
            setLoadingSlots(false);
        }
    }, [selectedTime]);

    useEffect(() => {
        fetchSlots(selectedDate);
    }, [selectedDate, fetchSlots]);

    // Handle date change
    const handleDateChange = (event, date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
            setSelectedTime(null);
        }
    };

    // Handle time selection
    const handleTimeSelect = (time) => {
        setSelectedTime(time);
    };

    // Format date for display
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Format time for display
    const formatTimeDisplay = (time) => {
        if (!time) return '--:--';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return `${displayHour}:${minutes} ${ampm}`;
    };

    // Handle booking
    const handleBookAppointment = async () => {
        if (!selectedPet) {
            Alert.alert('Select Pet', 'Please select a pet for the appointment');
            return;
        }

        if (!selectedTime) {
            Alert.alert('Select Time', 'Please select a time slot');
            return;
        }

        setBooking(true);

        try {
            // Combine date and time
            const [hours, minutes] = selectedTime.split(':');
            const appointmentDate = new Date(selectedDate);
            appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const isEmergency = selectedReason === 'Emergency';

            const { data, error } = await bookAppointment(
                selectedPet.id,
                appointmentDate.toISOString(),
                selectedReason,
                selectedVet?.id,
                false // isEmergency
            );

            if (error) {
                Alert.alert('Booking Failed', error);
            } else {
                Alert.alert(
                    '🎉 Appointment Booked!',
                    `Your appointment for ${selectedPet.name} has been scheduled for ${formatDate(appointmentDate)} at ${formatTimeDisplay(selectedTime)}`,
                    [{ text: 'OK', onPress: () => fetchData() }]
                );
                // Reset form
                setSelectedPet(null);
                setSelectedTime(null);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to book appointment');
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={THEME.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.headerSection}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.titleText}>Book a Vet</Text>
                    </View>
                    <Text style={styles.subtitleText}>
                        Schedule a visit for your furry friend.
                    </Text>
                </View>

                {/* Upcoming Appointments */}
                {appointments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>YOUR APPOINTMENTS</Text>
                        <View style={{ gap: 12 }}>
                            {appointments.map((apt) => {
                                const isRescheduled = !!apt.updatedDate;
                                // If rescheduled: date = original (RED), updatedDate = new (GREEN)
                                // If normal: date = current (GREEN)

                                const originalDate = new Date(apt.date);
                                const newDate = isRescheduled ? new Date(apt.updatedDate) : originalDate;
                                const displayDate = isRescheduled ? new Date(apt.updatedDate) : originalDate;

                                return (
                                    <View key={apt.id} style={styles.appointmentCard}>
                                        <View style={styles.appointmentHeader}>
                                            <View>
                                                <View style={styles.appointmentPet}>
                                                    <Text style={styles.appointmentPetName}>
                                                        {apt.Pet?.name || 'Unknown Pet'}
                                                    </Text>
                                                    <Text style={styles.appointmentPetType}>
                                                        ({apt.Pet?.type || 'Pet'})
                                                    </Text>
                                                </View>
                                                {apt.Vet?.name && (
                                                    <Text style={styles.appointmentVet}>
                                                        with Dr. {apt.Vet.name}
                                                    </Text>
                                                )}
                                            </View>
                                            <Text style={styles.appointmentDate}>
                                                {displayDate.toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </Text>
                                        </View>

                                        <View style={styles.appointmentTimeContainer}>
                                            {isRescheduled && (
                                                <View style={styles.timeBlock}>
                                                    <Text style={styles.timeLabel}>ORIGINAL</Text>
                                                    <Text style={[styles.timeText, styles.timeTextOriginal]}>
                                                        {originalDate.toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Divider if rescheduled */}
                                            {isRescheduled && <View style={styles.timeDivider} />}

                                            <View style={styles.timeBlock}>
                                                {isRescheduled && <Text style={styles.timeLabel}>NEW TIME</Text>}
                                                <Text style={[styles.timeText, styles.timeTextNew]}>
                                                    {newDate.toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )
                }

                {/* Select Pet Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>SELECT PET</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.petList}
                    >
                        {displayedPets.map((pet) => (
                            <TouchableOpacity
                                key={pet.id}
                                onPress={() => setSelectedPet(pet)}
                                style={styles.petItem}
                            >
                                <View style={[
                                    styles.petCircle,
                                    selectedPet?.id === pet.id && styles.petCircleSelected
                                ]}>
                                    {pet.images?.[0] ? (
                                        <Image
                                            source={{ uri: pet.images[0] }}
                                            style={styles.petImage}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <Text style={styles.petEmoji}>{getPetEmoji(pet.type)}</Text>
                                    )}
                                </View>
                                <Text style={[
                                    styles.petName,
                                    selectedPet?.id === pet.id && styles.petNameSelected
                                ]}>
                                    {pet.name}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {/* Add/More button */}
                        {(hiddenPets.length > 0 || pets.length === 0) && (
                            <TouchableOpacity
                                onPress={() => setShowPetModal(true)}
                                style={styles.petItem}
                            >
                                <View style={styles.addPetCircle}>
                                    <MaterialCommunityIcons name="plus" size={24} color="#666" />
                                </View>
                                <Text style={styles.addPetText}>
                                    {hiddenPets.length > 0 ? 'More' : 'Add'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                {/* Reason for Visit */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>REASON FOR VISIT</Text>
                    <TouchableOpacity
                        onPress={() => setShowReasonModal(true)}
                        style={styles.selectButton}
                    >
                        <Text style={styles.selectButtonText}>{selectedReason}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* Select Vet */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>SELECT VET</Text>
                    <TouchableOpacity
                        onPress={() => setShowVetModal(true)}
                        style={styles.selectButton}
                    >
                        <Text style={styles.selectButtonText}>
                            {selectedVet ? selectedVet.name : 'Any Available Vet'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* Date & Time */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>DATE & TIME</Text>
                    <View style={styles.dateTimeRow}>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={[styles.dateTimeCard, styles.dateCard]}
                        >
                            <Text style={styles.dateTimeLabel}>DATE</Text>
                            <Text style={styles.dateTimeValue}>{formatDate(selectedDate)}</Text>
                        </TouchableOpacity>

                        <View style={styles.dateTimeCard}>
                            <Text style={[styles.dateTimeLabel, { color: '#000' }]}>TIME</Text>
                            <Text style={styles.dateTimeValue}>
                                {formatTimeDisplay(selectedTime)}
                            </Text>
                        </View>
                    </View>

                    {/* Time Slots */}
                    {loadingSlots ? (
                        <ActivityIndicator style={{ marginTop: 12 }} color={THEME.primary} />
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.timeSlots}
                        >
                            {availableSlots.map((slot) => (
                                <TouchableOpacity
                                    key={slot}
                                    onPress={() => handleTimeSelect(slot)}
                                    style={[
                                        styles.timeSlot,
                                        selectedTime === slot && styles.timeSlotSelected
                                    ]}
                                >
                                    <Text style={[
                                        styles.timeSlotText,
                                        selectedTime === slot && styles.timeSlotTextSelected
                                    ]}>
                                        {formatTimeDisplay(slot)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Book Button */}
                <TouchableOpacity
                    onPress={handleBookAppointment}
                    disabled={booking || !selectedPet || !selectedTime}
                    style={[
                        styles.bookButton,
                        (!selectedPet || !selectedTime) && styles.bookButtonDisabled
                    ]}
                >
                    {booking ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.bookButtonText}>Book Appointment</Text>
                            <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>

                {/* Bottom spacing for tab bar */}
                <View style={{ height: moderateScale(100) }} />
            </ScrollView >

            {/* Date Picker Modal */}
            {
                showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                    />
                )
            }

            {/* Pet Selection Modal */}
            <Modal
                visible={showPetModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPetModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Pet</Text>
                            <TouchableOpacity onPress={() => setShowPetModal(false)}>
                                <MaterialCommunityIcons name="close" size={28} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                            {pets.map((pet) => {
                                const isSelected = selectedPet?.id === pet.id;
                                return (
                                    <TouchableOpacity
                                        key={pet.id}
                                        onPress={() => {
                                            setSelectedPet(pet);
                                            setShowPetModal(false);
                                        }}
                                        style={[
                                            styles.modalPetCard,
                                            isSelected && styles.modalPetCardSelected
                                        ]}
                                    >
                                        <View style={styles.modalPetImageContainer}>
                                            {pet.images?.[0] ? (
                                                <Image
                                                    source={{ uri: pet.images[0] }}
                                                    style={styles.modalPetImage}
                                                    contentFit="cover"
                                                />
                                            ) : (
                                                <Text style={{ fontSize: 24 }}>{getPetEmoji(pet.type)}</Text>
                                            )}
                                        </View>
                                        <View style={styles.modalPetInfo}>
                                            <Text style={styles.modalPetName}>{pet.name}</Text>
                                            <Text style={styles.modalPetBreed}>
                                                {pet.type || 'Unknown Type'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Reason Selection Modal */}
            <Modal
                visible={showReasonModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowReasonModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Reason for Visit</Text>
                            <TouchableOpacity onPress={() => setShowReasonModal(false)}>
                                <MaterialCommunityIcons name="close" size={28} color="#000" />
                            </TouchableOpacity>
                        </View>
                        {VISIT_REASONS.map((reason) => (
                            <TouchableOpacity
                                key={reason}
                                onPress={() => {
                                    setSelectedReason(reason);
                                    setShowReasonModal(false);
                                }}
                                style={[
                                    styles.modalOption,
                                    selectedReason === reason && styles.modalOptionSelected
                                ]}
                            >
                                <Text style={styles.modalOptionText}>{reason}</Text>
                                {selectedReason === reason && (
                                    <MaterialCommunityIcons name="check" size={20} color={THEME.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* Vet Selection Modal */}
            <Modal
                visible={showVetModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowVetModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Vet</Text>
                            <TouchableOpacity onPress={() => setShowVetModal(false)}>
                                <MaterialCommunityIcons name="close" size={28} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                            {/* Any Vet Option */}
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedVet(null);
                                    setShowVetModal(false);
                                }}
                                style={[
                                    styles.modalOption,
                                    selectedVet === null && styles.modalOptionSelected
                                ]}
                            >
                                <Text style={styles.modalOptionText}>Any Available Vet</Text>
                                {selectedVet === null && (
                                    <MaterialCommunityIcons name="check" size={20} color={THEME.primary} />
                                )}
                            </TouchableOpacity>

                            {/* List of Vets */}
                            {vets.map((vet) => (
                                <TouchableOpacity
                                    key={vet.id}
                                    onPress={() => {
                                        setSelectedVet(vet);
                                        setShowVetModal(false);
                                    }}
                                    style={[
                                        styles.modalOption,
                                        selectedVet?.id === vet.id && styles.modalOptionSelected
                                    ]}
                                >
                                    <Text style={styles.modalOptionText}>{vet.name}</Text>
                                    {selectedVet?.id === vet.id && (
                                        <MaterialCommunityIcons name="check" size={20} color={THEME.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: HORIZONTAL_PADDING,
    },
    headerSection: {
        marginBottom: moderateScale(24),
    },
    titleContainer: {
        backgroundColor: THEME.pistachio,
        paddingHorizontal: clamp(moderateScale(12), 10, 18),
        paddingVertical: clamp(moderateScale(8), 6, 12),
        borderWidth: 2,
        borderColor: '#000',
        alignSelf: 'flex-start',
        transform: [{ rotate: '-1deg' }],
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 3,
        marginBottom: moderateScale(8),
    },
    titleText: {
        fontSize: clamp(normalizeFont(28), 24, 36),
        fontWeight: '900',
        color: '#000',
    },
    subtitleText: {
        fontSize: clamp(normalizeFont(15), 13, 18),
        fontWeight: '600',
        color: '#666',
        marginTop: moderateScale(4),
        lineHeight: clamp(normalizeFont(22), 18, 26),
    },
    appointmentCard: {
        backgroundColor: '#fff',
        borderRadius: moderateScale(16),
        borderWidth: 2,
        borderColor: '#000',
        padding: clamp(moderateScale(16), 14, 24),
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: moderateScale(12),
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: moderateScale(8),
        flexWrap: 'wrap',
        gap: moderateScale(8),
    },
    appointmentPet: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: moderateScale(4),
    },
    appointmentPetName: {
        fontSize: normalizeFont(16),
        fontWeight: '900',
        color: '#000',
    },
    appointmentPetType: {
        fontSize: normalizeFont(12),
        fontWeight: '600',
        color: '#666',
    },
    appointmentVet: {
        fontSize: normalizeFont(11),
        fontWeight: '500',
        color: '#888',
        marginTop: verticalScale(2),
    },
    appointmentDate: {
        fontSize: normalizeFont(14),
        fontWeight: '700',
        color: '#000',
        backgroundColor: THEME.pistachio,
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(2),
        borderRadius: moderateScale(4),
        borderWidth: 1,
        borderColor: '#000',
        overflow: 'hidden',
    },
    appointmentTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(12),
    },
    timeBlock: {
        alignItems: 'flex-start',
    },
    timeLabel: {
        fontSize: normalizeFont(10),
        fontWeight: '800',
        color: '#999',
        marginBottom: moderateScale(2),
        letterSpacing: 0.5,
    },
    timeText: {
        fontSize: normalizeFont(16),
        fontWeight: '800',
    },
    timeTextOriginal: {
        color: '#EF4444',
        textDecorationLine: 'line-through',
    },
    timeTextNew: {
        color: '#22C55E',
    },
    timeDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#ddd',
        marginHorizontal: moderateScale(4),
    },
    section: {
        marginBottom: moderateScale(24),
    },
    sectionLabel: {
        fontSize: normalizeFont(12),
        fontWeight: '800',
        color: '#000',
        letterSpacing: 1,
        marginBottom: moderateScale(12),
    },
    petList: {
        gap: moderateScale(16),
    },
    petItem: {
        alignItems: 'center',
        gap: moderateScale(8),
    },
    petCircle: {
        width: clamp(moderateScale(64), 56, 80),
        height: clamp(moderateScale(64), 56, 80),
        borderRadius: clamp(moderateScale(32), 28, 40),
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 3,
    },
    petCircleSelected: {
        backgroundColor: THEME.pistachio,
        borderColor: THEME.primary,
        borderWidth: 4,
    },
    petImage: {
        width: '100%',
        height: '100%',
    },
    petEmoji: {
        fontSize: moderateScale(28),
    },
    petName: {
        fontSize: normalizeFont(11),
        fontWeight: '800',
        color: '#666',
    },
    petNameSelected: {
        color: '#000',
    },
    addPetCircle: {
        width: moderateScale(64),
        height: moderateScale(64),
        borderRadius: moderateScale(32),
        backgroundColor: '#eee',
        borderWidth: 2,
        borderColor: '#000',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addPetText: {
        fontSize: normalizeFont(11),
        fontWeight: '800',
        color: '#666',
    },
    selectButton: {
        minHeight: clamp(moderateScale(48), 44, 56),
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: moderateScale(12),
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(10),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 3,
    },
    selectButtonText: {
        fontSize: normalizeFont(15),
        fontWeight: '800',
        color: '#000',
        flex: 1,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: moderateScale(12),
    },
    dateTimeCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: moderateScale(12),
        padding: moderateScale(12),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    dateCard: {
        backgroundColor: THEME.pistachio,
    },
    dateTimeLabel: {
        fontSize: normalizeFont(10),
        fontWeight: '800',
        opacity: 0.7,
        marginBottom: moderateScale(4),
    },
    dateTimeValue: {
        fontSize: normalizeFont(18),
        fontWeight: '900',
        color: '#000',
    },
    timeSlots: {
        gap: moderateScale(8),
        marginTop: moderateScale(12),
    },
    timeSlot: {
        minWidth: clamp(moderateScale(70), 60, 90),
        minHeight: clamp(moderateScale(40), 40, 50),
        paddingHorizontal: moderateScale(14),
        paddingVertical: moderateScale(10),
        borderRadius: moderateScale(10),
        borderWidth: 2,
        borderColor: '#ddd',
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeSlotSelected: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    timeSlotText: {
        fontSize: normalizeFont(12),
        fontWeight: '800',
        color: '#666',
    },
    timeSlotTextSelected: {
        color: '#fff',
    },
    bookButton: {
        backgroundColor: THEME.primary,
        borderRadius: moderateScale(16),
        minHeight: clamp(moderateScale(56), 52, 64),
        paddingVertical: moderateScale(16),
        paddingHorizontal: moderateScale(24),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(8),
        borderWidth: 2,
        borderColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 5,
    },
    bookButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0.3,
    },
    bookButtonText: {
        fontSize: normalizeFont(18),
        fontWeight: '800',
        color: '#fff',
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
        paddingBottom: clamp(moderateScale(40), 32, 60),
        maxWidth: isTablet ? 600 : '100%',
        alignSelf: 'center',
        width: '100%',
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
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: moderateScale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        gap: moderateScale(12),
    },
    modalOptionSelected: {
        backgroundColor: '#f5f5f5',
    },
    modalOptionEmoji: {
        fontSize: moderateScale(24),
    },
    modalOptionText: {
        flex: 1,
        fontSize: normalizeFont(16),
        fontWeight: '700',
        color: '#000',
    },
    // New Styles for Pet Modal Cards
    modalPetCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: moderateScale(16),
        padding: moderateScale(12),
        marginBottom: moderateScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    modalPetCardSelected: {
        backgroundColor: THEME.pistachio,
    },
    modalPetImageContainer: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#000',
        overflow: 'hidden',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: moderateScale(12),
    },
    modalPetImage: {
        width: '100%',
        height: '100%',
    },
    modalPetInfo: {
        flex: 1,
    },
    modalPetName: {
        fontSize: normalizeFont(16),
        fontWeight: '900',
        color: '#000',
        marginBottom: moderateScale(2),
    },
    modalPetBreed: {
        fontSize: normalizeFont(13),
        fontWeight: '600',
        color: '#555',
    },
});
