'use strict';

angular.module('knowhub').controller('sessionPriceLimitModal', function ($uibModalInstance, userService, currentLimit) {

    let $ctrl = this;
    let numberRegex = /^[0-9]$/;

    $ctrl.requestDetails = {
        requestedLimit: currentLimit
    };
    $ctrl.currentLimit = currentLimit;

    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.onKeyPress = function ($event) {
        if (!numberRegex.test($event.key)) {
            $event.preventDefault();
        }
    };

    $ctrl.sendRequest = function () {
        return userService.postSessionPriceLimitIncreaseRequest($ctrl.requestDetails).then(function () {
            $uibModalInstance.close($ctrl.requestDetails.requestedLimit);
        }, angular.noop);
    };

});