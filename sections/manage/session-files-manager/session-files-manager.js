'use strict';

angular.module('knowhub')
    .component('sessionFilesManager', {
        templateUrl: 'sections/manage/session-files-manager/session-files-manager.html',
        bindings: {
            mode: '@', //EXPERT, SEEKER
            session: '<',
            filesBucket: '<',
            onFilesChanged: '&',
            onNotAllowedAction: '&'
        },
        controller: function sessionFilesManagerController($route, $scope, $filter, sessionBucketSize,
                                                           maxNumberOfSessionFiles, userType, $uibModal,
                                                           filesService, $location, userService, userAuthService,
                                                           sessionStatus, liveNotificationType, $window) {
            let $ctrl = this;
            let modalInstance;
            let translate;

            $ctrl.$onInit = function () {
                translate = $filter('translate');
                $ctrl.ongoingDeletionIdx = null;
                $ctrl.getIcon = filesService.getIconByContentType;
                $ctrl.userId = userService.basicInfo().id;

                $scope.$on("liveNotifications:message", function (event, data) {
                    if (data.sessionId === $ctrl.session.id &&
                        ([liveNotificationType.filesUpload,
                            liveNotificationType.fileDeletion].contains(data.type))) {
                        $ctrl.onFilesChanged();
                    }
                });
            };

            $ctrl.$onChanges = function (changes) {
                if (changes.filesBucket) {
                    updateUsageSpaceBar();
                }
            };

            $ctrl.canChangeFiles = function () {
                return $ctrl.session.status !== sessionStatus.inquiry && $ctrl.filesBucket.filesModifiable;
            };

            $ctrl.isFileOwner = function (ownerId) {
                return userService.basicInfo().id === ownerId;
            };

            $ctrl.fileUploadedBy = function (ownerId) {
                if ($ctrl.isFileOwner(ownerId)) {
                    return translate('SESSION_FILES_MANAGER_YOU');
                } else {
                    if ($ctrl.mode === userType.expert) {
                        return $ctrl.session.seeker.firstName;
                    } else if ($ctrl.mode === userType.seeker) {
                        return $ctrl.session.expert.firstName;
                    }
                }
            };

            $ctrl.showFileDeletionModal = function (file, index) {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'sections/manage/session-files-manager/file-deletion-modal/file-deletion-modal.html',
                    controller: 'fileDeletionModal',
                    controllerAs: '$ctrl',
                    windowClass: 'file-deletion-modal',
                    resolve: {
                        file: function () {
                            return file;
                        },
                        sessionId: function () {
                            return $ctrl.session.id;
                        }
                    }
                });
                modalInstance.result.then(function (bucket) {
                    $ctrl.filesBucket.files.splice(index, 1);
                    $ctrl.filesBucket.uploadedFilesSize = bucket.uploadedFilesSize;
                    updateUsageSpaceBar();
                }, function (rejection) {
                    if (angular.isObject(rejection) && rejection.notAllowedAction) {
                        $ctrl.onNotAllowedAction();
                    }
                });
            };

            $ctrl.downloadFile = function (fileUrl) {
                $window.open(fileUrl + '?Authorization=' + userAuthService.getAuthToken(), '_self', '');
            };

            $ctrl.showFileUploadModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'sections/manage/session-files-manager/file-upload-modal/file-upload-modal.html',
                    controller: 'fileUploadModal',
                    controllerAs: '$ctrl',
                    windowClass: 'file-upload-modal',
                    resolve: {
                        sessionId: function () {
                            return $ctrl.session.id;
                        }
                    }
                });
                modalInstance.result.then(function () {
                    reloadIfFilesUploadCompleted();
                }, function (rejection) {
                    if (angular.isObject(rejection) && rejection.notAllowedAction) {
                        $ctrl.onNotAllowedAction();
                    } else {
                        reloadIfFilesUploadCompleted();
                    }
                });
            };

            function reloadIfFilesUploadCompleted() {
                if (modalInstance.completedAtLeastOnce) {
                    $ctrl.onFilesChanged();
                }
            }

            function updateUsageSpaceBar() {
                $ctrl.usedSpaceBar = {
                    percentage: Math.round(($ctrl.filesBucket.uploadedFilesSize / sessionBucketSize) * 100),
                    text: $filter('fileSize')($ctrl.filesBucket.uploadedFilesSize) + ' / ' + $filter('fileSize')(sessionBucketSize)
                };
                if ($ctrl.usedSpaceBar.percentage > 90) {
                    $ctrl.usedSpaceBar.class = 'danger';
                } else if ($ctrl.usedSpaceBar.percentage > 70) {
                    $ctrl.usedSpaceBar.class = 'warning';
                } else {
                    $ctrl.usedSpaceBar.class = 'success';
                }
            }
        }

    });
