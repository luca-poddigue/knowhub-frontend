'use strict';

angular.module('knowhub')
    .component('tabFeedback', {
        templateUrl: 'sections/manage/tab-feedback/tab-feedback.html',
        controller: function tabFeedbackController(spinnerService, alertService, userService, sharingSessionWorkflowService) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.isAppReady = spinnerService.isAppReady;
                $ctrl.isUndefined = angular.isUndefined;

                $ctrl.feedbacks = {};

                $ctrl.sessionHeldOptions = [{
                    key: 'COMMON_YES',
                    activeClass: 'btn-success',
                    id: true
                },
                {
                    key: 'COMMON_NO',
                    activeClass: 'btn-danger',
                    id: false
                }];

                $ctrl.feedbackAnswerOptions = [{
                    key: 'COMMON_YES',
                    activeClass: 'btn-success',
                    id: 'YES'
                },
                    {
                        key: 'COMMON_PARTIALLY',
                        activeClass: 'btn-warning',
                        id: 'PARTIALLY'
                    },
                    {
                        key: 'COMMON_NO',
                        activeClass: 'btn-danger',
                        id: 'NO'
                    }];

                userService.getPendingFeedbacks().then(function (response) {
                    if (response.data.items) {
                        $ctrl.pendingFeedbacks = response.data.items;
                    } else {
                        $ctrl.pendingFeedbacks = [];
                    }
                }, angular.noop);
            };

            $ctrl.toggleForm = function (pendingFeedback) {
                if (!pendingFeedback.open) {
                    if (!pendingFeedback.feedback) {
                        pendingFeedback.feedback = getCleanFeedback();
                    }
                    pendingFeedback.open = true;
                } else {
                    pendingFeedback.open = false;
                }
            };

            $ctrl.sendFeedback = function (sessionId, feedback, index) {
                return sharingSessionWorkflowService.processFeedback(sessionId, feedback).then(function () {
                    alertService.displayAlert('FEEDBACK_PROCESSED', null, 'SUCCESS');
                    $ctrl.pendingFeedbacks.splice(index, 1);
                }, angular.noop);
            };

            function getCleanFeedback() {
                return {
                    "qas": [
                        {
                            "question": "SOLVED_THE_PROBLEM",
                        },
                        {
                            "question": "WAS_SKILLED",
                        },
                        {
                            "question": "WAS_KIND",
                        },
                        {
                            "question": "WAS_CLEAR",
                        },
                        {
                            "question": "WAS_ON_TIME",
                        }
                    ]
                };
            }

        }
    });