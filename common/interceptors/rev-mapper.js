'use strict';

angular.module('knowhub').factory('revMapperInterceptor', function ($q, cacheService) {

    return {
        request: function (config) {
            if (config && config.url /*!$location.isLocalDomain()*/) {
                config.url = cacheService.getRevUrl(config.url);
            }
            return config || $q.when(config);
        }
    };
});