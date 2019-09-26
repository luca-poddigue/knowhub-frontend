'use strict';

angular.module('knowhub')
    .component('localePicker', {
        require: {
            ngModel: ''
        },
        bindings: {
            iconOnly: '<'
        },
        templateUrl: 'common/components/locale-picker/locale-picker.html',
        controller: function localePickerController($scope, supportedLocales, userService, locales) {
            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.supportedLocales = supportedLocales;
                $ctrl.changeLocale = function () {
                    userService.locale($ctrl.locale);
                };
                // Assigning a custom locale with ng-model is not supported. Locale is always taken from the userService.
                $scope.$watch(function () {
                    return userService.locale();
                }, function (newLocale) {
                    if (newLocale) {
                        $scope.$evalAsync(function () {
                            $ctrl.locale = newLocale;
                            $ctrl.ngModel.$setViewValue(newLocale);
                        });
                    }
                });
            };

            $ctrl.formatLocaleString = function (locale) {
                let localeStr = "";
                if (locale) {
                    localeStr = locales[locale].language.nativeName;
                    if (angular.isDefined(locales[locale].country)) {
                        localeStr += " (" + locales[locale].country.nativeName + ")";
                    }
                }
                return localeStr;
            };

            $ctrl.getCountryCode = function (locale) {
                if (locale && locales[locale].country) {
                    return locales[locale].country.code;
                } else {
                    return "";
                }
            };

        }
    });