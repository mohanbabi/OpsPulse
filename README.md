# 🛰️ OpsPulse

**OpsPulse** is a tactical Android application for emergency and defense operations. It enables ground teams to send real-time rescue coordinates and messages to drones via LoRa. The drone receives the data, displays the location in **Mission Planner**, and visually marks the message for immediate rescue coordination.

---

## 🚀 Features

- 📍 Get GPS coordinates with high accuracy
- 📝 Add custom rescue notes
- 📡 Send data via LoRa using AT commands
- ✅ Receive confirmation (`+OK`) and trigger haptic/sound feedback
- 📲 Native USB serial communication bridge (Java ↔ React Native)
- 🔔 Vibration, audio & haptic feedback on success

---

## 🧪 AT Command Format

# AT+SEND=<ID>,<LENGTH>,<LAT>,<LON>,<MESSAGE>

**Example:**

# AT+SEND=2,24,17.438992,78.385452,Help Needed

---

## 🔧 Technologies

- React Native
- Java (Android Native Bridge)
- `usb-serial-for-android`
- LoRa (e.g., RYLR998)
- MAVLink (planned)
- ArduPilot + Mission Planner (planned integration)

---

## 📷 Screenshots

> _You can add screenshots here later if needed_

---

## 🛠️ How to Build

```bash
git clone https://github.com/mohanbabi/OpsPulse.git
cd OpsPulse
npm install
npx react-native run-android
```

---

Would you like me to:

- 📁 Create this file locally and give you the command to commit it?
- Or paste it in a GitHub UI via browser?

Let me know how you want to proceed.
