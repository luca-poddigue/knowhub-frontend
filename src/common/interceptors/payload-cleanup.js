'use strict';

angular.module('knowhub').factory('payloadCleanupInterceptor', function ($q, $location) {

    function getLocaleKey(locale) {
        if (angular.isString(locale)) {
            return locale.substring(0, 3) + locale.substring(3).toUpperCase();
        } else {
            return locale;
        }
    }

    function convertDates(data) {
        angular.forEach(data, function (value, key) {
            if (angular.isDate(this[key])) {
                this[key] = this[key].getTime();
            } else if (angular.isObject(this[key])) {
                convertDates(this[key]);
            }
        }, data);
    }


    return {
        request: function (config) {
            // Avoids altering the input data as part of the request. Should be applied only to non-static content.
            if (!config.skipPayloadCleanup && angular.isString(config.url) && config.url.startsWith($location.apiBaseUrl())) {
                if (angular.isObject(config.params)) {
                    let params = angular.copy(config.params);
                    convertDates(params);
                    config.params = params;
                }
                if (angular.isObject(config.data)) {
                    let data = angular.copy(config.data);
                    angular.forEach(data, function (value, key) {
                        if (!angular.isDefinedAndNotNull(this[key]) || this[key] === '') {
                            delete this[key];
                        }
                        convertDates(data);
                        if (key === 'locale' && angular.isString(this[key])) {
                            this[key] = getLocaleKey(this[key]);
                        }
                    }, data);
                    config.data = data;
                }
            }
            return config || $q.when(config);
        },
        response: function (response) {
            if (response && response.data) {
                angular.forEach(response.data, function (value, key) {
                    if (key === 'locale' && angular.isString(this[key])) {
                        this[key] = this[key].toLowerCase();
                    }
                }, response.data);
            }
            return response || $q.when(response);
        }
    };
});