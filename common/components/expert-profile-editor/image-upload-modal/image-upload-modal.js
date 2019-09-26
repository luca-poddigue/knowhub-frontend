'use strict';

angular.module('knowhub').controller('imageUploadModal', function (modalConfig, $filter, $window, supportedImageFormats, alertService, filesService, $scope, $httpParamSerializer, $location, $uibModalInstance, Upload) {

    const $ctrl = this;

    let uploadResponse;
    $ctrl.modalConfig = modalConfig;
    $ctrl.thumbnailError = false;
    $ctrl.validFileTypes = supportedImageFormats;

    let upload;

    $scope.$on('modal.closing', function ($event) {
        if (Upload.isUploadInProgress()) {
            $event.preventDefault();
        }
    });

    $ctrl.modeOptions = [{
        key: 'EXPERT_PROFILE_UPLOAD_IMAGE',
        id: 'UPLOAD'
    },
        {
            key: 'EXPERT_PROFILE_IMAGE_URL',
            id: 'URL'
        }];
    $ctrl.mode = "UPLOAD";
    $ctrl.uploadStatus = "PENDING";

    $ctrl.isUploadInProgress = () => {
        return Upload.isUploadInProgress();
    };

    $ctrl.onModeChange = () => {
        $ctrl.cancelUpload();
    };

    $ctrl.dismiss = () => {
        $uibModalInstance.dismiss();
    };

    $ctrl.onThumbnailError = () => {
        $ctrl.thumbnailError = true;
    };

    $ctrl.validateDimension = function ($file, $width, $height) {
        return $width <= 1000 && $height <= 1000;
    };

    $ctrl.done = () => {
        const result = {};
        if ($ctrl.mode === 'URL') {
            result.imageUrl = $ctrl.imageUrl;
        }
        result.uploadResponse = uploadResponse;

        if ($ctrl.imageWidth) {
            result.imageWidth = $ctrl.imageWidth;
        }
        if ($ctrl.imageHeight) {
            result.imageHeight = $ctrl.imageHeight;
        }
        $uibModalInstance.close(result);
    };

    $ctrl.uploadImage = function (file) {
        $ctrl.thumbnailError = false;
        $ctrl.imageUploaded = false;
        $ctrl.progress = 0;
        $ctrl.file = file;

        if (!file) {
            return;
        }

        upload = $ctrl.modalConfig.uploadFn($ctrl.file);
        upload.then(function (response) {
            uploadResponse = response.data;
            $scope.$evalAsync(() => {
                $ctrl.uploadStatus = "COMPLETED";
                $ctrl.imageUploaded = true;
            });
        }, () => {
            $scope.$evalAsync(() => {
                if ($ctrl.uploadStatus === 'CANCELLED') {
                    $ctrl.uploadStatus = "PENDING";
                } else {
                    $ctrl.progress = 100;
                    $ctrl.uploadStatus = "ERROR";
                }
            });
        }, function (evt) {
            $scope.$evalAsync(() => {
                $ctrl.progress = Math.min(100, Math.round(100.0 *
                    evt.loaded / evt.total));
            });
        });
        $ctrl.uploadStatus = "PROGRESS";
    };

    $ctrl.cancelUpload = () => {
        if (Upload.isUploadInProgress()) {
            upload.abort();
            $ctrl.uploadStatus = "CANCELLED";
        }
    };

});
