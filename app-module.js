angular.module('knowhub', [
    'updateMeta',
    'ngSanitize',
    'ngRoute',
    'pascalprecht.translate',
    'ngCookies',
    'LocalStorageModule',
    'angular-google-analytics',
    'tmh.dynamicLocale',
    'ui.select',
    'ngFileUpload',
    'ngNumberPicker',
    'ui.bootstrap',
    'ngMessages',
    'ngAnimate',
    'ngTouch'
])
    .config(function ($routeProvider, $translateProvider, $locationProvider,
                      $compileProvider, $httpProvider, localStorageServiceProvider,
                      appPrefix, AnalyticsProvider, tmhDynamicLocaleProvider, supportedLocales, fallbackLocales, analyticsTrackingId, appEnv, appEnvs, firebaseConfig) {

        firebase.initializeApp(firebaseConfig);

        showdown.setOption('noHeaderId', false);
        showdown.setOption('tables', true);
        showdown.setOption('ghCompatibleHeaderId', true);

        $translateProvider.determinePreferredLanguage();
        if (!supportedLocales.contains($translateProvider.preferredLanguage())) {
            let fallbackLocaleFound = false;
            for (let prefix in fallbackLocales) {
                if (fallbackLocales.hasOwnProperty(prefix) && $translateProvider.preferredLanguage().contains(prefix)) {
                    $translateProvider.preferredLanguage(fallbackLocales[prefix]);
                    fallbackLocaleFound = true;
                    break;
                }
            }
            if (!fallbackLocaleFound) {
                $translateProvider.preferredLanguage('en_us');
            }
        }
        $translateProvider.useMissingTranslationHandler('missingTranslationService');

        $httpProvider.useApplyAsync(true);
        $httpProvider.defaults.headers.get = {'If-Modified-Since': 'Mon, 26 Jul 1997 05:00:00 GMT'};

        $httpProvider.interceptors.push('payloadCleanupInterceptor');
        $httpProvider.interceptors.push('httpExceptionInterceptor');
        $httpProvider.interceptors.push('spinnerInterceptor');
        $httpProvider.interceptors.push('authInterceptor');
        $httpProvider.interceptors.push('revMapperInterceptor');

        $locationProvider.html5Mode(true);

        $routeProvider.otherwise({
            redirectTo: 'home',
            reloadOnSearch: false
        });

        if (appEnv === appEnvs.prod) {
            $compileProvider.debugInfoEnabled(false);
        }
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|skype):/);

        $translateProvider.useLoader('$translatePartialLoader', {
            urlTemplate: 'i18n/{part}/{lang}.json'
        })
            .useSanitizeValueStrategy('sanitizeParameters')
            .useLoaderCache(true);

        localStorageServiceProvider
            .setPrefix(appPrefix);

        AnalyticsProvider.setAccount(analyticsTrackingId);
        AnalyticsProvider.setDomainName(window.location.host);
        AnalyticsProvider.delayScriptTag(true);

        tmhDynamicLocaleProvider.localeLocationPattern('i18n/angular-locales/angular-locale_{{locale.toLowerCase().replace("_", "-")}}.js');
    })
    .run(function (uibButtonConfig, userService, userAuthService, $cookies, $location, $rootScope, $translate, routingService, alertService, $window, $translatePartialLoader, $route, $anchorScroll, $interval, spinnerService, $timeout, $q, liveNotificationsService, profilingService, localStorageService, $http, cacheService, appEnv, appEnvs) {

        if (localStorageService.get('cookiesAccepted')) {
            profilingService.initProfilingServices();
        }

        uibButtonConfig.activeClass = 'btn-primary';

        if (appEnv !== appEnvs.dev) {
            cacheService.registerCacheServiceWorker();
        }

        // hack to avoid circular dependencies injecting liveNotificationService in httpException interceptor
        liveNotificationsService.setHttpService($http);

        // fonts preloading
        spinnerService.show('general-spinner');
        $q.all(new FontFaceObserver('LatoLatinWeb').load(),
            new FontFaceObserver('LatoLatinWeb', {
                weight: 'bold'
            }).load(),
            new FontFaceObserver('LatoLatinWeb', {
                style: 'italic'
            }).load(),
            new FontFaceObserver('FontAwesome').load()
        ).then(function () {
            spinnerService.hide('general-spinner');
        }, function () {
            spinnerService.hide('general-spinner');
        });

        if ($window._khIsObsoleteBrowser) {
            alertService.displayAlert('OBSOLETE_BROWSER', null, 'WARNING');
        }

        $anchorScroll.yOffset = 90;

        $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
            $translate.refresh();
        });

        spinnerService.show('general-spinner');
        // first initialization, to parse hash and process access token
        userAuthService.initAuthWidget(false).then(angular.noop, function () {
            $location.urlWithReplace('/home');
            $timeout(function () {
                alertService.displayAlert('AUTH_ERROR', null, 'DANGER');
            });
        }).finally(function () {
            return userService.loadBasicInfo();
        }).finally(function () {
            if (userAuthService.isSignedIn() && userService.basicInfo().status) {
                userService.alignDynamicProperties();
                liveNotificationsService.initMessaging(true);
            }

            $rootScope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
                let newUrlHashIdx = newUrl.lastIndexOf('#');
                if (newUrlHashIdx !== -1) {
                    newUrl = newUrl.substring(0, newUrlHashIdx);
                }
                let oldUrlHashIdx = oldUrl.lastIndexOf('#');
                if (oldUrlHashIdx !== -1) {
                    oldUrl = oldUrl.substring(0, oldUrlHashIdx);
                }
                if (newUrl !== oldUrl) {
                    doRedirect(event);
                }
            });
            doRedirect();

            $timeout(function () {
                $translatePartialLoader.addPart('common');
                $translatePartialLoader.addPart('alerts');
                $translatePartialLoader.addPart('countries');
                $translatePartialLoader.addPart('currencies');
                $translatePartialLoader.addPart('logs');
            }, 0);
            spinnerService.hide('general-spinner');
        });

        function doRedirect(event) {
            routingService.redirect(userAuthService.isSignedIn(), userService.basicInfo().status, $location.url() || '/', event);
        }
    });
