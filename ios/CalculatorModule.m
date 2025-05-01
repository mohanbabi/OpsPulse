//
//  CalculatorModule.m
//  rnBridging
//
//  Created by Amit Kumar on 30/09/24.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CalculatorModule, NSObject)
 RCT_EXTERN_METHOD(add:(nonnull NSNumber *)a b:(nonnull NSNumber *)b callback:(RCTResponseSenderBlock)callback)
@end
