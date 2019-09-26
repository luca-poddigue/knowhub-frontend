'use strict';

angular.module('knowhub')
    .component('app', {
        templateUrl: 'common/components/app/app.html',
        controller: function appController(userService, appEnv, appEnvs, alertService, localStorageService) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.appEnv = appEnv;
                $ctrl.appEnvs = appEnvs;

                if (localStorageService.get('earlyAccess')) {
                    $ctrl.showApp = true;
                }

                $ctrl.basicInfo = userService.basicInfo;
            };

            $ctrl.onEarlyAccessCodeVerify = function (valid) {
                if (valid) {
                    localStorageService.set('earlyAccess', true);
                    $ctrl.showApp = valid;
                }
            };
        }

    });