'use strict';

angular.module('knowhub')

    .config(function ($routeProvider) {
        $routeProvider.when('/guide', {
            template: '<guide-page></guide-page>',
            reloadOnSearch: false
        });
    })

    .component('guidePage', {
        templateUrl: 'sections/guide/guide.html',
        controller: function guideController(routingService, $scope, $location, $translatePartialLoader, localStorageService, userAuthService, userType, spinnerService, applicationName, userBasicInfoService) {

            let $ctrl = this;
            const italianLocale = 'it_it';

            $ctrl.$onInit = function () {
                $ctrl.applicationName = applicationName;
                $ctrl.isAppReady = spinnerService.isAppReady;
                $translatePartialLoader.addPart('guide');

                $ctrl.userType = userType;
                $ctrl.userIsSignedIn = userAuthService.isSignedIn();
                $ctrl.status = 'reading';
                $ctrl.evaluation = null;

                routingService.setupPageModes($scope, 'guide', userType.seeker);

                checkIfIsQuestionnaire();
                $scope.$on('$locationChangeSuccess', function () {
                    checkIfIsQuestionnaire();
                });
            };

            $ctrl.userHasItalianLocale = function () {
                return userBasicInfoService.basicInfo().locale === italianLocale;
            };

            $ctrl.showQuestionnaire = function () {
                $ctrl.status = 'questionnaire';
            };

            $ctrl.returnToTermsOfService = function () {
                $ctrl.status = 'reading';
                $ctrl.evaluation = null;
            };

            $ctrl.onEvaluateQuestionnaire = function ($event) {
                $ctrl.evaluation = $event.evaluation;
            };

            $ctrl.proceed = function () {
                if ($ctrl.mode === userType.seeker) {
                    $location.urlWithReplace('/readyToGo');
                } else {
                    $location.urlWithReplace('/account').search('mode', 'profile').hash('expert-profile');
                }
            };

            function checkIfIsQuestionnaire() {
                if ($location.search().questionnaire) {
                    $translatePartialLoader.addPart('tos-questions');
                    $ctrl.isForQuestionnaire = true;
                } else {
                    $ctrl.isForQuestionnaire = false;
                }
            }
        }
    });
