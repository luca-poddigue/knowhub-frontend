'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/manage', {
            template: '<manage-page></manage-page>',
            reloadOnSearch: false
        });
    })

    .component('managePage', {
        templateUrl: 'sections/manage/manage.html',
        controller: function manageController(routingService, $scope, userService, $location, localStorageService, applicationName, userType) {

            let $ctrl = this;
            let expertOnlyTabs;

            $ctrl.$onInit = function () {
                expertOnlyTabs = ['availability', 'serviceFee'];
                $ctrl.applicationName = applicationName;
                $ctrl.userFirstName = userService.basicInfo().firstName;
                $ctrl.userType = userType;
                $ctrl.currUserType = userService.basicInfo().type || userType.seeker;

                routingService.setupPageModes($scope, 'manage', function () {
                    if ($ctrl.currUserType === $ctrl.userType.seeker && expertOnlyTabs.contains(($location.search().mode || localStorageService.get('manageMode')))) {
                        $ctrl.setMode('dashboard');
                    } else {
                        $ctrl.setMode($location.search().mode || localStorageService.get('manageMode') || 'dashboard');
                    }
                });
            };
        }
    });