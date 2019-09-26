'use strict';

angular.module('knowhub').controller('promoVideoModal', function ($uibModalInstance, userBasicInfoService) {
    let $ctrl = this;
    const italianLocale = 'it_it';

    $ctrl.close = function () {
        $uibModalInstance.close();
    };

    $ctrl.userHasItalianLocale = function () {
        return userBasicInfoService.basicInfo().locale === italianLocale;
    };

});