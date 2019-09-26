'use strict';

angular.module('knowhub')
    .component('countryPicker', {
        bindings: {},
        require: {
            ngModel: ''
        },
        templateUrl: 'common/components/country-picker/country-picker.html',
        controller: function countryPickerController($timeout, $element, $rootScope, $scope, countries, $filter) {

            let $ctrl = this;
            let translate;
            let unscribeTranslationListener;

            $ctrl.$onInit = function () {
                translate = $filter('translate');
                initCountriesArray();
                unscribeTranslationListener = $rootScope.$on('$translateChangeSuccess', function () {
                    initCountriesArray();
                });

                $timeout(function () {
                    $element.find('input[type=search]').on('blur', function () {
                        $timeout(function () {
                            $ctrl.ngModel.$setTouched();
                        }, 100);
                    });
                });

                $ctrl.ngModel.$render = function () {
                    let i;
                    if ($ctrl.countries) {
                        for (i = 0; i < $ctrl.countries.length; i++) {
                            if ($ctrl.countries[i].code === $ctrl.ngModel.$viewValue) {
                                $ctrl.country = $ctrl.countries[i];
                            }
                        }
                    }
                };
            };

            $ctrl.$onDestroy = function () {
                unscribeTranslationListener();
            };

            $ctrl.onSelectCallback = function ($item) {
                $ctrl.ngModel.$setViewValue($item.code);
            };

            $ctrl.refreshChoices = function (search) {
                if (search.length >= 2) {
                    $ctrl.delayedSearch = search;
                } else {
                    $ctrl.delayedSearch = null;
                }
            };

            function initCountriesArray() {
                $ctrl.countries = [];
                angular.forEach(countries, function (countryCode) {
                    let countryObj = {
                        code: countryCode,
                        name: translate('COUNTRY_' + countryCode)
                    };
                    this.push(countryObj);
                    if ($ctrl.ngModel.$viewValue && $ctrl.ngModel.$viewValue === countryCode) {
                        $ctrl.country = countryObj;
                    }
                }, $ctrl.countries);
                $ctrl.countries = $filter('orderBy')($ctrl.countries, 'name');
            }

        }

    });