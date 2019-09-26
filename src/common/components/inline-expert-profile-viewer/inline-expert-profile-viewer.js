'use strict';

angular.module('knowhub')
    .component('inlineExpertProfileViewer', {
        bindings: {
            expertOverview: '<',
            enableSessionRequest: '<',
            source: '@', //search, bookmarks, support
            onSessionRequest: '&?'
        },
        templateUrl: 'common/components/inline-expert-profile-viewer/inline-expert-profile-viewer.html',
        controller: function inlineExpertProfileViewerController($exceptionHandler, $filter, userRole, userService, spinnerService, profilePictureSize, languages, languageProficiencyLevels, skillProficiencyLevels, $uibModal, alertService, defaultPaginationSize) {

            let $ctrl = this;
            let modalInstance;
            let hasMoreResults;
            let paginationCursor;
            let ongoingLoading;
            let translate;

            $ctrl.$onInit = function () {
                translate = $filter('translate');
                hasMoreResults = true;
                ongoingLoading = false;
                paginationCursor = null;
                $ctrl.round = Math.round;
                $ctrl.showFullProfile = false;
                $ctrl.profilePictureSize = profilePictureSize;
                $ctrl.languageProficiencyLevels = angular.getObjectValues(languageProficiencyLevels);
                $ctrl.skillProficiencyLevels = angular.getObjectValues(skillProficiencyLevels);
                $ctrl.languages = languages;
            };

            $ctrl.showSupporterBadge = function () {
                return $ctrl.expertOverview.user.role === userRole.supporter.name;
            };

            $ctrl.formatSupporterBadgeText = function() {
                return $ctrl.supporterBadgeText = translate('INLINE_EXPERT_PROFILE_VIEWER_SUPPORTER_BADGE_TEXT').replace('%userName%', $ctrl.expertOverview.user.firstName);
            };

            $ctrl.showReportAbuseModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/components/abuse-report-modal/abuse-report-modal.html',
                    controller: 'abuseReportModal',
                    controllerAs: '$ctrl',
                    resolve: {
                        expertId: function () {
                            return $ctrl.expertOverview.user.id;
                        },
                        sessionId: function () {
                            return null;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    alertService.displayAlert('ABUSE_REPORT', null, 'SUCCESS');
                }, angular.noop);
            };

            $ctrl.moreComments = function () {
                if (ongoingLoading) {
                    return;
                }
                if (!hasMoreResults) {
                    return;
                }
                ongoingLoading = true;

                return userService.getFeedbackComments($ctrl.expertOverview.user.id, paginationCursor).then(function (response) {
                    let comments = response.data.comments;
                    if (!comments || comments.length < defaultPaginationSize) {
                        hasMoreResults = false;
                    } else {
                        paginationCursor = response.data.pagination[1];
                    }

                    if (!$ctrl.fullProfile.recentComments.comments) {
                        $ctrl.fullProfile.recentComments.comments = [];
                    }
                    if (comments && comments.length) {
                        $ctrl.fullProfile.recentComments.comments = $ctrl.fullProfile.recentComments.comments.concat(comments);
                    }
                }, angular.noop).finally(function () {
                    ongoingLoading = false;
                });
            };

            $ctrl.toggleFullProfile = function () {
                if (!$ctrl.showFullProfile && !$ctrl.fullProfile) {
                    userService.getExpertProfile($ctrl.expertOverview.user.id).then(function (response) {
                        $ctrl.fullProfile = response.data;
                        paginationCursor = $ctrl.fullProfile.recentComments.pagination[1];
                        let userCurrentLang = userService.language();
                        if ($ctrl.fullProfile.availableLanguages.contains(userCurrentLang)) {
                            $ctrl.profileDisplayLanguage = userCurrentLang;
                        } else if ($ctrl.fullProfile.availableLanguages.contains('en')) {
                            $ctrl.profileDisplayLanguage = 'en';
                        } else {
                            $ctrl.profileDisplayLanguage = $ctrl.fullProfile.availableLanguages[0];
                        }
                        $ctrl.showFullProfile = true;
                    });
                } else {
                    $ctrl.showFullProfile = !$ctrl.showFullProfile;
                }
            };

            $ctrl.$onChanges = function (changes) {
                if (changes.expertOverview) {
                    if (!$ctrl.expertOverview) {

                    }
                }
            };

            $ctrl.showSessionRequestModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/components/inline-expert-profile-viewer/session-request-modal/session-request-modal.html',
                    controller: 'sessionRequestModal',
                    controllerAs: '$ctrl',
                    windowClass: 'session-request-modal',
                    size: 'lg',
                    resolve: {
                        expertId: function () {
                            return $ctrl.expertOverview.user.id;
                        },
                        expertName: function () {
                            return $ctrl.expertOverview.user.fullName;
                        },
                        source: function () {
                            return $ctrl.source;
                        }
                    }
                });

                modalInstance.result.then(function (sessionId) {
                    alertService.displayAlert('SESSION_REQUEST', null, 'SUCCESS', null, [{
                        titleKey: "ALERT_VIEWER_GO_TO_SESSION",
                        target: "/manage?mode=dashboard&session=" + sessionId,
                        icon: "arrow-right"
                    }]);
                    if ($ctrl.onSessionRequest) {
                        $ctrl.onSessionRequest();
                    }
                }, angular.noop);
            };

        }
    });
