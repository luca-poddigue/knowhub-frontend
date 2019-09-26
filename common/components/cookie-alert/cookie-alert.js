'use strict';

angular.module('knowhub')
    .component('cookieAlert', {
        bindings: {},
        templateUrl: 'common/components/cookie-alert/cookie-alert.html',
        controller: function cookieAlertController(localStorageService, $location, profilingService) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.showAlert = !localStorageService.get('cookiesAccepted');
            };

            $ctrl.setCookiesAccepted = function () {
                localStorageService.set('cookiesAccepted', true, true);
                profilingService.initProfilingServices();
                $ctrl.showAlert = false;
            };

            $ctrl.goToCookiePolicy = function () {
                $location.urlWithReplace('/privacy?mode=cookies');
            };

        }
    });