'use strict';

angular.module('knowhub')
    .component('spinner', {
        templateUrl: 'common/components/spinner/spinner.html',
        bindings: {
            name: '@'
        },
        controller: function spinnerController(spinnerService, $rootScope) {

            let $ctrl = this;
            let unscribeLocationChange;

            $ctrl.$onInit = function () {

                $ctrl.showCount = spinnerService.getPendingCount($ctrl.name) || 0;

                unscribeLocationChange = $rootScope.$on('$routeChangeSuccess', function () {
                    $ctrl.showCount = 0;
                });

                // Declare a mini-API to hand off to our service so the
                // service doesn't have a direct reference to this
                // directive's scope.
                let api = {
                    name: $ctrl.name,
                    getShowCount: function () {
                        return $ctrl.showCount;
                    },
                    show: function (count) {
                        if (angular.isNumber(count)) {
                            $ctrl.showCount = count;
                        } else {
                            $ctrl.showCount++;
                        }
                    },
                    hide: function (force) {
                        if (!force && $ctrl.showCount > 0) {
                            $ctrl.showCount--;
                        } else {
                            $ctrl.showCount = 0;
                        }
                    }
                };

                spinnerService.register(api);
            };

            $ctrl.$onDestroy = function () {
                spinnerService.unregister($ctrl.name);
                unscribeLocationChange();
            };

        }
    });