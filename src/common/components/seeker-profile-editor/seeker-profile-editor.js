'use strict';

angular.module('knowhub')
    .component('seekerProfileEditor', {
        bindings: {
            userInfo: '<',
            mode: '@', //REGISTER, UPDATE
            onSave: '&',
            onCancel: '&'
        },
        templateUrl: 'common/components/seeker-profile-editor/seeker-profile-editor.html',
        controller: function seekerProfileEditorController(localStorageService, locales, $location, $exceptionHandler, spinnerService, $timeout, $filter, userAuthService, userService, $scope, alertService, userType, $q, $anchorScroll) {

            let $ctrl = this;
            let initialLocale;
            let profilePictureLoaderApi;

            $ctrl.$onInit = function () {
                if ($ctrl.mode !== 'REGISTER' && $ctrl.mode !== 'UPDATE') {
                    let err = new Error('Invalid mode: ' + $ctrl.mode);
                    $exceptionHandler(err);
                    return;
                }

                $ctrl.isAdultOptions = [{
                    key: 'COMMON_YES',
                    activeClass: 'btn-success',
                    id: true
                },
                    {
                        key: 'COMMON_NO',
                        activeClass: 'btn-danger',
                        id: false
                    }];

                $timeout(function () {
                    $anchorScroll('seeker-profile-editor');
                });
            };

            $ctrl.setProfilePictureLoaderApi = function (api) {
                profilePictureLoaderApi = api;
            };

            $ctrl.$onChanges = function (changes) {
                if (!$ctrl.userInfo) {
                    $ctrl.userInfo = {};
                }
                initialLocale = $ctrl.userInfo.locale;

                if (changes.userInfo && $ctrl.userInfo) {
                    $ctrl.userInfo = angular.copy($ctrl.userInfo);
                    if (!$ctrl.userInfo.profilePictureSource) {
                        $ctrl.userInfo.profilePictureSource = 'NONE';
                    } else if ($ctrl.userInfo.profilePictureSource === 'CUSTOM') {
                        $ctrl.customPhotoUrl = $ctrl.userInfo.profilePictureDataUrl || $ctrl.userInfo.profilePictureUrl;
                    }
                    $ctrl.userInfo.email = userAuthService.getAuthInfo().email;
                    $ctrl.userInfo.adult = true;
                }
            };

            $ctrl.cancel = function () {
                if (initialLocale) {
                    userService.locale(initialLocale);
                }
                $ctrl.onCancel();
            };

            $ctrl.save = function () {
                let promise;
                let profilePictureData = profilePictureLoaderApi.getProfilePictureData();
                $ctrl.userInfo.profilePictureUrl = profilePictureData.photoUrl;
                $ctrl.userInfo.profilePictureSource = profilePictureData.source;

                if ($ctrl.userInfo.profilePictureSource === 'NONE') {
                    delete $ctrl.userInfo.profilePictureDataUrl;
                    delete $ctrl.userInfo.profilePictureUrl;
                }
                if (profilePictureData.photoDataUrlPromise) {
                    promise = profilePictureData.photoDataUrlPromise;
                } else {
                    promise = $q.resolve();
                }
                promise = promise.then(function (base64Url) {
                    if (base64Url) {
                        $ctrl.userInfo.profilePictureDataUrl = base64Url;
                    }
                    if ($ctrl.userInfo.profilePictureSource === 'CUSTOM' && !$ctrl.userInfo.profilePictureUrl && !$ctrl.userInfo.profilePictureDataUrl) {
                        $ctrl.userInfo.profilePictureSource = 'NONE';
                        delete $ctrl.userInfo.profilePictureDataUrl;
                        delete $ctrl.userInfo.profilePictureUrl;
                    }
                    let action;
                    switch ($ctrl.mode) {
                        case 'UPDATE':
                            action = userService.update($ctrl.userInfo);
                            break;
                        case 'REGISTER':
                            action = userService.register($ctrl.userInfo);
                            break;
                    }
                    return action;
                }).then(function () {
                    return userService.loadBasicInfo().then(function (basicInfo) {
                        switch ($ctrl.mode) {
                            case 'UPDATE':
                                alertService.displayAlert($ctrl.mode.toUpperCase() + '_USER', null, 'SUCCESS');
                                localStorageService.set('locale', basicInfo.locale);
                                break;
                            case 'REGISTER':
                                if (userAuthService.isSocialProviderAuth()) {
                                    $location.urlWithReplace('/guide').search({
                                        mode: userType.seeker,
                                        questionnaire: true
                                    });
                                } else {
                                    $location.urlWithReplace("/verifyPendingAction");
                                }
                                break;
                        }
                    });
                }).then(function () {
                    $ctrl.onSave({
                        userInfo: $ctrl.userInfo
                    });
                });
                return promise;
            };
        }
    });