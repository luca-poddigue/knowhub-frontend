'use strict';

angular.module('knowhub').controller('sessionPriceModal', function ($uibModalInstance, promoCodesService, defaultSessionPrice, browserUtilsService, userService, sharingSessionWorkflowService, $q, $scope, session, liveNotificationType) {
    let $ctrl = this;

    let oldPrice = Number(session.price);
    $ctrl.currentSessionPriceLimit = Number(userService.basicInfo().sessionPriceLimit.limit);
    $ctrl.isSessionPriceLimitIncreasePending = angular.isDefined(userService.basicInfo().sessionPriceLimit.requestedLimit);
    $ctrl.newPrice = Number(session.price) || defaultSessionPrice;
    $ctrl.defaultSessionPrice = defaultSessionPrice;
    $ctrl.showNoServiceCostsAlert = promoCodesService.userHasPromoCategory('NO_SERVICE_COSTS');

    $scope.$on('liveNotifications:message', function (event, data) {
        if ([liveNotificationType.sessionPriceLimitIncreaseApproved,
            liveNotificationType.sessionPriceLimitIncreaseRejected].contains(data.type)) {
            $ctrl.currentSessionPriceLimit = Number(userService.basicInfo().sessionPriceLimit.limit);
            $ctrl.isSessionPriceLimitIncreasePending = false;
        }
    });

    $ctrl.onPriceChange = function (newPrice, oldPrice) {
        if (!$ctrl.newPrice) {
            $ctrl.newPrice = defaultSessionPrice;
        } else if (Number(newPrice) < defaultSessionPrice) {
            $ctrl.newPrice = oldPrice;
        } else {
            $ctrl.newPrice = Number(newPrice);
        }
    };

    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.onKeyPress = function ($event) {
        if (!browserUtilsService.isValidNumericKey($event.key)) {
            $event.preventDefault();
        }
    };

    $ctrl.updateSessionPrice = function () {
        if ($ctrl.newPrice === oldPrice) {
            $uibModalInstance.dismiss();
            return $q.resolve();
        } else {
            return sharingSessionWorkflowService.updateSession(session.id, $ctrl.newPrice, session.timeSpan).then(function (sessionUpdate) {
                $uibModalInstance.close(sessionUpdate.data);
            }, function (rejection) {
                if (angular.isObject(rejection) && angular.isObject(rejection.data) && rejection.data.errorCode && ['KH_ERR_4', 'KH_ERR_5'].contains(rejection.data.errorCode)) {
                    $uibModalInstance.dismiss({
                        notAllowedAction: true
                    });
                }
            });
        }
    };

});