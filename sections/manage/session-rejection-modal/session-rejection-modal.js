'use strict';

angular.module('knowhub').controller('sessionRejectionModal', function ($uibModalInstance, sharingSessionWorkflowService, sessionId) {

    let $ctrl = this;

    $ctrl.rejectionDetails = {};

    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.rejectSession = function () {
        return sharingSessionWorkflowService.rejectSession(sessionId, $ctrl.rejectionDetails).then(function () {
            $uibModalInstance.close($ctrl.rejectionDetails);
        }, angular.noop);
    };

});