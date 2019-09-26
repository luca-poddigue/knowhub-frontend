'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/searchExpert', {
            template: '<search-page></search-page>',
            reloadOnSearch: false
        });
    })

    .component('searchPage', {
        templateUrl: 'sections/search/search.html',
        controller: function searchController(userBasicInfoService, userRole, routingService, $location,
                                              searchService, $scope, spinnerService, applicationName,
                                              skillProficiencyLevels, defaultPaginationSize) {

            let $ctrl = this;
            let ongoingLoading;
            let hasMoreResults;

            $ctrl.$onInit = function () {
                ongoingLoading = false;
                hasMoreResults = true;
                $ctrl.bookmarkedExpertOverviewsData = {};
                $ctrl.expertOverviewsData = {};
                $ctrl.canRequestSessions = canRequestSessions;
                $ctrl.applicationName = applicationName;
                $ctrl.isAppReady = spinnerService.isAppReady;
                $ctrl.modes = {
                    search: 'search',
                    bookmarks: 'bookmarks'
                };
                $ctrl.skillProficiencyLevels = skillProficiencyLevels;
                $ctrl.weeklySessionsLimitReached = false;
                $ctrl.pendingFeedbacks = false;

                resetSearch();
                if ($location.search().expert) {
                    $ctrl.searchParams.expertId = $location.search().expert;
                    _loadOverviews(searchService.searchExperts, $ctrl.expertOverviewsData, true);
                }


                searchService.getSkillTags().then(function (skillTags) {
                    $ctrl.skillTags = skillTags;
                }, angular.noop);

                canRequestSessions();

                routingService.setupPageModes($scope, 'search', $ctrl.modes.search, function () {
                    $ctrl.bookmarkedExpertOverviews = null;
                    hasMoreResults = true;
                    if ($location.search().mode === $ctrl.modes.bookmarks) {
                        _loadOverviews(searchService.getBookmarkedExperts, $ctrl.bookmarkedExpertOverviewsData, true);
                    }
                });
            };

            $ctrl.onTagSelect = function ($event) {
                $ctrl.searchParams.skills = $event.allSelected;
            };

            $ctrl.resetSearch = function () {
                resetSearch();
            };

            $ctrl.newSearch = function () {
                delete $ctrl.searchParams.expertId;

                // track search action on Facebook
                fbq('track', 'Search');

                return _loadOverviews(searchService.searchExperts, $ctrl.expertOverviewsData, true);
            };

            $ctrl.searchMore = function () {
                if ($ctrl.mode === $ctrl.modes.search) {
                    _loadOverviews(searchService.searchExperts, $ctrl.expertOverviewsData, false);
                }
            };

            $ctrl.toggleFilterByReputation = function () {
                $ctrl.searchParams.filterByReputation = !$ctrl.searchParams.filterByReputation;
                if ($ctrl.searchParams.filterByReputation) {
                    $ctrl.searchParams.discoveryMode = false;
                }
            };

            $ctrl.toggleDiscoveryMode = function () {
                $ctrl.searchParams.discoveryMode = !$ctrl.searchParams.discoveryMode;
                if ($ctrl.searchParams.discoveryMode) {
                    $ctrl.searchParams.filterByReputation = false;
                }
            };

            $ctrl.loadMoreBookmarks = function () {
                if ($ctrl.mode === $ctrl.modes.bookmarks) {
                    _loadOverviews(searchService.getBookmarkedExperts, $ctrl.bookmarkedExpertOverviewsData, false);
                }
            };

            function canRequestSessions() {
                searchService.canRequestSessions().then(function (response) {
                    $ctrl.pendingFeedbacks = response.data.pendingFeedbacks;
                    $ctrl.weeklySessionsLimitReached = response.data.weeklyRequestsReached;
                }, angular.noop);
            }

            function _loadOverviews(api, overviewsData, reset) {
                if (ongoingLoading) {
                    return;
                }
                if (!reset && !overviewsData.hasMoreResults) {
                    return;
                }
                ongoingLoading = true;
                if (reset) {
                    overviewsData.paginationCursor = null;
                }
                return api($ctrl.searchParams, overviewsData.paginationCursor).then(function (response) {
                    let overviews = response.data.overviews;
                    if (!overviews || overviews.length < defaultPaginationSize) {
                        overviewsData.hasMoreResults = false;
                    } else {
                        overviewsData.paginationCursor = response.data.pagination[1];
                    }
                    if (!overviewsData.overviews || reset) {
                        overviewsData.overviews = [];
                    }
                    if (overviews && overviews.length) {
                        overviewsData.overviews = overviewsData.overviews.concat(overviews);
                    }

                }, angular.noop).finally(function () {
                    ongoingLoading = false;
                });
            }

            function resetSearch() {
                $ctrl.searchParams = {
                    reputation: 10,
                    averagePrice: 0,
                    availability: [],
                    filterByReputation: false,
                    filterByAveragePrice: false,
                    discoveryMode: false
                };
                if ($ctrl.searchForm) {
                    $ctrl.searchForm.reputation.$setUntouched();
                    $ctrl.searchForm.skills.$setUntouched();
                    $ctrl.searchForm.averagePrice.$setUntouched();
                    $ctrl.searchForm.language.$setUntouched();
                    $ctrl.searchForm.availability.$setUntouched();
                    $ctrl.searchForm.discoveryMode.$setUntouched();
                }
                $ctrl.expertOverviewsData.overviews = null;
            }
        }
    });
