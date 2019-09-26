'use strict';

angular.module('knowhub')
    .component('userMetricViewer', {
        bindings: {
            infoKey: '@?'
        },
        transclude: {
            'number': '?number',
            'meaning': 'meaning'
        },
        templateUrl: 'sections/manage/user-metric-viewer/user-metric-viewer.html',
        controller: function userMetricViewerController() {

            let $ctrl = this;

            $ctrl.$onInit = function () {
            };

        }
    });