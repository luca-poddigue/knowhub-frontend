'use strict';

angular.module('knowhub')
    .component('unallowedCountryAlert', {
        templateUrl: 'common/components/unallowed-country-alert/unallowed-country-alert.html',
        bindings: {
            messageKey: '@',
        },
        controller: function unallowedCountryAlertController(userService, $filter) {

            let $ctrl = this;
            let translate;

            $ctrl.$onInit = function () {
                translate = $filter('translate');
                $ctrl.requestOriginCountry = userService.basicInfo().requestOriginCountry;

                $ctrl.message = translate($ctrl.messageKey);

                let countryKey = 'COUNTRY_' + $ctrl.requestOriginCountry.countryCode;
                let country = translate(countryKey);
                if (country === countryKey) {
                    $ctrl.message = $ctrl.message.replace('%country%', '');
                } else {
                    $ctrl.message = $ctrl.message.replace('%country%', '(' + country + ')');
                }

            };
        }
    });
