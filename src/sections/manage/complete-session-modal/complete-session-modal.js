'use strict';

angular.module('knowhub').controller('completeSessionModal', function ($uibModalInstance, socialSharingService,
                                                                       sharingSessionWorkflowService, sessionId) {
    let $ctrl = this;
    $ctrl.isSessionComplete = false;

    $ctrl.shareOnFacebook = function () {
        socialSharingService.shareSessionCompleteOnFacebook();
    };

    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.close = function () {
        $uibModalInstance.close();
    };

    $ctrl.completeSession = function () {
        return sharingSessionWorkflowService.completeSession(sessionId).then(function () {
            $ctrl.isSessionComplete = true;
            socialSharingService.renderTwitterShareButton($('#share-session-on-twitter-btn')[0])

        }, angular.noop);
    };

});