'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/blockedUser', {
            template: '<blocked-user-page></blocked-user-page>',
            reloadOnSearch: false
        });
    })

    .component('blockedUserPage', {
        templateUrl: 'sections/blocked-user/blocked-user.html',
        controller: function blockedUserController($sce, spinnerService, applicationName) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.applicationName = applicationName;
                $ctrl.$sce = $sce;
                $ctrl.isAppReady = spinnerService.isAppReady;
            };
        }
    });
