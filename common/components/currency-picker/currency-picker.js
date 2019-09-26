'use strict';

angular.module('knowhub')
    .component('currencyPicker', {
        require: {
            ngModel: ''
        },
        templateUrl: 'common/components/currency-picker/currency-picker.html',
        controller: function currencyPickerController($scope, $timeout, $element, $rootScope, supportedLocales, locales, $filter) {

            let $ctrl = this;
            let translate;
            let unscribeTranslationListener;

            $ctrl.$onInit = function () {
                translate = $filter('translate');
                $ctrl.currencies = initCurrenciesArray();
                unscribeTranslationListener = $rootScope.$on('$translateChangeSuccess', function () {
                    $ctrl.currencies = initCurrenciesArray();
                });
                $timeout(function () {
                    $element.find('input[type=search]').on('blur', function () {
                        $scope.$evalAsync(function () {
                            $ctrl.ngModel.$setTouched();
                        });
                    });
                });
                $ctrl.ngModel.$render = function () {
                    $ctrl.currency = $ctrl.currencies[$ctrl.ngModel.$viewValue];
                };
            };


            $ctrl.$onDestroy = function () {
                unscribeTranslationListener();
            };

            $ctrl.onSelectCallback = function ($item) {
                $ctrl.ngModel.$setViewValue($item.key);
            };

            function initCurrenciesArray() {
                let currencies = {};
                angular.forEach(supportedLocales, function (localeCode) {
                    let currency = {};
                    currency.code = locales[localeCode].currency;
                    currency.name = translate('CURRENCY_' + currency.code);
                    currency.symbol = translate('CURRENCY_SYMBOL_' + currency.code);
                    this[currency.code] = currency;
                }, currencies);
                if ($ctrl.ngModel.$viewValue) {
                    $ctrl.currency = currencies[$ctrl.ngModel.$viewValue];
                }
                return currencies;
            }
        }

    });