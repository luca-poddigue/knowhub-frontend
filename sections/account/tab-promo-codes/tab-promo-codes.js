'use strict';

angular.module('knowhub')
    .component('tabPromoCodes', {
        templateUrl: 'sections/account/tab-promo-codes/tab-promo-codes.html',
        controller: function tabPromoCodesController(spinnerService, alertService, promoCodesService, userBasicInfoService) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.isAppReady = spinnerService.isAppReady;

                promoCodesService.getPromoList().then(function(promoList) {
                    $ctrl.promoList = promoList;
                }, angular.noop);
            };

            $ctrl.activatePromoCode = function() {
                return promoCodesService.activatePromoCode($ctrl.promoCode.trim()).then(function(promo) {
                    $ctrl.promoList.promo.unshift(promo);

                    if (!userBasicInfoService.basicInfo().activePromo) {
                        userBasicInfoService.basicInfo().activePromo = [];
                    }
                    if (!userBasicInfoService.basicInfo().activePromo.contains(promo.type)) {
                        userBasicInfoService.basicInfo().activePromo.push(promo.type);
                    }

                    $ctrl.promoCodeForm.promoCode.$setUntouched();
                    delete $ctrl.promoCode;

                    alertService.displayAlert('PROMO_CODE_ACTIVATED', null, 'SUCCESS');

                    // generatore di promozioni
                    // implementare sconti
                }, angular.noop);
            }

        }
    });