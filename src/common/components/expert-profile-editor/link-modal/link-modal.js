'use strict';

angular.module('knowhub').controller('linkModal', function ($uibModalInstance, browserUtilsService) {

    let $ctrl = this;

    let selection = browserUtilsService.getSelection();
    if (selection) {
        $ctrl.linkText = selection;
    }

    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.add = function () {
        $uibModalInstance.close('[' + $ctrl.linkText + '](' + $ctrl.linkUrl + ')');
    };

});
