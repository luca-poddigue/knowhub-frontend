'use strict';

angular.module('knowhub')
    .component('appFooter', {
        templateUrl: 'common/components/app-footer/app-footer.html',
        controller: function appFooterController(applicationName, userAuthService, $location, pIva) {

            const $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.applicationName = applicationName;
                $ctrl.pIva = pIva;
            };

            $ctrl.isCurrentPath = function (path) {
                return isCurrentPath(path);
            };

            $ctrl.goTo = function (path) {
                if (!$ctrl.isCurrentPath(path)) {
                    $location.urlWithReplace(path);
                }
            };

            $ctrl.isUserSignedIn = function () {
                return userAuthService.isSignedIn();
            };

            function isCurrentPath(path) {
                return path === $location.path();
            }


        }
    });
