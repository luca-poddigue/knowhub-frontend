'use strict';

angular.module('knowhub')
    .component('infoPoint', {
        bindings: {
            placement: '@?',
            messageKey: '@',
            appendToBody: '<?'
        },
        templateUrl: 'common/components/info-point/info-point.html',
        controller: function infoPointController($window, $sce, $filter, $timeout, $uibModal, $rootScope) {

            let $ctrl = this;
            let translate;
            let hidePopoverTimeout;
            let modalInstance;
            let unscribeTranslationListener;

            $ctrl.$onInit = function () {
                if (angular.isUndefined($ctrl.appendToBody)) {
                    $ctrl.appendToBody = true;
                }
                $ctrl.popoverOpen = false;
                $ctrl.showModal = false;
                translate = $filter('translate');
                $ctrl.message = $sce.trustAsHtml(translate($ctrl.messageKey));
                unscribeTranslationListener = $rootScope.$on('$translateChangeSuccess', function () {
                    $ctrl.message = $sce.trustAsHtml(translate($ctrl.messageKey));
                });
                if (!$ctrl.placement) {
                    $ctrl.placement = 'top-left';
                }
                angular.element($window).bind("resize", function () {
                    if (modalInstance) {
                        modalInstance.dismiss();
                    }
                    $ctrl.hidePopover();
                });
            };

            $ctrl.$onDestroy = function () {
                unscribeTranslationListener();
            };

            $ctrl.showInfoModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/components/info-point/info-modal/info-modal.html',
                    controller: 'infoModal',
                    controllerAs: '$ctrl',
                    size: 'sm',
                    resolve: {
                        messageKey: function () {
                            return $ctrl.messageKey;
                        }
                    }
                });
                modalInstance.result.then(angular.noop, angular.noop);
            };

            $ctrl.showPopover = function () {
                if (hidePopoverTimeout) {
                    $timeout.cancel(hidePopoverTimeout);
                }
                $ctrl.popoverOpen = true;
            };

            $ctrl.hidePopover = function (delay) {
                if (delay) {
                    hidePopoverTimeout = $timeout(function () {
                        $ctrl.popoverOpen = false;
                    }, 100);
                } else {
                    $ctrl.popoverOpen = false;
                }
            };
        }

    });