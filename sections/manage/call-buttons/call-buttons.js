'use strict';

angular.module('knowhub')
    .component('callButtons', {
        bindings: {
            session: "<"
        },
        templateUrl: 'sections/manage/call-buttons/call-buttons.html',
        controller: function callButtonsController($timeout, $element, emailRegexp, userType, userBasicInfoService, videoCallService, spinnerService) {

            let $ctrl = this;
            let GO_TO_MEETING_BASE_URL = 'https://www.gotomeet.me/';
            let SKYPE_ID_PREFIX = "live:";
            let otherUser;

            $ctrl.$onInit = function () {
                $ctrl.userType = userType;
                $ctrl.getActiveVideoCall = videoCallService.getActiveVideoCall;
                $ctrl.currentUserType = userBasicInfoService.basicInfo().id === $ctrl.session.expert.id ? userType.expert : userType.seeker;

                $ctrl.callMethods = [];
                if (!$ctrl.session.callIds) {
                    $ctrl.session.callIds = {};
                }

                if ($ctrl.currentUserType === userType.expert) {
                    otherUser = $ctrl.session.seeker;
                } else {
                    otherUser = $ctrl.session.expert;
                }

                let builtIn = {
                    id: 'builtin'
                };
                if (!videoCallService.isSupported()) {
                    builtIn.disabled = true;
                    builtIn.reasonKey = 'BUILTIN_CALL_NOT_SUPPORTED'
                }
                $ctrl.callMethods.push(builtIn);

                let hangouts = {
                    id: 'hangouts'
                };
                if (!$ctrl.session.callIds.hangouts) {
                    hangouts.disabled = true;
                    hangouts.reasonKey = $ctrl.currentUserType + '_MISSING_ID_CODE'
                }
                $ctrl.callMethods.push(hangouts);

                let skype = {
                    id: 'skype'
                };
                if (!$ctrl.session.callIds.skype) {
                    skype.disabled = true;
                    skype.reasonKey = $ctrl.currentUserType + '_MISSING_ID_CODE'
                }
                $ctrl.callMethods.push(skype);

                let goToMeeting = {
                    id: 'goToMeeting'
                };
                if (!$ctrl.session.callIds.goToMeeting) {
                    goToMeeting.disabled = true;
                    goToMeeting.reasonKey = $ctrl.currentUserType + '_MISSING_ID_CODE'
                }
                $ctrl.callMethods.push(goToMeeting);

                $ctrl.goToMeetingUrl = GO_TO_MEETING_BASE_URL + $ctrl.session.callIds.goToMeeting;
                $ctrl.skypeUrl = 'skype:' + $ctrl.session.callIds.skype + '?call&video=true';
                $ctrl.hangoutsBtnId = 'hangouts-call-' + $ctrl.session.id;

                if ($ctrl.currentUserType === userType.expert && $ctrl.session.callIds && $ctrl.session.callIds.hangouts) {
                    spinnerService.show('general-spinner');
                    $timeout(function () {
                        gapi.hangout.render($ctrl.hangoutsBtnId, {
                            'render': 'createhangout',
                            'invites': [{
                                id: $ctrl.session.callIds.hangouts,
                                invite_type: 'EMAIL'
                            }],
                            'widget_size': 175
                        });
                    }).finally(function () {
                        spinnerService.hide('general-spinner');
                    });
                }
            };

            $ctrl.toggleVideoCall = function () {
                if ($ctrl.getActiveVideoCall() === $ctrl.session.id) {
                    videoCallService.stopVideoCall();
                } else {
                    videoCallService.startVideoCall($ctrl.session.id, otherUser.fullName);
                }
            };

        }
    });
