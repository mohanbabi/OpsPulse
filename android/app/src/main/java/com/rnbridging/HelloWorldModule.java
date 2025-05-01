package com.rnbridging;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class HelloWorldModule extends ReactContextBaseJavaModule {

    HelloWorldModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "HelloWorld"; // This name will be used in JavaScript
    }

    @ReactMethod
    public void sayHello(Promise promise) {
        promise.resolve("Mohan Android Native Code!");
    }
}
