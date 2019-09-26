'use strict';

angular.module('knowhub')
    .component('preProdWelcomePage', {
        bindings: {
            onVerify: '&'
        },
        templateUrl: 'common/components/pre-prod-welcome-page/pre-prod-welcome-page.html',
        controller: function preProdWelcomePageController($element, $timeout, browserUtilsService) {

            let $ctrl = this;
            let earlyAccessCode = 'knowhub-ea'; // not meant to be secure

            $ctrl.$onInit = function () {
                $ctrl.codeValid = true;
                $ctrl.isShowEarlyAccessForm = false;
                $ctrl.pressedOnEnter = browserUtilsService.pressedOnEnter;
            };

            $ctrl.showEarlyAccessForm = function () {
                $ctrl.isShowEarlyAccessForm = true;
                $timeout(function () {
                    $element.find("#earlyAccessCode")[0].focus();
                });
            };

            $ctrl.onInputKeyPress = function ($event) {
                $timeout(function () {
                    if ($ctrl.earlyAccessCode && browserUtilsService.pressedOnEnter($event)) {
                        $element.find("#go-btn")[0].focus();
                        $ctrl.verify();
                    }
                });
            };

            $ctrl.verify = function () {
                $ctrl.codeValid = $ctrl.earlyAccessCode === earlyAccessCode;
                $ctrl.onVerify({
                    valid: $ctrl.codeValid
                });
            };
        }
    });