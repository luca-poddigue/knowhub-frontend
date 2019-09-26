"use strict";

angular
    .module('knowhub').factory('spinnerService', function ($anchorScroll, $exceptionHandler, $rootScope, $timeout, $location, $window, $q) {

    let spinners = {};
    let pendingSpinnersCounts = {};
    let isAppReady = false;
    let willBeReady = false;
    let t;
    let previousUrl;

    $rootScope.$on('$locationChangeSuccess', function () {
        let url = $location.url().contains('#') ? $location.url().substring(0, $location.url().indexOf('#')) : $location.url();
        if (url === previousUrl) {
            previousUrl = url;
            return;
        }
        previousUrl = url;
        isAppReady = false;
    });

    $rootScope.$watch(function () {
        if (isAppReady) {
            return;
        }
        let globalCount = 0;
        angular.forEach(pendingSpinnersCounts, function (count) {
            globalCount += count;
        });
        angular.forEach(spinners, function (spinner) {
            globalCount += spinner.getShowCount();
        });
        if (globalCount === 0) {
            if (!willBeReady) {
                willBeReady = true;
                t = $timeout(function () {
                    isAppReady = true;
                    $rootScope.$broadcast("spinner:appReady");

                    // shame on me
                    $timeout(function () {
                        $timeout(function () {
                            $anchorScroll();
                        });
                    });

                    $window.loadingScreen.finish();
                    willBeReady = false;
                });
            }
        } else {
            if (t) {
                $timeout.cancel(t);
                willBeReady = false;
            }
        }
    });


    function register(data) {
        if (!data.hasOwnProperty('name')) {
            $exceptionHandler("Spinner must specify a name when registering with the spinner service.");
            return;
        }
        if (spinners.hasOwnProperty(data.name)) {
            $exceptionHandler("A spinner with the name '" + data.name + "' has already been registered.");
            return;
        }
        spinners[data.name] = data;
    }

    function unregister(name) {
        if (spinners.hasOwnProperty(name)) {
            delete spinners[name];
        }
    }

    function showPromise(name, promise, force) {
        show(name);
        promise.then(function (response) {
            hide(name, force);
            return response;
        }, function (rejection) {
            return $q.reject(rejection);
        });
    }

    function show(name) {
        let spinner = spinners[name];
        if (!spinner) {
            if (angular.isNumber(pendingSpinnersCounts[name])) {
                pendingSpinnersCounts[name]++;
            } else {
                pendingSpinnersCounts[name] = 1;
            }
            return;
        }
        spinner.show();
    }

    function hide(name, force) {
        let spinner = spinners[name];
        if (!spinner) {
            if (angular.isNumber(pendingSpinnersCounts[name])) {
                pendingSpinnersCounts[name]--;
            } else {
                pendingSpinnersCounts[name] = -1;
            }

        } else {
            spinner.hide(force);
        }
    }

    function getPendingCount(name) {
        let count = pendingSpinnersCounts[name];
        delete pendingSpinnersCounts[name];
        return count;
    }

    function setAppReady(appReady) {
        isAppReady = appReady;
    }


    return {
        register: function (data) {
            return register(data);
        },
        unregister: function (name) {
            return unregister(name);
        },
        showPromise: function (name, promise, force) {
            return showPromise(name, promise, force);
        },
        show: function (name) {
            return show(name);
        },
        hide: function (name, force) {
            return hide(name, force);
        },
        getPendingCount: function (name) {
            return getPendingCount(name);
        },
        isAppReady: function () {
            return isAppReady;
        },
        setAppReady: function (appReady) {
            return setAppReady(appReady);
        }
    };
});
