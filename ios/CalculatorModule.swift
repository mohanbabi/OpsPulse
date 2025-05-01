//
//  CalculatorModule.swift
//  rnBridging
//
//  Created by Amit Kumar on 30/09/24.
//

import Foundation
import React

@objc(CalculatorModule)
class CalculatorModule: NSObject {
  
  @objc
  func add(_ a: NSNumber, b: NSNumber, callback: @escaping RCTResponseSenderBlock) {
    let sum = a.doubleValue + b.doubleValue
    callback([NSNull(), sum])
  }

  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
