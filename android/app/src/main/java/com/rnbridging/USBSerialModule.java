package com.rnbridging;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import com.hoho.android.usbserial.driver.UsbSerialProber;

import java.io.IOException;
import java.util.List;

public class USBSerialModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private UsbSerialPort serialPort;

    public USBSerialModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "USBSerialModule";
    }

    @ReactMethod
    public void openPort(int baudRate, String deviceName, Promise promise) {
        UsbManager usbManager = (UsbManager) reactContext.getSystemService(Context.USB_SERVICE);
        List<UsbSerialDriver> drivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);

        if (drivers.isEmpty()) {
            promise.reject("NO_DEVICES", "No USB devices found.");
            return;
        }

        UsbSerialDriver driver = drivers.get(0);
        UsbDevice device = driver.getDevice();

        if (!usbManager.hasPermission(device)) {
            PendingIntent permissionIntent = PendingIntent.getBroadcast(
                    reactContext,
                    0,
                    new Intent("com.rnbridging.USB_PERMISSION"),
                    PendingIntent.FLAG_IMMUTABLE);
            usbManager.requestPermission(device, permissionIntent);
            promise.reject("PERMISSION", "USB permission not granted.");
            return;
        }

        try {
            serialPort = driver.getPorts().get(0);
            serialPort.open(usbManager.openDevice(device));
            serialPort.setParameters(115200, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);
            promise.resolve("Port opened successfully.");
        } catch (IOException e) {
            promise.reject("OPEN_FAILED", "Failed to open port: " + e.getMessage());
        }
    }

    @ReactMethod
    public void sendMessage(String message, Promise promise) {
        if (serialPort == null) {
            promise.reject("NO_PORT", "Serial port is not open.");
            return;
        }

        try {
            serialPort.write(message.getBytes(), 1000);
            promise.resolve("Message sent: " + message);
        } catch (IOException e) {
            promise.reject("WRITE_ERROR", "Error sending message: " + e.getMessage());
        }
    }

    @ReactMethod
    public void closePort(Promise promise) {
        if (serialPort != null) {
            try {
                serialPort.close();
                serialPort = null;
                promise.resolve("Port closed.");
            } catch (IOException e) {
                promise.reject("CLOSE_ERROR", "Error closing port: " + e.getMessage());
            }
        } else {
            promise.resolve("Port already closed.");
        }
    }
}
