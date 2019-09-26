'use strict';

angular.module('knowhub')
    .controller('videoCallModal', function videoCallModalController($document, $scope, spinnerService, $uibModalInstance, otherUserName, sessionId, videoCallService, userService, alertService) {

        let $ctrl = this;
        let activeRoom;
        let videoLocalTrack;

        $uibModalInstance.khIgnoreDismissOnLocationChange = true;
        spinnerService.show('video-call-spinner');
        $ctrl.otherUserName = otherUserName;
        $ctrl.showLocalMedia = true;
        $ctrl.detailsCollapsed = false;
        $ctrl.isMinimized = false;
        $ctrl.isSharingScreen = false;
        $ctrl.menuOpen = false;
        $ctrl.isScreenSharingSupported = videoCallService.isScreenSharingSupported();

        videoCallService.enlargeVideoCall();

        $uibModalInstance.result.then(function (result) {
            if (activeRoom) {
                activeRoom.disconnect();
            }
            return result;
        });

        $scope.$on('alertViewer:reportIssue', function () {
            $ctrl.hangUp();
        });

        $scope.$on("$locationChangeStart", function () {
            $ctrl.minimizeVideoCall();
        });

        $uibModalInstance.rendered.then(function (a,b,c) {
            $ctrl.status = 'connecting';
            videoCallService.getVideoCallInitData(sessionId).then(function (initData) {
                Twilio.Video.connect(initData.token, {
                    name: "session-" + sessionId
                }).then(roomJoined, showError('VIDEO_CALL_CONNECTION'));
            }, showError('VIDEO_CALL_CONNECTION'));
        });

        $ctrl.toggleScreenSharing = function ($event) {
            $event.stopPropagation();
            $ctrl.showMissingExtensionMessage = false;
            videoCallService.getUserScreen().then(function (stream) {
                $scope.$evalAsync(function () {
                    $ctrl.isSharingScreen = true;
                    let screenLocalTrack = new Twilio.Video.LocalVideoTrack(stream.getVideoTracks()[0]);
                    screenLocalTrack.once('stopped', function () {
                        $scope.$evalAsync(function () {
                            $ctrl.isSharingScreen = false;
                            if ($ctrl.status !== 'disconnected') {
                                activeRoom.localParticipant.unpublishTrack(screenLocalTrack);
                                activeRoom.localParticipant.publishTrack(videoLocalTrack).then(function() {
                                    $document.find('#local-media').empty().append(videoLocalTrack.attach());
                                });
                            }
                        });
                    });
                    activeRoom.localParticipant.unpublishTrack(videoLocalTrack);
                    activeRoom.localParticipant.publishTrack(screenLocalTrack).then(function() {
                        $document.find('#local-media').empty().append(screenLocalTrack.attach());
                    });
                    $ctrl.menuOpen = false;
                });
            }).catch(function (error) {
                $scope.$evalAsync(function () {
                    if (error.message === 'missingExtension') {
                        $ctrl.showMissingExtensionMessage = true;
                    } else {
                        alertService.displayAlert('VIDEO_CALl_SCREEN_SHARING', null, 'DANGER');
                        $ctrl.menuOpen = false;
                    }
                });
            });
        };

        $ctrl.toggleShowLocalMedia = function () {
            $ctrl.showLocalMedia = !$ctrl.showLocalMedia;
        };

        $ctrl.minimizeVideoCall = function () {
            videoCallService.minimizeVideoCall();
            $ctrl.isMinimized = true;
        };

        $ctrl.enlargeVideoCall = function () {
            videoCallService.enlargeVideoCall();
            $ctrl.isMinimized = false;
        };

        $ctrl.hangUp = function () {
            $uibModalInstance.close();
        };

        function roomJoined(room) {
            activeRoom = room;

            if (room.localParticipant.videoTracks.size) {
                videoLocalTrack = room.localParticipant.videoTracks.values().next().value;
                $document.find('#local-media').append(videoLocalTrack.attach());
            }

            if (room.participants.size) {
                room.participants.forEach(function (participant) {
                    initParticipant(participant);
                });
            } else {
                $scope.$evalAsync(function () {
                    $ctrl.status = "waitingForOtherUser";
                });
            }

            room.on('participantConnected', function (participant) {
                initParticipant(participant);
            });

            room.on('participantDisconnected', function (participant) {
                participant.tracks.forEach(function (track) {
                    let attachedElements = track.detach();
                    attachedElements.forEach(function (element) {
                        element.remove()
                    });
                });
                $scope.$evalAsync(function () {
                    $ctrl.status = 'otherUserDisconnected';
                });

            });

            room.on('disconnected', function () {
                $ctrl.status = 'disconnected';
                room.localParticipant.tracks.forEach(function (track) {
                    room.localParticipant.unpublishTrack(track);
                    track.stop();
                });
            });
        }

        function showError(errorKey) {
            return function () {
                $scope.$evalAsync(function () {
                    alertService.displayAlert(errorKey, null, 'DANGER');
                    spinnerService.hide('video-call-spinner');
                    $ctrl.status = "error";
                });
            };
        }

        function initParticipant(participant) {
            participant.on('trackAdded', function (track) {
                $document.find('#remote-media ' + track.kind).remove();
                $document.find('#remote-media').append(track.attach());
            });
            participant.on('trackStopped', function (track) {
                $scope.$evalAsync(function () {
                    $ctrl.status = "waitingForOtherUser";
                });
            });
            participant.tracks.forEach(function (track) {
                $document.find('#remote-media ' + track.kind).remove();
                $document.find('#remote-media').append(track.attach());
            });
            $scope.$evalAsync(function () {
                $ctrl.status = "transmitting";
                spinnerService.hide('video-call-spinner');
            });
        }

    });
