import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { createReport, getMyReports } from '../services/support';


const REPORT_TYPES = [
    { label: 'Technical Bug', value: 'Technical Bug', icon: 'bug' },
    { label: 'Account Issue', value: 'Account Issue', icon: 'account-alert' },
    { label: 'Feature Request', value: 'Feature Request', icon: 'lightbulb' },
    { label: 'Other', value: 'Other', icon: 'help' }
];

export default function SupportScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isTablet = width > 768; // Tablet breakpoint


    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [selectedType, setSelectedType] = useState('Technical Bug');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    // History State
    const [reports, setReports] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const toggleHistory = async () => {
        if (!showHistory) {
            setLoadingHistory(true);
            const { data } = await getMyReports();
            if (data) setReports(data);
            setLoadingHistory(false);
        }
        setShowHistory(!showHistory);
    };

    const handleSubmit = async () => {
        if (!subject.trim() || !description.trim()) {
            Alert.alert('Missing Fields', 'Please fill in both subject and description.');
            return;
        }

        setIsSubmitting(true);

        const reportData = {
            userId: user?.id,
            subject: subject.trim(),
            description: description.trim(),
            type: selectedType
        };

        const { data, error } = await createReport(reportData);

        setIsSubmitting(false);

        if (error) {
            Alert.alert('Error', error);
        } else {
            Alert.alert(
                'Report Submitted',
                'Your report has been sent successfully. The status is now "Pending". An admin will review it shortly.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFAF0' }}>
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingTop: insets.top + 8,
                paddingBottom: 16,
                paddingHorizontal: 16,
                borderBottomWidth: 2,
                borderBottomColor: '#000',
                backgroundColor: '#FFFAF0',
                zIndex: 10
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
                <Text style={{ marginLeft: 16, fontSize: 20, fontWeight: '900', textTransform: 'uppercase' }}>
                    Support & Report
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{
                    padding: 20,
                    paddingBottom: 100,
                    width: '100%',
                    maxWidth: 800,
                    alignSelf: 'center'
                }}>


                    {/* Welcome Text */}
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#4B5563', marginBottom: 24 }}>
                        Have a problem or found a bug? Let us know below. Our team will review your report.
                    </Text>

                    {/* Subject Input */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>Subject Title</Text>
                        <TextInput
                            style={{
                                backgroundColor: '#fff',
                                borderWidth: 2,
                                borderColor: '#000',
                                borderRadius: 12,
                                padding: 12,
                                fontSize: 16,
                                fontWeight: '600',
                                shadowColor: '#000',
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 1,
                                shadowRadius: 0,
                            }}
                            placeholder="Briefly summarize the issue"
                            value={subject}
                            onChangeText={setSubject}
                        />
                    </View>

                    {/* Issue Type Selector */}
                    <View style={{ marginBottom: 20, zIndex: 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>Issue Type</Text>

                        <View>
                            {isTablet ? (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                    {REPORT_TYPES.map((type) => (
                                        <TouchableOpacity
                                            key={type.value}
                                            onPress={() => setSelectedType(type.value)}
                                            style={{
                                                flex: 1, // Distribute space
                                                minWidth: '22%',
                                                paddingHorizontal: 16,
                                                paddingVertical: 14,
                                                backgroundColor: selectedType === type.value ? '#FF6B00' : '#fff',
                                                borderWidth: 2,
                                                borderColor: '#000',
                                                borderRadius: 20,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                shadowColor: '#000',
                                                shadowOffset: { width: 2, height: 2 },
                                                shadowOpacity: 1,
                                                shadowRadius: 0,
                                            }}
                                        >
                                            <MaterialCommunityIcons
                                                name={type.icon}
                                                size={18}
                                                color={selectedType === type.value ? 'white' : 'black'}
                                            />
                                            <Text style={{
                                                fontWeight: '700',
                                                fontSize: 16,
                                                color: selectedType === type.value ? 'white' : 'black'
                                            }}>
                                                {type.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                                    {REPORT_TYPES.map((type) => (
                                        <TouchableOpacity
                                            key={type.value}
                                            onPress={() => setSelectedType(type.value)}
                                            style={{
                                                paddingHorizontal: 16,
                                                paddingVertical: 10,
                                                backgroundColor: selectedType === type.value ? '#FF6B00' : '#fff',
                                                borderWidth: 2,
                                                borderColor: '#000',
                                                borderRadius: 20,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 6,
                                                shadowColor: '#000',
                                                shadowOffset: { width: 2, height: 2 },
                                                shadowOpacity: 1,
                                                shadowRadius: 0,
                                            }}
                                        >
                                            <MaterialCommunityIcons
                                                name={type.icon}
                                                size={18}
                                                color={selectedType === type.value ? 'white' : 'black'}
                                            />
                                            <Text style={{
                                                fontWeight: '700',
                                                color: selectedType === type.value ? 'white' : 'black'
                                            }}>
                                                {type.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    </View>

                    {/* Description Input */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>Description</Text>
                        <TextInput
                            style={{
                                backgroundColor: '#fff',
                                borderWidth: 2,
                                borderColor: '#000',
                                borderRadius: 12,
                                padding: 12,
                                fontSize: 16,
                                fontWeight: '500',
                                height: 150,
                                textAlignVertical: 'top',
                                shadowColor: '#000',
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 1,
                                shadowRadius: 0,
                            }}
                            placeholder="Describe the issue in detail..."
                            multiline
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        style={{
                            backgroundColor: '#CCFF66',
                            borderWidth: 2,
                            borderColor: '#000',
                            borderRadius: 16,
                            paddingVertical: 18,
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 4, height: 4 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 10
                        }}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <>
                                <Text style={{ fontSize: 18, fontWeight: '900', textTransform: 'uppercase' }}>Send Report</Text>
                                <MaterialCommunityIcons name="send" size={24} color="black" />
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={{ textAlign: 'center', marginTop: 16, color: '#6B7280', fontSize: 12, fontWeight: '600' }}>
                        Default status will be "Pending" until reviewed.
                    </Text>

                    {/* Divider */}
                    <View style={{ height: 2, backgroundColor: '#E5E7EB', marginVertical: 32 }} />

                    {/* Track Reports Section */}
                    <TouchableOpacity
                        onPress={toggleHistory}
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            borderWidth: 2,
                            borderColor: '#000',
                            borderRadius: 16,
                            padding: 16,
                            shadowColor: '#000',
                            shadowOffset: { width: 3, height: 3 },
                            shadowOpacity: 1,
                            shadowRadius: 0,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{
                                width: 40,
                                height: 40,
                                backgroundColor: '#E0E7FF',
                                borderRadius: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 2,
                                borderColor: '#000'
                            }}>
                                <MaterialCommunityIcons name="clipboard-text-search" size={20} color="black" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase' }}>Track My Reports</Text>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>View status of your issues</Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons
                            name={showHistory ? "chevron-up" : "chevron-down"}
                            size={24}
                            color="black"
                        />
                    </TouchableOpacity>

                    {/* Report List */}
                    {showHistory && (
                        <View style={{ marginTop: 16, gap: 12 }}>
                            {loadingHistory ? (
                                <ActivityIndicator size="small" color="#FF6B00" />
                            ) : reports.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#6B7280', fontWeight: '600' }}>No reports found.</Text>
                            ) : (
                                <View style={{ flexDirection: isTablet ? 'row' : 'column', flexWrap: 'wrap', gap: 12 }}>
                                    {reports.map((report) => (
                                        <View
                                            key={report.id}
                                            style={{
                                                backgroundColor: '#fff',
                                                padding: 16,
                                                borderRadius: 12,
                                                borderWidth: 2,
                                                borderColor: '#000',
                                                width: isTablet ? '48%' : '100%' // Grid on tablet
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '800', flex: 1 }}>{report.subject}</Text>
                                                <View style={{
                                                    backgroundColor: report.status === 'Solved' ? '#CCFF66' : report.status === 'In Progress' ? '#60A5FA' : '#FEF3C7',
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 4,
                                                    borderRadius: 8,
                                                    borderWidth: 1,
                                                    borderColor: '#000'
                                                }}>
                                                    <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>{report.status}</Text>
                                                </View>
                                            </View>
                                            <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 4 }}>{report.type}</Text>
                                            <Text style={{ fontSize: 14, color: '#000', lineHeight: 20 }}>{report.description}</Text>
                                            <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 8, textAlign: 'right' }}>
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </View >
    );
}
