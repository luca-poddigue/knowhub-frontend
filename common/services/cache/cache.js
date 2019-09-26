'use strict';

angular
    .module('knowhub')
    .factory('cacheService', function cacheFactory($rootScope, $cacheFactory, $log, browserUtilsService, alertService) {

        let $httpCache = $cacheFactory.get('$http');
        let put = $httpCache.put;
        let get = $httpCache.get;
        let remove = $httpCache.remove;
        let dropKeyRegex = /[?&]?key=\w+/;
        let revMap = {/* rev-manifest-placeholder: filled during build - DO NOT REMOVE */};

        $httpCache.put = function (key, value) {
            key = key.replace(dropKeyRegex, '');
            return put(key, value);
        };
        $httpCache.get = function (key) {
            key = key.replace(dropKeyRegex, '');
            return get(key);
        };
        $httpCache.remove = function (key) {
            key = key.replace(dropKeyRegex, '');
            return remove(key);
        };

        function setCache(key, data, cacheName) {
            let cache = cacheName ? $cacheFactory.get(cacheName) : $httpCache;
            if (cache.get(key)) {
                cache.get(key)[1] = data;
            }
        }

        function getCache(key, cacheName) {
            let cache = cacheName ? $cacheFactory.get(cacheName) : $httpCache;
            return cache.get(key) ? angular.fromJson(cache.get(key)[1]) : null;
        }

        function clearCacheResource(key, cacheName) {
            let cache = cacheName ? $cacheFactory.get(cacheName) : $httpCache;
            cache.remove(key);
        }

        function clearCache(cacheName) {
            let cache = cacheName ? $cacheFactory.get(cacheName) : $httpCache;
            cache.removeAll();
        }

        function getRevUrl(url) {
            if (url.startsWith('/')) {
                url = url.substring(1);
            }
            return revMap[url] || url;
        }

        function registerCacheServiceWorker() {
            if (browserUtilsService.isServiceWorkerSupported()) {
                navigator.serviceWorker.register('cache-sw.js').then(function (reg) {
                    reg.onupdatefound = function () {
                        let installingWorker = reg.installing;
                        installingWorker.onstatechange = function () {
                            switch (installingWorker.state) {
                                case 'installed':
                                    if (navigator.serviceWorker.controller) {
                                        $rootScope.$evalAsync(function () {
                                            alertService.displayAlert('SW_NEW_CONTENT_AVAILABLE', null, 'INFO', false, [{
                                                titleKey: "ALERT_VIEWER_REFRESH",
                                                target: function () {
                                                    location.reload();
                                                },
                                                icon: "refresh"
                                            }]);
                                        });
                                    }
                                    break;
                                case 'redundant':
                                    $log.error('The installing cache service worker became redundant.');
                                    break;
                            }
                        };
                    };
                }).catch(function (e) {
                    $log.error('Error during service worker registration:', e);
                });
            }
        }


        return {
            registerCacheServiceWorker: function () {
                return registerCacheServiceWorker();
            },
            setCache: function (key, data, cacheName) {
                return setCache(key, data, cacheName);
            },
            getCache: function (key, cacheName) {
                return getCache(key, cacheName);
            },
            clearCacheResource: function (key, cacheName) {
                return clearCacheResource(key, cacheName);
            },
            clearCache: function (cacheName) {
                return clearCache(cacheName);
            },
            getRevUrl: function (url) {
                return getRevUrl(url);
            }
        };

    });