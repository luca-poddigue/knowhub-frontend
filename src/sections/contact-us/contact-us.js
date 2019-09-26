'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/contactUs', {
            template: '<contact-us-page></contact-us-page>',
            reloadOnSearch: false
        });
    })


    .component('contactUsPage', {
        templateUrl: 'sections/contact-us/contact-us.html',
        controller: function contactUsController($scope, $location, userService, userAuthService, supportService, alertService, spinnerService, userStatus, applicationName) {

            let $ctrl = this;
            $ctrl.$onInit = function () {
                $ctrl.applicationName = applicationName;
                $ctrl.isAppReady = spinnerService.isAppReady;
                $ctrl.isUserLoggedIn = userAuthService.isSignedIn();
                $ctrl.fillUserInfo = userAuthService.isSignedIn() && userService.basicInfo().status && userService.basicInfo().status !== userStatus.unregistered;
                initContactUsData();

                $ctrl.reasons = ['APP_ISSUE', 'FEATURE_REQUEST', 'INFO_REQUEST', 'PAYOUTS', 'ACCOUNT_BLOCKED', 'TERMS_OF_SERVICE'];

                $scope.$watch(function() {
                    return $location.search().reason;
                }, function(reason) {
                    if (reason) {
                        $ctrl.contactUsData.reason = reason;
                    }
                });
            };

            $ctrl.sendMessage = function () {
                $ctrl.contactUsData.locale = userService.basicInfo().locale;
                return supportService.sendContactUsEmailToSupport($ctrl.contactUsData).then(function () {
                    alertService.displayAlert('CONTACT_US_EMAIL_SENT', null, 'SUCCESS');
                    initContactUsData();
                    resetForm();
                });
            };

            function resetForm() {
                if ($ctrl.contactUsForm.name) {
                    $ctrl.contactUsForm.name.$setUntouched();
                }
                if ($ctrl.contactUsForm.email) {
                    $ctrl.contactUsForm.email.$setUntouched();
                }
                $ctrl.contactUsForm.reason.$setUntouched();
                $ctrl.contactUsForm.comment.$setUntouched();
            }

            function initContactUsData() {
                $ctrl.privacyAccepted = $ctrl.isUserLoggedIn;
                $ctrl.contactUsData = {};
                if ($ctrl.fillUserInfo) {
                    $ctrl.contactUsData.userId = userService.basicInfo().id;
                    $ctrl.contactUsData.email = userAuthService.getAuthInfo().email;
                    $ctrl.contactUsData.name = userService.basicInfo().firstName + ' ' + userService.basicInfo().lastName;

                }
            }
        }
    });
