'use strict';

angular.module('knowhub').directive('ngScroll', function ($document, $window, $exceptionHandler, $interval) {

    let PAGE_PREVENTIVE_TRIGGER_OFFSET = 1000;
    let INTERVAL_DELAY = 100;
    let INTERVAL_COUNT = 50;

    return {
        restrict: 'A',
        scope: {
            ngScroll: '&',
            ngScrollMode: '@', //page, element
            ngScrollTriggeringSide: '@?' //bottom, top
        },
        link: function (scope, element) {
            let interval;

            if (!scope.ngScrollTriggeringSide) {
                scope.ngScrollTriggeringSide = 'bottom';
            }
            switch (scope.ngScrollMode) {
                case 'page':
                    angular.element($window).on('scroll', managePageScroll);
                    angular.element($window).on('touchmove', onScrollInterval(managePageScroll));
                    angular.element($window).on('touchstart', onScrollInterval(managePageScroll));
                    break;
                case 'element':
                    let raw = element[0];
                    element.on('scroll', () => manageElementScroll(raw));
                    element.on('touchmove', onScrollInterval(() => manageElementScroll(raw)));
                    element.on('touchstart', onScrollInterval(() => manageElementScroll(raw)));
                    break;
                default:
                    $exceptionHandler(new Error("Invalid mode: " + scope.ngScrollMode));
                    return;
            }

            function onScrollInterval(callbackFn) {
                return function () {
                    if (interval) {
                        $interval.cancel(interval);
                    }
                    interval = $interval(function () {
                        callbackFn();
                    }, INTERVAL_DELAY, INTERVAL_COUNT);
                }
            }

            function managePageScroll() {
                switch (scope.ngScrollTriggeringSide) {
                    case 'bottom':
                        let windowHeight = "innerHeight" in $window ? $window.innerHeight : $document[0].documentElement.offsetHeight;
                        let body = $document[0].body;
                        let html = $document[0].documentElement;
                        let docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
                        let windowBottom = windowHeight + $window.pageYOffset;
                        if (windowBottom >= docHeight - PAGE_PREVENTIVE_TRIGGER_OFFSET) {
                            scope.ngScroll();
                        }
                        break;
                    case 'top':
                        if ($window.pageYOffset === 0) {
                            scope.ngScroll();
                        }
                        break;
                    default:
                        $exceptionHandler(new Error("Invalid trigger side: " + scope.ngScrollTriggeringSide));
                        return;
                }
            }

            function manageElementScroll(raw) {
                switch (scope.ngScrollTriggeringSide) {
                    case 'bottom':
                        if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                            scope.ngScroll();
                        }
                        break;
                    case 'top':
                        if (raw.scrollTop === 0) {
                            scope.ngScroll();
                        }
                        break;
                    default:
                        $exceptionHandler(new Error("Invalid trigger side: " + scope.ngScrollTriggeringSide));
                        return;
                }
            }

            scope.$on('$destroy', function () {
                switch (scope.ngScrollMode) {
                    case 'page':
                        angular.element($window).off('scroll');
                        angular.element($window).off('touchmove');
                        angular.element($window).off('touchstart');
                        break;
                    case 'element':
                        element.off("scroll");
                        element.off("touchmove");
                        element.off("touchstart");
                }
            });
        }
    };

});
