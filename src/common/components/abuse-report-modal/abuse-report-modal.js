'use strict';

angular.module('knowhub').controller('abuseReportModal', function ($uibModalInstance, userService, expertId, sessionId) {

    let $ctrl = this;

    $ctrl.abuseDetails = {};
    if (sessionId) {
        $ctrl.abuseDetails.sessionId = sessionId;
    }

    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.reportAbuse = function () {
        return userService.reportAbuse(expertId, $ctrl.abuseDetails).then(function () {
            $uibModalInstance.close();
        }, angular.noop);
    };

});