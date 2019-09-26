'use strict';

angular.module("knowhub").decorator(
    "localStorageService",
    function localStorageServiceDecorator($delegate, userBasicInfoService) {

        let originalGet = $delegate.get;
        let originalSet = $delegate.set;

        $delegate.set = function(key, value, global) {
            if (!global && userBasicInfoService.basicInfo() && userBasicInfoService.basicInfo().id) {
                originalSet(userBasicInfoService.basicInfo().id + '.' + key, value);
            } else {
                originalSet(key, value);
            }
        };

        $delegate.get = function (key) {
            if (userBasicInfoService.basicInfo() && userBasicInfoService.basicInfo().id) {
                let userSpecificValue = originalGet(userBasicInfoService.basicInfo().id + '.' + key);
                return angular.isDefinedAndNotNull(userSpecificValue) ? userSpecificValue : originalGet(key);
            }
            return originalGet(key);
        };

        return $delegate;
    }
);
