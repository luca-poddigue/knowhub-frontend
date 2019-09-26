'use strict';

/**
 * @ngdoc service
 * @name knowhub.service:serviceName
 * @requires $q, $exceptionHandler

 * @description
 * Catches errors related to http requests and responses and sends them to the exception handler.
 *
 */
angular.module('knowhub').factory('httpExceptionInterceptor', function (liveNotificationsService, localStorageService, $timeout, $location, $q, userAuthService, alertService, httpError) {

    let alertLevelMap = {
        ERR: 'DANGER',
        WAR: 'WARNING',
        SUCC: 'SUCCESS'
    };

    function getAppError(response) {
        if (response.config.khIgnoreErrors) {
            return;
        }

        let errorCode = response.data.errorCode;
        let match = errorCode.match(/^KH_(ERR|WAR|SUCC)_(\d+)$/);
        if (match) {
            return {
                level: alertLevelMap[match[1]],
                code: match[2]
            };
        }
    }


    function getRejectionError(rejection) {
        if (rejection.config && rejection.config.khIgnoreErrors) {
            return;
        }

        if (rejection.status === -1 || !rejection.data) {
            if (rejection.config && rejection.config.khIgnoreNetworkErrors) {
                return;
            }
            return {
                code: 'NETWORK_ERROR',
                level: 'DANGER'
            };
        }

        return {
            code: 'BACKEND_ERROR',
            level: 'DANGER'
        };

    }

    function isUserBlocked(rejection) {
        return rejection && rejection.data && rejection.data.error &&
            rejection.data.error.message &&
            rejection.data.error.message.startsWith('USER_BLOCKED');
    }

    return {
        response: function (response) {
            if (angular.isObject(response) && angular.isObject(response.data) && response.data.errorCode) {
                let appError = getAppError(response);
                if (appError) {
                    alertService.displayAlert(appError.code, null, appError.level);
                    return $q.reject(response);
                }
            }
            return response || $q.when(response);
        },
        responseError: function responseError(rejection) {
            if (rejection.status === httpError.unauthorized) {
                if (userAuthService.isSignedIn()) {
                    userAuthService.signOut();
                    liveNotificationsService.stopMessaging();
                    let currentUrl = $location.url();
                    $location.urlWithReplace('/home');
                    $timeout(function () {
                        userAuthService.showAuthModal('login');
                        localStorageService.set('pendingPage', currentUrl);
                    });
                }
            } else if (isUserBlocked(rejection)) {
                if (userAuthService.isSignedIn()) {
                    userAuthService.signOut();
                    liveNotificationsService.stopMessaging();
                    $location.urlWithReplace('/blockedUser');
                }
            }
            else {
                let appError = getRejectionError(rejection);
                if (appError) {
                    alertService.displayAlert(appError.code, null, appError.level);
                }
            }
            return $q.reject(rejection);
        },
        requestError: function (rejection) {
            let appError = getRejectionError(rejection);
            if (appError) {
                alertService.displayAlert(appError.code, null, appError.level);
            }
            return $q.reject(rejection);
        }
    };
});
