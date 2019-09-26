'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/termsOfService', {
            template: '<terms-of-service-page></terms-of-service-page>',
            reloadOnSearch: false
        });
    })

    .component('termsOfServicePage', {
        templateUrl: 'sections/terms-of-service/terms-of-service.html',
        controller: function termsOfServiceController(policiesDetails, $translatePartialLoader, spinnerService, applicationName) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.applicationName = applicationName;
                $ctrl.isAppReady = spinnerService.isAppReady;
                $translatePartialLoader.addPart('terms-of-service');
                $ctrl.policiesDetails = policiesDetails;
            };
        }
    });
