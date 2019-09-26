'use strict';

angular.module("knowhub").decorator(
    "$location",
    function locationDecorator($delegate,
                               localFrontendPort, localBackendPort, apiBasePath, $exceptionHandler) {

        let pagesNotToBeIncludedInHistory = [
            {path: '/blockedUser'},
            {path: '/verifyPendingAction'},
            {path: '/readyToGo'},
            {path: '/registration'},
            {
                path: '/guide',
                params: [{
                    name: 'questionnaire',
                    value: true
                }]
            }
        ];

        $delegate.urlWithReplace = function (newUrl, forceReplace) {
            if (!newUrl) {
                return $delegate.url();
            }
            if (!angular.isString(newUrl)) {
                $exceptionHandler(new Error("Invalid argument: url must be a string."));
            }

            let replace = false;
            let i;
            let j;
            for (i = 0; i < pagesNotToBeIncludedInHistory.length; i++) {
                if (replace) {
                    break;
                }
                if (pagesNotToBeIncludedInHistory[i].path === $delegate.path()) {
                    if (pagesNotToBeIncludedInHistory[i].params) {
                        for (j = 0; j < pagesNotToBeIncludedInHistory[i].params.length; j++) {
                            if ($delegate.search()[pagesNotToBeIncludedInHistory[i].params[j].name] === pagesNotToBeIncludedInHistory[i].params[j].value) {
                                replace = true;
                                break;
                            }
                        }
                    } else {
                        replace = true;
                        break;
                    }
                }
            }

            if (forceReplace || replace) {
                return $delegate.url(newUrl).replace();
            } else {
                return $delegate.url(newUrl);
            }
        };

        $delegate.isLocalDomain = function isLocalDomain() {
            return $delegate.host() === 'localhost' || $delegate.host() === '127.0.0.1' || $delegate.host().contains('local');
        };

        $delegate.domainUrl = function domainUrl(useFrontendDevPort) {
            let url = $delegate.protocol() + '://' + $delegate.host();
            if ($delegate.isLocalDomain()) {
                url = url + ':' + (useFrontendDevPort ? localFrontendPort : localBackendPort);
            }
            return url;
        };

        $delegate.apiBaseUrl = function apiBaseUrl() {
            return $delegate.domainUrl() + apiBasePath;
        };

        return $delegate;
    }
);