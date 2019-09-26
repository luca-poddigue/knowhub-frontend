'use strict';

angular.module('knowhub')
    .component('tabDashboard', {
        templateUrl: 'sections/manage/tab-dashboard/tab-dashboard.html',
        controller: function tabDashboardController(sharingSessionReportingService, spinnerService, $q, userType, defaultPaginationSize, $location, $scope, liveNotificationsService, liveNotificationType, browserUtilsService, userBasicInfoService, sessionStatus, $filter, alertService, userService) {

            let $ctrl = this;
            let paginationCursor;
            let hasMoreResults;
            let translate;

            $ctrl.$onInit = function () {
                $ctrl.ongoingLoading = false;
                translate = $filter('translate');
                $ctrl.userTypeOptions = [{
                    key: 'COMMON_SEEKER',
                    activeClass: 'btn-primary',
                    id: userType.seeker
                },
                    {
                        key: 'COMMON_EXPERT',
                        activeClass: 'btn-primary',
                        id: userType.expert
                    }];
                $ctrl.isSingleSession = false;
                $ctrl.sessionStatus = angular.getObjectValues(sessionStatus);
                $ctrl.isAppReady = spinnerService.isAppReady;
                $ctrl.userType = userType;
                $ctrl.currentUserType = userBasicInfoService.basicInfo().type;

                $scope.$watch(function () {
                    return $location.search().session;
                }, function () {
                    if ($location.search().session) {
                        $ctrl.isSingleSession = true;
                        $ctrl.sessionsFilters = {};
                        _loadSessionOverviews(true);
                    } else {
                        $ctrl.isSingleSession = false;
                        $ctrl.sessionsFilters = {
                            userType: userType.seeker
                        };
                        // first load performed by the memory form
                    }
                });

                $scope.$watch(function () {
                    return $location.search().chat;
                }, function (showChat, oldShowChat) {
                    if (showChat && !oldShowChat) {
                        _loadSessionOverviews(true);
                    }
                });

                _loadOverviewBoxes();
                $scope.$on('liveNotifications:message', function (event, data) {
                    if ([liveNotificationType.sessionUpdate,
                            liveNotificationType.sessionCompletion,
                            liveNotificationType.sessionRejection,
                            liveNotificationType.sessionAccepted,
                            liveNotificationType.sessionPlanned,
                            liveNotificationType.sessionUnderInquiry].contains(data.type)) {
                        _loadOverviewBoxes();
                    }
                });
                $scope.$on('sharingSession:sessionChange', function () {
                    _loadOverviewBoxes();
                });

                sharingSessionReportingService.getSessionsFiltersData().then(function (sessionFiltersData) {
                    $ctrl.sessionFiltersData = sessionFiltersData;
                    sharingSessionReportingService.getSessionsFiltersData().then(function (sessionFiltersData) {
                        $ctrl.sessionFiltersData = sessionFiltersData;
                    }, angular.noop);
                }, angular.noop);

                if (!userBasicInfoService.basicInfo().notificationsEnabled && browserUtilsService.isLiveNotificationsSupported()) {
                    alertService.displayAlert('ENABLE_NOTIFICATIONS', null, 'INFO', null, [{
                        titleKey: "ALERT_VIEWER_ENABLE",
                        target: function () {
                            let preferences = {
                                notificationsEnabled: true,
                                playNotificationSound: userBasicInfoService.basicInfo().playNotificationSound
                            };
                            userService.updateNotificationsPreferences(preferences, true, true);
                        },
                        icon: "comments"
                    }], true);
                }
            };

            $ctrl.refreshTopicFilterChoices = function (search) {
                if (search.length >= 2) {
                    $ctrl.delayedSearchTopics = search;
                } else {
                    $ctrl.delayedSearchTopics = null;
                }
            };

            $ctrl.refreshOtherUserFilterChoices = function (search) {
                if (search.length >= 2) {
                    $ctrl.delayedSearchOtherUsers = search;
                } else {
                    $ctrl.delayedSearchOtherUsers = null;
                }
            };

            $ctrl.formatStatus = function (status) {
                if (status === sessionStatus.acceptedByExpert && $ctrl.sessionsFilters.userType === userType.expert) {
                    return translate('DASHBOARD_SESSION_STATUS_ACCEPTED_BY_YOU');
                }
                return translate('DASHBOARD_SESSION_STATUS_' + status);
            };

            $ctrl.formatWarningAlert = function () {
                if ($ctrl.isSingleSession) {
                    if (!$ctrl.sessionOverviews || !$ctrl.sessionOverviews.length) {
                        return translate('DASHBOARD_NO_SINGLE_SESSION');
                    }
                } else {
                    let setFilters = [];
                    angular.forEach($ctrl.sessionsFilters, function(value, key) {
                        if (angular.isDefined(value)) {
                            this.push(key);
                        }
                    }, setFilters);
                    if (angular.equals(setFilters, ['userType'])) {
                        if ($ctrl.loadedUserType === $ctrl.userType.seeker) {
                            return translate('DASHBOARD_NO_SESSIONS_AS_A_SEEKER');
                        } else {
                            return translate('DASHBOARD_NO_SESSIONS_AS_AN_EXPERT');
                        }
                    } else {
                        return translate('DASHBOARD_NO_SESSIONS_WITH_THESE_FILTERS');
                    }
                }
            };

            $ctrl.exitSingleMode = function () {
                $location.search('session', null);
                $location.search('chat', null);
                liveNotificationsService.activeChat(null);
            };

            $ctrl.loadSessions = function (resetUserTypeDependentFilters) {
                if (resetUserTypeDependentFilters) {
                    delete $ctrl.sessionsFilters.topic;
                    delete $ctrl.sessionsFilters.otherUser;
                }
                return _loadSessionOverviews(true);
            };

            $ctrl.loadMoreSessions = function () {
                _loadSessionOverviews(false);
            };

            function _loadOverviewBoxes() {
                sharingSessionReportingService.getOverviewBoxesData().then(function (overviewBoxes) {
                    $ctrl.overviewBoxes = overviewBoxes;
                    $ctrl.overviewBoxes.AVAILABLE_POINTS = Number($ctrl.overviewBoxes.AVAILABLE_POINTS);
                });
            }

            function _loadSessionOverviews(reset) {
                if ($ctrl.ongoingLoading) {
                    return;
                }
                if (!reset && !hasMoreResults) {
                    return;
                }
                $ctrl.ongoingLoading = true;
                if (reset) {
                    paginationCursor = null;
                    hasMoreResults = true;
                }

                let loadSessionsApi;
                if ($ctrl.isSingleSession) {
                    loadSessionsApi = function () {
                        return sharingSessionReportingService.getSingleSession($location.search().session).then(function (data) {
                            if (data.sessions.length) {
                                data.sessions[0].showDetailsRightAway = true;
                                data.sessions[0].showChatRightAway = !!$location.search().chat;
                            }
                            return data;
                        });
                    };
                } else {
                    loadSessionsApi = function () {
                        return sharingSessionReportingService.getSessions(paginationCursor, $ctrl.sessionsFilters);
                    };
                }

                return loadSessionsApi().then(function (data) {
                    if (reset) {
                        $ctrl.sessionOverviews = [];
                    }
                    if (!angular.isArray(data.sessions) || data.sessions.length < defaultPaginationSize) {
                        hasMoreResults = false;
                    } else {
                        paginationCursor = data.pagination[1];
                    }
                    if (angular.isArray(data.sessions)) {
                        $ctrl.sessionOverviews = $ctrl.sessionOverviews.concat(data.sessions);
                    }
                    if (!$ctrl.isSingleSession) {
                        $ctrl.loadedUserType = $ctrl.sessionsFilters.userType;
                    }
                }, angular.noop).finally(function () {
                    $ctrl.ongoingLoading = false;
                });
            }
        }
    });