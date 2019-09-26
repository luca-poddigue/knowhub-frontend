'use strict';

angular
    .module('knowhub')
    .factory('sharingSessionReportingService', function sharingSessionReportingFactory(defaultPaginationSize, chatPaginationSize, $http, $location) {

        let loadingSessionsFiltersData;
        let sessionsFiltersDataPromise;

        function getSessionChatMessages(sessionId, paginationCursor) {

            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'session/' + sessionId + '/chatMessages',
                params: {
                    pagination: paginationCursor ? [chatPaginationSize, paginationCursor] : chatPaginationSize
                }
            }).then(function (response) {
                return response.data;
            });
        }

        function getSessionDetails(sessionId) {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'session/' + sessionId + '/details'
            }).then(function (response) {
                return response.data;
            });
        }

        function getSessionFiles(sessionId) {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'session/' + sessionId + '/files'
            }).then(function (response) {
                return response.data.filesBucket;
            });
        }

        function getOverviewBoxesData() {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'user/overviewBoxes'
            }).then(function (response) {
                return response.data;
            });
        }


        function getTrendChartsData() {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'charts'
            }).then(function (response) {
                return response.data;
            });
        }

        function getSessions(paginationCursor, filters) {
            let params = angular.copy(filters);
            if (filters.otherUser) {
                delete params.otherUser;
                params.otherUserFirstName = filters.otherUser.firstName;
                params.otherUserLastName = filters.otherUser.lastName;
            }
            params.pagination = paginationCursor ? [defaultPaginationSize, paginationCursor] : defaultPaginationSize;
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'sessions',
                params: params
            }).then(function (response) {
                return response.data;
            });
        }

        function getSessionsFiltersData() {
            if (loadingSessionsFiltersData) {
                return sessionsFiltersDataPromise;
            }
            _fetchSessionsFiltersData();
            return sessionsFiltersDataPromise;
        }

        function getSingleSession(sessionId) {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'session/'+sessionId+'/overview'
            }).then(function (response) {
                return response.data;
            });
        }

        function _fetchSessionsFiltersData() {
            loadingSessionsFiltersData = true;
            sessionsFiltersDataPromise = $http({
                cache: true,
                url: $location.apiBaseUrl() + 'sessions/filtersData',
                method: 'GET'
            }).then(function (response) {
                loadingSessionsFiltersData = false;
                return response.data;
            }, function () {
                loadingSessionsFiltersData = false;
            });
        }

        return {
            getSessionChatMessages: function (sessionId, paginationCursor) {
                return getSessionChatMessages(sessionId, paginationCursor);
            },
            getSessionDetails: function (sessionId) {
                return getSessionDetails(sessionId);
            },
            getSessionFiles: function (sessionId) {
                return getSessionFiles(sessionId);
            },
            getTrendChartsData: function () {
                return getTrendChartsData();
            },
            getOverviewBoxesData: function () {
                return getOverviewBoxesData();
            },
            getSessions: function (paginationCursor, filters) {
                return getSessions(paginationCursor, filters);
            },
            getSessionsFiltersData: function() {
                return getSessionsFiltersData();
            },
            getSingleSession: function (sessionId) {
                return getSingleSession(sessionId);
            }
        };

    });
