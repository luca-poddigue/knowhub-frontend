'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/forgottenPassword', {
            template: '<forgotten-password-page></forgotten-password-page>',
            reloadOnSearch: false
        });
    })

    .component('forgottenPasswordPage', {
        templateUrl: 'sections/forgotten-password/forgotten-password.html',
        controller: function forgottenPasswordController($location, userService, userStatus, routingService, spinnerService, applicationName, alertService, $timeout, userAuthService) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.isAppReady = spinnerService.isAppReady;
                $ctrl.applicationName = applicationName;
                $ctrl.resetStatus = "PENDING";
                $ctrl.resetPasswordData = {};
                if ($location.search().email) {
                    $ctrl.userEmail = $location.search().email;
                    $timeout(function () {
                        $ctrl.forgottenPasswordForm.userEmail.$setTouched();
                    });
                }
            };

            $ctrl.resetPassword = function () {
                $ctrl.resetStatus = "RESETTING";
                return userService.resetPassword($ctrl.newUserPassword, $ctrl.userEmail).then(function () {
                    $ctrl.resetStatus = "VERIFY";
                }, function () {
                    $ctrl.resetStatus = "PENDING";
                });
            };

            $ctrl.verify = function () {
                $ctrl.resetStatus = "VERIFYING";
                return userService.verifyPendingAction($ctrl.verificationToken, $ctrl.userEmail).then(function () {
                    $ctrl.resetStatus = "VERIFIED";
                }, function () {
                    $ctrl.resetStatus = "VERIFY";
                });
            };

            $ctrl.goToSignIn = function () {
                userAuthService.showAuthModal('login');
            };

            $ctrl.revalidatePassword = function () {
                $timeout(function () {
                    $ctrl.forgottenPasswordForm.newUserPasswordRepeated.$validate();
                });
            };

        }
    });