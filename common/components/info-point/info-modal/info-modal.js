'use strict';

angular.module('knowhub').controller('infoModal', function ($uibModalInstance, messageKey) {
    let $ctrl = this;

    $ctrl.messageKey = messageKey;

    $ctrl.cancel = function () {
        $uibModalInstance.dismiss();
    };
});