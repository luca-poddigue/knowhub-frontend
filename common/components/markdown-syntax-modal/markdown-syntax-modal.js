'use strict';

angular.module('knowhub').controller('markdownSyntaxModal', function ($uibModalInstance, userService) {
    let $ctrl = this;

    $ctrl.locale = userService.locale();

    $ctrl.ok = function () {
        $uibModalInstance.close($ctrl.user);
    };

    $ctrl.cancel = function () {
        $uibModalInstance.dismiss();
    };

});