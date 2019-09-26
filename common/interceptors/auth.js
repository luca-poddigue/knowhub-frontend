'use strict';

angular.module('knowhub').factory('authInterceptor', function ($q, userAuthService, $location, appApiKey) {

    return {
        request: function (config) {
            config.headers = config.headers || {};

            if (config.url.startsWith($location.domainUrl())) {
                config.params = config.params || {};
                config.params.key = appApiKey;
                let authToken = userAuthService.getAuthToken();
                if (authToken) {
                    config.headers.Authorization = authToken;
                }

            }
            return config || $q.when(config);
        }
    };
});