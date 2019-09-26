'use strict';

angular
    .module('knowhub')
    .factory('searchService', function searchFactory(spinnerService, $http, $location, defaultPaginationSize) {

        let loadingSkillTags = false;
        let skillTagsPromise;

        let bookmarkedExperts = null;
        _fetchBookmarkedExperts();
        _fetchSkillTags();

        function _fetchBookmarkedExperts() {
            $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'user/bookmark/ids'
            }).then(function (response) {
                bookmarkedExperts = {};
                angular.forEach(response.data.items, function (id) {
                    this[id] = true;
                }, bookmarkedExperts);
            });
        }

        function _fetchSkillTags() {
            loadingSkillTags = true;
            skillTagsPromise = $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'skillTags',
                cache: true
            }).then(function (response) {
                loadingSkillTags = false;
                return response.data.items;
            }, function () {
                loadingSkillTags = false;
            });
        }

        function searchExperts(searchParams, paginationOffset) {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'experts',
                params: _getSearchParams(searchParams, paginationOffset)
            });
        }

        function _getSearchParams(searchParams, paginationOffset) {
            let params = {};
            params.pagination = paginationOffset ? [defaultPaginationSize, paginationOffset] : defaultPaginationSize;
            params.availabilityRange = searchParams.availability;
            params.expertId = searchParams.expertId;
            if (searchParams.language) {
                params.language = searchParams.language;
            }
            if (searchParams.filterByReputation) {
                params.reputation = searchParams.reputation;
            }
            if (searchParams.filterByAveragePrice) {
                params.averagePrice = searchParams.averagePrice;
            }
            params.discoveryMode = searchParams.discoveryMode;
            if (angular.isArray(searchParams.skills)) {
                let skillsList = [];
                angular.forEach(searchParams.skills, function (skillObj) {
                    this.push(skillObj.tagName);
                }, skillsList);
                params.skills = skillsList;
            }
            return params;
        }

        function getSkillTags() {
            if (loadingSkillTags) {
                return skillTagsPromise;
            }
            _fetchSkillTags();
            return skillTagsPromise;
        }

        function isExpertBookmarked(expertId) {
            return bookmarkedExperts === null ? null : !!bookmarkedExperts[expertId];
        }

        function getBookmarkedExperts() {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'user/bookmarks',
                params: {
                    pagination: 10
                }
            });
        }

        function bookmarkExpert(expertId) {
            return $http({
                method: 'PUT',
                url: $location.apiBaseUrl() + 'user/bookmark/' + expertId
            }).then(function () {
                bookmarkedExperts[expertId] = true;
            });
        }

        function unbookmarkExpert(expertId) {
            return $http({
                method: 'DELETE',
                url: $location.apiBaseUrl() + 'user/bookmark/' + expertId
            }).then(function () {
                delete bookmarkedExperts[expertId];
            });
        }

        function canRequestSessions() {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'user/canRequestSessions'
            });
        }

        return {
            searchExperts: function (searchParams, paginationOffset) {
                return searchExperts(searchParams, paginationOffset);
            },
            getSkillTags: function () {
                return getSkillTags();
            },
            isExpertBookmarked: function (expertId) {
                return isExpertBookmarked(expertId);
            },
            getBookmarkedExperts: function () {
                return getBookmarkedExperts();
            },
            bookmarkExpert: function (expertId) {
                return bookmarkExpert(expertId);
            },
            unbookmarkExpert: function (expertId) {
                return unbookmarkExpert(expertId);
            },
            canRequestSessions: function () {
                return canRequestSessions();
            },
        };

    });