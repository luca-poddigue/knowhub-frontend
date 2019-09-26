'use strict';

angular.module("knowhub").decorator(
    "$uibModal",
    function uibModalDecorator($delegate, $rootScope) {

        let oldOpen = $delegate.open;
        let modalInstance;

        $rootScope.$on("$locationChangeStart", function() {
            if (modalInstance && !modalInstance.khIgnoreDismissOnLocationChange) {
                modalInstance.dismiss();
            }
        });

        $delegate.open = function(modalOptions) {
            modalInstance = oldOpen(modalOptions);
            return modalInstance;
        };

        return $delegate;
    }
);