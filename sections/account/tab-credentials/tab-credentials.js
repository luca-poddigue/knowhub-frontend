'use strict';

angular.module('knowhub')
    .component('tabCredentials', {
        templateUrl: 'sections/account/tab-credentials/tab-credentials.html',
        controller: function tabCredentialsController(userAuthService, $location, userService, $exceptionHandler, $uibModal, alertService, $timeout, $scope, spinnerService, userStatus) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.isAppReady = spinnerService.isAppReady;
                $ctrl.isSocialProviderAuth = userAuthService.isSocialProviderAuth;
                $ctrl.authInfo = userAuthService.getAuthInfo();
            };

            $ctrl.changeEmail = function () {
                return userService.changeEmail($ctrl.userEmail).then(function () {
                    userService.basicInfo().status = userStatus.unverifiedEmailChange;
                    $location.urlWithReplace('/verifyPendingAction');
                }, angular.noop);
            };

            $ctrl.changePassword = function () {
                return userService.resetPassword($ctrl.newUserPassword).then(function () {
                    userService.basicInfo().status = userStatus.unconfirmedPassword;
                    $location.urlWithReplace('/verifyPendingAction');
                }, angular.noop);
            };

            $ctrl.removeUser = function () {
                return userService.remove().then(function () {
                    userService.basicInfo().status = userStatus.unconfirmedUserDeletion;
                    $location.urlWithReplace('/verifyPendingAction');
                }, angular.noop);
            };

        }
    });