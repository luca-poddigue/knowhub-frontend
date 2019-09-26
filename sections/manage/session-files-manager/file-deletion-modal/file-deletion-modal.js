angular.module('knowhub').controller('fileDeletionModal', function ($uibModalInstance, $filter, filesService, sessionId, file) {
    let $ctrl = this;
    let translate = $filter('translate');

    $ctrl.formatMessage = function () {
        return translate('SESSION_FILES_MANAGER_ARE_YOU_SURE').replace('%%fileName%', file.name);
    };

    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.deleteFile = function () {
        return filesService.deleteSessionFile(sessionId, file.fileId).then(function (bucket) {
            $uibModalInstance.close(bucket);
        }, function (rejection) {
            if (angular.isObject(rejection) && angular.isObject(rejection.data) && rejection.data.errorCode && ['KH_ERR_4', 'KH_ERR_5'].contains(rejection.data.errorCode)) {
                $uibModalInstance.dismiss({
                    notAllowedAction: true
                });
            }
        });
    };

});