'use strict';

angular.module('knowhub')
    .component('tabPreferences', {
        templateUrl: 'sections/account/tab-preferences/tab-preferences.html',
        controller: function tabPreferencesController($timeout, emails, userService, userBasicInfoService, userType, alertService, spinnerService, maxEmailTemplates, $scope, liveNotificationsService, $uibModal) {

            let $ctrl = this;
            let updateDelay = 1000;
            let cancelUpdateEmailPreferences;
            let cancelUpdateNotificationsPreferences;

            $ctrl.$onInit = function () {
                $ctrl.isAppReady = spinnerService.isAppReady;
                $ctrl.getNotificationsStatus = liveNotificationsService.getNotificationsStatus;
                $ctrl.currentUserType = userService.basicInfo().type;
                $ctrl.userType = userType;
                userService.getEmailPreferences().then(function (response) {
                    $ctrl.emailPreferences = response.data;
                    initEmails();
                });

                $ctrl.notificationsPreferences = {
                    notificationsEnabled: userBasicInfoService.basicInfo().notificationsEnabled,
                    playNotificationSound: userBasicInfoService.basicInfo().playNotificationSound
                };

                $ctrl.sessionPriceLimitPreferences = userBasicInfoService.basicInfo().sessionPriceLimit;

                $ctrl.liveNotificationsOptions = [{
                    key: 'COMMON_ON',
                    activeClass: 'btn-success',
                    id: true
                },
                    {
                        key: 'COMMON_OFF',
                        activeClass: 'btn-danger',
                        id: false
                    }];
            };

            $ctrl.showSessionPriceLimitModal = function () {
                let modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/components/session-price-limit-modal/session-price-limit-modal.html',
                    controller: 'sessionPriceLimitModal',
                    controllerAs: '$ctrl',
                    resolve: {
                        currentLimit: function () {
                            return Number($ctrl.sessionPriceLimitPreferences.limit);
                        }
                    }
                });

                modalInstance.result.then(function (requestedLimit) {
                    $ctrl.sessionPriceLimitPreferences.requestedLimit = requestedLimit;
                    alertService.displayAlert('SESSION_PRICE_INCREASE_REQUEST', null, 'SUCCESS');
                }, angular.noop);
            };


            $ctrl.updateEmailPreferences = function () {
                if (cancelUpdateEmailPreferences) {
                    $timeout.cancel(cancelUpdateEmailPreferences);
                }
                cancelUpdateEmailPreferences = $timeout(function () {
                    alignEmailPreferences();
                    return userService.updateEmailPreferences($ctrl.emailPreferences).then(function () {
                        alertService.displayAlert('PREFERENCES_SAVED', null, 'SUCCESS');
                    }, angular.noop);
                }, updateDelay);
            };

            $ctrl.updateNotificationsPreferences = function (initMessaging) {
                if (cancelUpdateNotificationsPreferences) {
                    $timeout.cancel(cancelUpdateNotificationsPreferences);
                }
                cancelUpdateNotificationsPreferences = $timeout(function () {
                    return userService.updateNotificationsPreferences($ctrl.notificationsPreferences, false, initMessaging).then(function () {
                        alertService.displayAlert('PREFERENCES_SAVED', null, 'SUCCESS');
                    }, angular.noop);
                }, updateDelay);
            };

            function alignEmailPreferences() {
                angular.forEach($ctrl.emails, function (email) {
                    $ctrl.emailPreferences.emailPreferences = $ctrl.emailPreferences.emailPreferences.replaceCharAt(maxEmailTemplates - 1 - email.id, email.enabled ? '1' : 0);
                });
            }

            function initEmails() {
                let emailPrefs = $ctrl.emailPreferences.emailPreferences;
                $ctrl.emails = [];
                angular.forEach(emails, function (emailDef) {
                    if ($ctrl.currentUserType === userType.seeker) {
                        if (userType.seeker === emailDef.visibility) {
                            this.push(createEmail(emailDef, emailPrefs));
                        }
                    } else if ($ctrl.currentUserType === userType.expert) {
                        if (userType.seeker === emailDef.visibility || userType.expert === emailDef.visibility) {
                            this.push(createEmail(emailDef, emailPrefs));
                        }
                    }
                }, $ctrl.emails);
            }

            function createEmail(emailDef, emailPrefs) {
                let email = angular.copy(emailDef);
                email.enabled = emailPrefs[maxEmailTemplates - 1 - emailDef.id] === '1';
                return email;
            }
        }
    });