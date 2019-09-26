'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/account', {
            template: '<account-page></account-page>',
            reloadOnSearch: false
        });
    })

    .component('accountPage', {
        templateUrl: 'sections/account/account.html',
        controller: function accountController(routingService, $scope, $location, localStorageService, userRole, applicationName, userBasicInfoService) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.applicationName = applicationName;

                routingService.setupPageModes($scope, 'account', 'profile');
            };

            $ctrl.showSupportTab = function () {
                if (userBasicInfoService.basicInfo().role) {
                    return userRole[userBasicInfoService.basicInfo().role.toLowerCase()].level >= userRole.support.level;
                } else {
                    return false;
                }
            }
        }
    });