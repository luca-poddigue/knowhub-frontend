'use strict';

angular.module('knowhub')
    .component('authModal', {
        bindings: {},
        templateUrl: 'common/components/auth-modal/auth-modal.html',
        controller: function authModalController(userAuthService, userService, $element, $scope, $rootScope) {

            let $ctrl = this;
            let unscribeTranslationListener;
            let unscribeLocationListener;

            $ctrl.$onInit = function () {

                let stopInit = $scope.$on('spinner:appReady', function () {
                    // second initialization, after translations are loaded
                    userAuthService.initAuthWidget(true);
                    unscribeTranslationListener = $rootScope.$on('$translateChangeSuccess', function () {
                        userAuthService.initAuthWidget();
                    });
                    stopInit();
                });

                unscribeLocationListener = $rootScope.$on("$locationChangeSuccess", function () {
                    userAuthService.hideAuthModal();
                });
            };

            $ctrl.$onDestroy = function () {
                unscribeTranslationListener && unscribeTranslationListener();
                unscribeLocationListener && unscribeLocationListener();
            };
        }
    });