import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, NativeModules } from 'react-native';

const { USBSerialModule } = NativeModules;

export default function App() {
  const [status, setStatus] = useState("Initializing...");

  const openPort = async () => {
    try {
      const msg = await USBSerialModule.openPort(115200,"USB0");
      setStatus(msg);
    } catch (err) {
      setStatus(err.message);
    }
  };

  const sendMessage = async () => {
    try {
      const msg = await USBSerialModule.sendMessage("AT+SEND=2,5,HELLO\r\n");
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

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
      <Button title="Open Port" onPress={openPort} />
      <Button title="Send Message" onPress={sendMessage} />
      <Button title="Close Port" onPress={closePort} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 16, marginBottom: 20 },
});
