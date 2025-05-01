package com.rnbridging;

import com.hoho.android.usbserial.driver.*;

public class CustomProber {
    public static UsbSerialProber getCustomProber() {
        ProbeTable customTable = new ProbeTable();

        // ✅ Only use supported drivers
        customTable.addProduct(0x1a86, 0x7523, CdcAcmSerialDriver.class); // CH340
        customTable.addProduct(0x0403, 0x6001, FtdiSerialDriver.class); // FTDI

        return new UsbSerialProber(customTable);
    }
}
