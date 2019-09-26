'use strict';

angular.module('knowhub').factory('spinnerInterceptor', function ($q, spinnerService) {

    return {
        request: function (config) {
            spinnerService.show('general-spinner');
            return config || $q.when(config);
        },
        response: function (response) {
            spinnerService.hide('general-spinner');
            return response || $q.when(response);
        },
        responseError: function responseError(rejection) {
            spinnerService.hide('general-spinner');
            return $q.reject(rejection);
        },
        requestError: function (rejection) {
            spinnerService.hide('general-spinner');
            return $q.reject(rejection);
        }
    };
});