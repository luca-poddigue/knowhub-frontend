'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/registration', {
            template: '<registration-page></registration-page>',
            reloadOnSearch: false
        });
    })

    .component('registrationPage', {
        templateUrl: 'sections/registration/registration.html',
        controller: function registrationController(spinnerService, applicationName) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.applicationName = applicationName;
                $ctrl.isAppReady = spinnerService.isAppReady;
                $ctrl.userInfo = {};
            };

        }
    });