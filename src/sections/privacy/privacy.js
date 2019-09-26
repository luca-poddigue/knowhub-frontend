'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/privacy', {
            template: '<privacy-page></privacy-page>',
            reloadOnSearch: false
        });
    })

    .component('privacyPage', {
        templateUrl: 'sections/privacy/privacy.html',
        controller: function privacyController(policiesDetails, routingService, $scope, spinnerService, applicationName, $translatePartialLoader) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.applicationName = applicationName;
                $ctrl.isAppReady = spinnerService.isAppReady;
                $translatePartialLoader.addPart('privacy');
                $ctrl.policiesDetails = policiesDetails;

                routingService.setupPageModes($scope, 'policy', 'privacy');
            };

        }
    });
