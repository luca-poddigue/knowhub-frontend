'use strict';

angular.module('knowhub')
    .component('profilePictureLoader', {
        templateUrl: 'common/components/profile-picture-loader/profile-picture-loader.html',
        bindings: {
            source: '@',
            customPhotoUrl: '@',
            api: '&'
        },
        controller: function profilePictureLoaderController(supportedImageFormats, $q, spinnerService, $element, $attrs, $scope, userAuthService, $exceptionHandler, profilePictureSize) {

            let $ctrl = this;
            let croppieWidget;

            function useCustomPhoto() {
                $ctrl.source = 'CUSTOM';
                $ctrl.isCustomImageLoading = false;
            }

            function useProviderPhoto() {
                $ctrl.source = 'PROVIDER';
            }

            $ctrl.$onInit = function () {
                if ($ctrl.source && $ctrl.source !== 'CUSTOM' && $ctrl.source !== 'PROVIDER' && $ctrl.source !== 'NONE') {
                    $exceptionHandler(new Error('Invalid source type: ' + $ctrl.source));
                }
                $ctrl.validFileTypes = angular.copy(supportedImageFormats);
                $ctrl.validFileTypes.push('image/svg+xml');
                $ctrl.imgCropEnabled = false;
                $ctrl.isNewCustomImage = false;
                $ctrl.authInfo = userAuthService.getAuthInfo();
                $ctrl.imageSize = profilePictureSize;
                $ctrl.isCustomImageValid = true;
                $ctrl.isCustomImageLoading = false;

                if (!$ctrl.source) {
                    // auto initialize source
                    if (!$ctrl.authInfo.photoURL) {
                        $scope.$evalAsync(function () {
                            useCustomPhoto();
                        });
                    } else {
                        $scope.$evalAsync(function () {
                            if ($ctrl.source === 'CUSTOM') {
                                useCustomPhoto();
                            } else if ($ctrl.source === 'PROVIDER') {
                                useProviderPhoto();
                            }
                        });
                    }
                }

                croppieWidget = new Croppie($element.find('#crop-widget')[0], {
                    viewport: {
                        width: 150,
                        height: 150,
                        type: 'square'
                    },
                    showZoomer: false
                });

                initApi();
            };

            $ctrl.$onDestroy = function () {
                croppieWidget.destroy();
            };

            $ctrl.useCustomPhoto = function () {
                useCustomPhoto();
            };

            $ctrl.useProviderPhoto = function () {
                useProviderPhoto();
            };

            $ctrl.handleFileSelect = function (evt) {
                spinnerService.show('general-spinner');
                $scope.$evalAsync(function () {
                    $ctrl.isCustomImageValid = true;
                    $ctrl.isCustomImageLoading = true;
                });

                $ctrl.isNewCustomImage = true;

                let file = evt.currentTarget.files[0];
                if (!file) {
                    $scope.$evalAsync(function () {
                        $ctrl.isCustomImageLoading = false;
                        spinnerService.hide('general-spinner');
                    });
                    return;
                }
                if (!$ctrl.validFileTypes.contains(file.type)) {
                    $scope.$evalAsync(function () {
                        $ctrl.isCustomImageValid = false;
                        $ctrl.isCustomImageLoading = false;
                        spinnerService.hide('general-spinner');
                    });
                    return;
                }
                let reader = new FileReader();
                reader.onload = function (evt) {
                    $scope.$evalAsync(function () {
                        croppieWidget.bind({
                            url: evt.target.result
                        }).then(function () {
                            $scope.$evalAsync(function () {
                                $ctrl.isCustomImageValid = true;
                                $ctrl.imgCropEnabled = true;
                                $ctrl.isCustomImageLoading = false;
                                spinnerService.hide('general-spinner');
                            });
                        }, function () {
                            $scope.$evalAsync(function () {
                                $ctrl.isCustomImageValid = false;
                                $ctrl.isCustomImageLoading = false;
                                spinnerService.hide('general-spinner');
                            });
                        });
                    });
                };
                reader.readAsDataURL(file);
            };

            function initApi() {
                $ctrl.api({
                    api: {
                        getProfilePictureData: function () {
                            return getProfilePictureData();
                        }
                    }
                });

                function getProfilePictureData() {
                    let data = {};
                    let croppieWidgetResultDeferred = $q.defer();
                    croppieWidget.result({
                        type: 'base64',
                        size: {
                            width: profilePictureSize * 3,
                            height: profilePictureSize * 3
                        },
                        format: 'png'
                    }).then(function (base64Url) {
                        croppieWidgetResultDeferred.resolve(base64Url);
                    }, function () {
                        croppieWidgetResultDeferred.reject();
                    });
                    if ($ctrl.source === 'PROVIDER') {
                        data.photoUrl = $ctrl.authInfo.photoURL;
                    } else if ($ctrl.source === 'CUSTOM') {
                        data.photoUrl = $ctrl.customPhotoUrl;
                        if ($ctrl.isNewCustomImage) {
                            data.photoDataUrlPromise = croppieWidgetResultDeferred.promise;
                        }
                    }
                    data.source = $ctrl.source;
                    return data;
                }
            }

            $ctrl.clear = function () {
                $ctrl.source = 'NONE';
            };
        }
    });