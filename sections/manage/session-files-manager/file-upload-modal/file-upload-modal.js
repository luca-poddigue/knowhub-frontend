angular.module('knowhub').controller('fileUploadModal', function (Upload, $filter, $window, alertService, filesService, $scope, sessionId, $uibModalInstance) {

    let $ctrl = this;

    let upload;
    $ctrl.files = [];
    $ctrl.isUploadInProgress = Upload.isUploadInProgress;
    $ctrl.uploadStatus = "PENDING";

    let eventListener = $window.attachEvent || $window.addEventListener;
    // Triggered when a page is closed or refreshed.
    let closePageEvent = $window.attachEvent ? 'onbeforeunload' : 'beforeunload';

    eventListener(closePageEvent, function (e) {
        let confirmationMessage = ' ';
        if (Upload.isUploadInProgress()) {
            (e || $window.event).returnValue = $filter('translate')('ONGOING_UPLOAD_ALERT');
        }
        return confirmationMessage;
    });

    $scope.$on('$locationChangeStart', function ($event) {
        if (Upload.isUploadInProgress()) {
            $event.preventDefault();
        }
    });

    $ctrl.getFileTypeIcon = filesService.getIconByContentType;

    $scope.$on('modal.closing', function ($event) {
        if ($ctrl.isUploadInProgress()) {
            $event.preventDefault();
        }
    });

    $ctrl.cancelUpload = function () {
        if ($ctrl.isUploadInProgress()) {
            upload.abort();
            $ctrl.uploadStatus = 'CANCELLED';
        }
    };

    $ctrl.uploadFiles = function (files) {
        delete $ctrl.uploadResults;
        $ctrl.files = files;
        $ctrl.progress = 0;
        upload = filesService.uploadSessionFile(files, sessionId);
        upload.then(function (response) {
            if (angular.isObject(response) && angular.isObject(response.data) && response.data.errorCode) {
                /* Required because the alerts from the interceptor are disabled on purpose in this modal, but in these specific cases we still want to display an alert. */
                if (response.data.errorCode === 'KH_ERR_4') {
                    // SESSION_FILES_CLEANED
                    alertService.displayAlert('4', null, 'DANGER');
                    $uibModalInstance.dismiss({
                        notAllowedAction: true
                    });
                } else if (response.data.errorCode === 'KH_ERR_5') {
                    // NOT_ALLOWED
                    alertService.displayAlert('5', null, 'DANGER');
                    $uibModalInstance.dismiss({
                        notAllowedAction: true
                    });
                }
                return;
            }

            $ctrl.uploadResults = response.data.uploadResults;
            $scope.$evalAsync(function () {
                let i;
                $uibModalInstance.completedAtLeastOnce = true;
                $ctrl.uploadStatus = "COMPLETED";
                for (i = 0; i < $ctrl.uploadResults.length; i++) {
                    if (!$ctrl.uploadResults[i].startsWith('SUCCESS')) {
                        $ctrl.uploadStatus = "WARNING";
                        break;
                    }
                }
            });
        }, function () {
            $scope.$evalAsync(function () {
                if ($ctrl.uploadStatus === 'CANCELLED') {
                    delete $ctrl.files;
                    $ctrl.uploadStatus = "PENDING";
                } else {
                    $ctrl.progress = 100;
                    $ctrl.uploadStatus = "ERROR";
                }
            });
        }, function (evt) {
            $scope.$evalAsync(function () {
                $ctrl.progress = Math.min(100, Math.round(100.0 *
                    evt.loaded / evt.total));

            });
        });
        $ctrl.uploadStatus = "PROGRESS";
    };

    $ctrl.close = function () {
        $uibModalInstance.close();
    };
});
