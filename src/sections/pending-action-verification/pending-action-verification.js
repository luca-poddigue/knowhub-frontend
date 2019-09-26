'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/verifyPendingAction', {
            template: '<verify-pending-action-page></verify-pending-action-page>',
            reloadOnSearch: false
        });
    })

    .component('verifyPendingActionPage', {
        templateUrl: 'sections/pending-action-verification/pending-action-verification.html',
        controller: function pendingActionVerificationController(liveNotificationsService, $location, userService,
                                                                 userStatus, routingService, spinnerService,
                                                                 applicationName, alertService, $timeout,
                                                                 userAuthService, $q) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.userStatus = userStatus;
                $ctrl.currentUserStatus = userService.basicInfo().status;
                $ctrl.applicationName = applicationName;
                $ctrl.verificationStatus = "UNVERIFIED";
                $ctrl.isAppReady = spinnerService.isAppReady;
            };

            $ctrl.verify = function () {
                let token;
                if ($ctrl.currentUserStatus === userStatus.unverifiedEmailChange) {
                    token = $ctrl.notificationToken.trim() + "," + $ctrl.verificationToken.trim();
                } else {
                    token = $ctrl.verificationToken.trim();
                }
                return userService.verifyPendingAction(token).then(function () {
                    switch ($ctrl.currentUserStatus) {
                        case userStatus.unverifiedEmailChange:
                            return userAuthService.renewToken().then(function () {
                                userService.basicInfo().status = userStatus.active;
                                $ctrl.verificationStatus = "VERIFIED";
                            }, function () {
                                liveNotificationsService.stopMessaging();
                                userAuthService.signOut();
                                $location.urlWithReplace('/home');
                            });
                        case userStatus.unverifiedEmail:
                            userService.basicInfo().status = userStatus.pendingTOSQuestionnaire;
                            $ctrl.verificationStatus = "VERIFIED";
                            return $q.resolve();
                        case userStatus.unconfirmedUserDeletion:
                            userAuthService.signOut();
                            liveNotificationsService.stopMessaging();
                            $location.urlWithReplace("/home");
                            $timeout(function () {
                                alertService.displayAlert('ACCOUNT_DELETED', null, 'SUCCESS');
                            });
                            return $q.resolve();
                        default:
                            userService.basicInfo().status = userStatus.active;
                            $ctrl.verificationStatus = "VERIFIED";
                            return $q.resolve();
                    }
                }, function () {
                    $ctrl.verificationStatus = "UNVERIFIED";
                });
            };

            $ctrl.proceed = function () {
                if (userService.basicInfo().status !== userStatus.active) {
                    routingService.redirect(true, userService.basicInfo().status);
                } else {
                    $location.urlWithReplace("/home");
                }
            };

            $ctrl.discardPendingAction = function () {
                return userService.discardPendingAction().then(function () {
                    userService.basicInfo().status = userStatus.active;
                    $location.urlWithReplace("/home");
                    $timeout(function () {
                        alertService.displayAlert('DISCARD_PENDING_ACTION', null, 'SUCCESS');
                    });
                }, angular.noop);
            };

        }
    });