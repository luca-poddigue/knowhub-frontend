'use strict';

angular
    .module('knowhub')
    .factory('promoCodesService', function promoCodesFactory(userBasicInfoService, $exceptionHandler, $http, $location) {

        function getPromoList() {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'promoList'
            })
                .then(function (response) {
                    if (angular.isUndefined(response.data.promo)) {
                        response.data.promo = [];
                    }
                    return response.data;
                });
        }

        function activatePromoCode(code) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'promoCode',
                data: {
                    code: code
                }
            })
                .then(function (response) {
                    return response.data;
                });
        }

        function userHasPromoCategory(promoCategory) {
            let i;
            let userActivePromo = userBasicInfoService.basicInfo().activePromo;
            if (!angular.isArray(userActivePromo)) {
                return false;
            }
            for (i = 0; i<userActivePromo.length; i++) {
                let promo = userActivePromo[i];
                if (promo.contains(promoCategory)) {
                    return true;
                }
            }
            return false;
        }

        return {
            activatePromoCode: function (code) {
                return activatePromoCode(code);
            },
            getPromoList: function () {
                return getPromoList();
            },
            userHasPromoCategory: function(promoCategory) {
                return userHasPromoCategory(promoCategory);
            }
        };

    });