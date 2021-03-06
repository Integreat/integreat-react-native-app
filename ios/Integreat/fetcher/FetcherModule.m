#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_REMAP_MODULE(Fetcher, FetcherModule, RCTEventEmitter)
RCT_EXTERN_METHOD(
                  fetchAsync: (NSDictionary)fetchMap
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
)
@end
