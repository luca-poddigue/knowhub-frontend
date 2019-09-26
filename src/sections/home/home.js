'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/home', {
            template: '<home-page></home-page>',
            reloadOnSearch: false
        });
    })

    .component('homePage', {
        templateUrl: 'sections/home/home.html',
        controller: function homeController($scope, $uibModal, $location, $log, $timeout, sharingSessionWorkflowService, $exceptionHandler, userService, userAuthService, userType, applicationName, spinnerService, socialConstants) {

            let $ctrl = this;
            let modalInstance;

            $ctrl.$onInit = function () {
                $ctrl.applicationName = applicationName;
                $ctrl.isAppReady = spinnerService.isAppReady;
                $ctrl.userIsSignedIn = userAuthService.isSignedIn;
                $ctrl.socialConstants = socialConstants;

                $ctrl.language = userService.language;
            };

            $ctrl.userIsExpert = function () {
                return userService.basicInfo().type === userType.expert;
            };

            $ctrl.showAuthModal = function () {
                userAuthService.showAuthModal('signUp');
            };

            $ctrl.showPromoVideoModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'sections/home/promo-video-modal/promo-video-modal.html',
                    controller: 'promoVideoModal',
                    controllerAs: '$ctrl',
                    windowClass: 'promo-video-modal',
                    size: 'lg'
                });

                modalInstance.result.then(angular.noop, angular.noop);
            }
        }

    });