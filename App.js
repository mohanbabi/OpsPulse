import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, PermissionsAndroid, Vibration, DeviceEventEmitter,
  Keyboard, ScrollView
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { NativeModules } from 'react-native';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const { USBSerialModule } = NativeModules;

export default function App() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("Initializing...");
  const [note, setNote] = useState("");
  const [response, setResponse] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [chatMode, setChatMode] = useState(false);
  const [loraAddress, setLoraAddress] = useState("2");  // ✅ LoRa Address

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setStatus("Location permission denied");
      return;
    }

    Geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        };
        setLocation(coords);
        setStatus(`Lat: ${coords.latitude}, Lon: ${coords.longitude}`);
      },
      (err) => setStatus("Location error: " + err.message),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        distanceFilter: 1
      }
    );
  };

  const openPort = async () => {
    try {
      const msg = await USBSerialModule.openPort(115200, "USB0");
      setStatus(msg);
    } catch (err) {
      setStatus(err.message);
    }
  };

  const closePort = async () => {
    try {
      const msg = await USBSerialModule.closePort();
      setStatus(msg);
    } catch (err) {
      setStatus(err.message);
    }
  };

  const sendRescueMessage = async () => {
    if (!location) {
      setStatus("No location available");
      return;
    }

    if (!/^\d+$/.test(loraAddress)) {
      setStatus("Invalid LoRa address");
      return;
    }

    const lat = location.latitude;
    const lon = location.longitude;
    const safeNote = note.trim().replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 32);
    const messageToSend = `${lat},${lon},${safeNote}`;
    const length = messageToSend.length;
    const atCommand = `AT+SEND=${loraAddress},${length},${messageToSend}\r\n`;

    try {
      const msg = await USBSerialModule.sendMessage(atCommand);
      setStatus("Sent: " + msg);
    } catch (err) {
      setStatus("Send failed: " + err.message);
    }
  };

  const sendChatMessage = async () => {
    const safeNote = note.trim().replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 64);
    if (!safeNote) return;

    if (!/^\d+$/.test(loraAddress)) {
      setStatus("Invalid LoRa address");
      return;
    }

    const length = safeNote.length;
    const atCommand = `AT+SEND=${loraAddress},${length},${safeNote}\r\n`;

    try {
      const msg = await USBSerialModule.sendMessage(atCommand);
      setChatLog(prev => [...prev, { sender: "You", text: safeNote }].slice(-50));
      setNote("");
    } catch (err) {
      setStatus("Send failed: " + err.message);
    }
  };

  const toggleMode = () => {
    setChatMode(prev => !prev);
    setNote('');
    setResponse('');
    setStatus(chatMode ? 'Switched to Rescue Mode' : 'Switched to Chat Mode');
  };

  const parseRCVMessage = (raw) => {
    try {
      const parts = raw.split(',');
      if (parts.length < 3) return null;
      const msgStartIndex = raw.indexOf(",", raw.indexOf(",") + 1) + 1;
      const message = raw.substring(msgStartIndex).split(',')[0];
      return message.trim();
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    getLocation();

    const sub = DeviceEventEmitter.addListener('onSerialData', (event) => {
      const rawData = event.data.trim();
      setResponse(rawData);

      if (rawData === "+OK") {
        Vibration.vibrate(1000);
        ReactNativeHapticFeedback.trigger("notificationSuccess", {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false
        });

        const sound = new Sound('success.mp3', Sound.MAIN_BUNDLE, (error) => {
          if (!error) sound.play();
        });
      }

      if (chatMode && rawData.startsWith("+RCV=")) {
        const message = parseRCVMessage(rawData);
        if (message) {
          setChatLog(prev => [...prev, { sender: "Peer", text: message }].slice(-50));
        }
      }
    });

    return () => sub.remove();
  }, [chatMode]);

  return (
    <View style={{ flex: 1, backgroundColor: '#111' }}>
      {chatMode ? (
        <>
          <TextInput
            style={[styles.chatInput, { margin: 10, backgroundColor: '#222' }]}
            placeholder="LoRa Address (e.g. 2)"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={loraAddress}
            onChangeText={setLoraAddress}
          />
          <FlatList
            data={[...chatLog].reverse()}
            style={styles.chatContainer}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.sender === 'You' ? styles.messageRight : styles.messageLeft,
                ]}>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            )}
            inverted
          />
          <TouchableOpacity style={styles.actionButton} onPress={toggleMode}>
            <Text style={styles.buttonText}>SWITCH TO RESCUE MODE</Text>
          </TouchableOpacity>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
            style={styles.inputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message"
              placeholderTextColor="#aaa"
              value={note}
              onChangeText={setNote}
              onSubmitEditing={sendChatMessage}
              returnKeyType="send"
              autoFocus
            />
            <TouchableOpacity onPress={sendChatMessage} style={styles.sendButton}>
              <Icon name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.status}>{status}</Text>

          <TextInput
            style={styles.input}
            placeholder="LoRa Address (e.g. 2)"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={loraAddress}
            onChangeText={setLoraAddress}
          />

          <TextInput
            style={styles.input}
            placeholder="Enter rescue message..."
            placeholderTextColor="#999"
            value={note}
            onChangeText={setNote}
          />

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.actionButton} onPress={toggleMode}>
              <Text style={styles.buttonText}>SWITCH TO CHAT MODE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={getLocation}>
              <Text style={styles.buttonText}>Get Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={openPort}>
              <Text style={styles.buttonText}>Open Port</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={sendRescueMessage}>
              <Text style={styles.buttonText}>Send via LoRa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#333' }]} onPress={closePort}>
              <Text style={styles.buttonText}>Close Port</Text>
            </TouchableOpacity>
          </View>

          {response && (
            <Text style={styles.response}>LoRa Response: {response}</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  status: { color: '#fff', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    width: '100%',
    padding: 10,
    borderRadius: 6,
    marginBottom: 20
  },
  buttonGroup: { gap: 12, width: '100%', marginBottom: 20 },
  response: { color: '#0f0', fontSize: 16, textAlign: 'center' },
  actionButton: {
    backgroundColor: '#1e88e5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
  },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16 },

  chatContainer: {
    flex: 1,
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: '#222',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#1e88e5',
    borderRadius: 25,
    padding: 10,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  messageRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#1e88e5',
  },
  messageLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#444',
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
  },
});
