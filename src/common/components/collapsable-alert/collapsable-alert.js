'use strict';

angular.module('knowhub')
    .component('collapsableAlert', {
        transclude: {
            title: 'alertTitle',
            content: 'alertContent'
        },
        bindings: {
            name: '@'
        },
        templateUrl: 'common/components/collapsable-alert/collapsable-alert.html',
        controller: function oneTimeAlertController(localStorageService) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                let collapsed = localStorageService.get('alertCollapsed.' + $ctrl.name);
                $ctrl.collapsed = collapsed !== null ? collapsed : false;
            };

            $ctrl.toggleCollapse = function () {
                $ctrl.collapsed = !$ctrl.collapsed;
                localStorageService.set('alertCollapsed.' + $ctrl.name, $ctrl.collapsed);
            };

        }
    });