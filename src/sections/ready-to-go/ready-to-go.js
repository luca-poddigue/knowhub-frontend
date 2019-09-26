'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/readyToGo', {
            template: '<ready-to-go-page></ready-to-go-page>',
            reloadOnSearch: false
        });
    })

    .component('readyToGoPage', {
        templateUrl: 'sections/ready-to-go/ready-to-go.html',
        controller: function readyToGoController(spinnerService, applicationName, $location) {
            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.applicationName = applicationName;
                $ctrl.isAppReady = spinnerService.isAppReady;

                // track registration completion action on Facebook
                fbq('track', 'CompleteRegistration');

            };

            $ctrl.proceed = function() {
                $location.urlWithReplace("/home");
            }

        }
    });