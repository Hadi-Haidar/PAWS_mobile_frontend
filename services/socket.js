import Constants from "expo-constants";
import { io } from "socket.io-client";

// Replace with your machine's IP address if running on physical device
// For emulator, 10.0.2.2 usually maps to localhost.
// Getting host uri from expo constants if available
const origin = Constants.expoConfig?.hostUri
    ? `http://${Constants.expoConfig.hostUri.split(':').shift()}:5000`
    : 'http://localhost:5000';



const socket = io(origin, {
    autoConnect: false,
});

export default socket;
