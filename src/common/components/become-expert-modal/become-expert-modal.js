'use strict';

angular.module('knowhub').controller('becomeExpertModal', function ($uibModalInstance, $location, userType) {
    let $ctrl = this;

    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.goToQuestionnaire = function () {
        $location.urlWithReplace('/guide').search({
            mode: userType.expert,
            questionnaire: true
        });
        $uibModalInstance.close();
    };

});