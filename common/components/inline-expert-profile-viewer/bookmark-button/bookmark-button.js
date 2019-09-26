'use strict';

angular.module('knowhub')
    .component('bookmarkButton', {
        bindings: {
            expertId: '<'
        },
        templateUrl: 'common/components/inline-expert-profile-viewer/bookmark-button/bookmark-button.html',
        controller: function bookmarkButtonController(searchService, alertService) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.processing = false;
                $ctrl.mouseOver = false;
                $ctrl.bookmarked = function () {
                    return searchService.isExpertBookmarked($ctrl.expertId);
                };
            };

            $ctrl.toggleBookmark = function () {
                if ($ctrl.processing) {
                    return;
                }
                $ctrl.processing = true;
                if ($ctrl.bookmarked()) {
                    searchService.unbookmarkExpert($ctrl.expertId).then(angular.noop, angular.noop).then(function() {
                        alertService.displayAlert('EXPERT_UNBOOKMARKED', null, 'SUCCESS');
                    }).finally(function () {
                        $ctrl.processing = false;
                    });
                } else {
                    searchService.bookmarkExpert($ctrl.expertId).then(angular.noop, angular.noop).then(function() {
                        alertService.displayAlert('EXPERT_BOOKMARKED', null, 'SUCCESS');
                    }).finally(function () {
                        $ctrl.processing = false;
                    });
                }
            };

        }
    });