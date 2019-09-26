'use strict';

angular.module('knowhub').controller('acceptSessionChecklistModal', function (sessionStatus, $q, $uibModalInstance, userType, sharingSessionWorkflowService, session) {

    let $ctrl = this;

    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.acceptSession = function () {
        return sharingSessionWorkflowService.acceptSession(userType.expert, session.id).then(function () {
            $uibModalInstance.close({
                status: sessionStatus.acceptedByExpert
            });
        }, function (rejection) {
            $uibModalInstance.dismiss(rejection)
        });
    };

});