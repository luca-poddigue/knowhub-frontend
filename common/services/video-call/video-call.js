'use strict';

angular
    .module('knowhub')
    .factory('videoCallService', function videoCallFactory($timeout, $http, $window, $document, $location, $uibModal, chromeScreenSharingExtensionId) {

        let modalInstance;
        let activeSessionId = null;
        let videoCallMinimizedClass = 'video-call-minimized';
        let modalOpenClass = 'modal-open';

        function getUserScreen() {
            let request = {
                type: 'getUserScreen',
                sources: ['window', 'screen', 'tab']
            };
            return new Promise(function (resolve, reject) {
                chrome.runtime.sendMessage(chromeScreenSharingExtensionId, request, function (response) {
                    if (!response) {
                        reject(new Error('missingExtension'));
                    } else {
                        switch (response && response.type) {
                            case 'success':
                                resolve(response.streamId);
                                break;
                            case 'error':
                                reject(new Error(response.message));
                                break;
                            default:
                                reject(new Error('Unknown response'));
                                break;
                        }
                    }
                });
            }).then(function (streamId) {
                return navigator.mediaDevices.getUserMedia({
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: streamId,
                            maxWidth: 1920,
                            maxHeight: 1080
                        }
                    }
                });
            });
        }

        function startVideoCall(sessionId, otherUserName) {
            modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'common/components/video-call-modal/video-call-modal.html',
                controller: 'videoCallModal',
                controllerAs: '$ctrl',
                windowClass: 'video-call-modal',
                backdrop: false,
                keyboard: false,
                size: 'lg',
                resolve: {
                    sessionId: function () {
                        return sessionId;
                    },
                    otherUserName: function () {
                        return otherUserName;
                    }
                }
            });
            modalInstance.opened.then(function(){
                $timeout(function() {
                    activeSessionId = sessionId;
                }, 500);
            });
            modalInstance.result.then(function () {
                activeSessionId = null;
                modalInstance = null;
            }, angular.noop);
        }

        function stopVideoCall() {
            if (modalInstance) {
                modalInstance.close();
            }
        }

        function minimizeVideoCall() {
            $document.find('body').addClass(videoCallMinimizedClass);
            $document.find('body').removeClass(modalOpenClass);
        }

        function enlargeVideoCall() {
            $document.find('body').removeClass(videoCallMinimizedClass);
            $document.find('body').addClass(modalOpenClass);
            $document.find('#video-call-modal').css({
                bottom: '',
                right: ''
            })
        }

        function getActiveVideoCall() {
            return activeSessionId;
        }

        function getVideoCallInitData(sessionId) {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'videocall/' + sessionId
            })
                .then(function (response) {
                    return response.data;
                });
        }

        function isSupported() {
            return navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        }

        function isScreenSharingSupported() {
            return angular.isDefined($window.chrome) && angular.isDefined($window.chrome.runtime) && angular.isFunction($window.chrome.runtime.sendMessage);
        }

        return {
            startVideoCall: function (sessionId, otherUserName) {
                return startVideoCall(sessionId, otherUserName);
            },
            stopVideoCall: function () {
                return stopVideoCall();
            },
            minimizeVideoCall: function () {
                return minimizeVideoCall();
            },
            enlargeVideoCall: function () {
                return enlargeVideoCall();
            },
            getActiveVideoCall: function () {
                return getActiveVideoCall();
            },
            isSupported: function () {
                return isSupported();
            },
            isScreenSharingSupported: function () {
                return isScreenSharingSupported();
            },
            getVideoCallInitData: function (id) {
                return getVideoCallInitData(id);
            },
            getUserScreen: function () {
                return getUserScreen();
            }
        };

    });
