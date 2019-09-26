'use strict';

angular.module('knowhub').controller('invoiceConfigModal', function ($scope, spinnerService, $uibModal, $q, userBasicInfoService, userAuthService, alertService, $uibModalInstance, sharingSessionWorkflowService, session, $window) {

    let $ctrl = this;
    let modalInstance;
    let receiptLink;
    let dateFolder;

    $ctrl.addingToSessionFiles = false;
    $ctrl.invoiceConfigData = {
        includeExpertAddress: true,
        includeSignature: true,
        signatureUrl: userBasicInfoService.basicInfo().signatureUrl
    };

    $scope.$on('modal.closing', function ($event) {
        if ($ctrl.addingToSessionFiles) {
            $event.preventDefault();
        }
    });

    $ctrl.addSessionReceiptToSessionFiles = function () {
        $ctrl.addingToSessionFiles = true;
        spinnerService.show("receipt-to-files-spinner");
        sharingSessionWorkflowService.addSessionReceiptToSessionFiles(dateFolder, session.id).then(function () {
            $ctrl.addingToSessionFiles = false;
            $uibModalInstance.close({
                reloadFiles: true
            });
        }, function (rejection) {
            $ctrl.addingToSessionFiles = false;
            if (['KH_ERR_4', 'KH_ERR_5'].contains(rejection.data.errorCode)) {
                $uibModalInstance.dismiss({
                    notAllowedAction: true
                });
            }
            return $q.reject(rejection);
        }).finally(function () {
            spinnerService.hide("receipt-to-files-spinner");
        });
    };

    $ctrl.expertAdressOptions = [{
        key: 'INVOICE_CONFIG_INCLUDE',
        activeClass: 'btn-primary',
        id: true
    },
        {
            key: 'INVOICE_CONFIG_EXCLUDE',
            activeClass: 'btn-primary',
            id: false
        }];
    $ctrl.receiptGenerated = false;

    $ctrl.removeSignature = function () {
        delete $ctrl.invoiceConfigData.signatureUrl;
        delete $ctrl.invoiceConfigData.signatureDataUrl;
    };

    $ctrl.showSignatureModal = function () {
        modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'sections/manage/signature-modal/signature-modal.html',
            controller: 'signatureModal',
            controllerAs: '$ctrl',
            windowClass: "signature-modal"
        });
        modalInstance.result.then(function (signatureDataUrl) {
            $ctrl.invoiceConfigData.signatureDataUrl = signatureDataUrl;
        }, angular.noop);
    };

    $ctrl.createSessionReceipt = function () {
        return sharingSessionWorkflowService.createSessionReceipt(session.id, $ctrl.invoiceConfigData).then(function (response) {
            $ctrl.receiptGenerated = true;
            receiptLink = response.link;
            dateFolder = response.dateFolder;
            userBasicInfoService.basicInfo().signatureUrl = response.signatureUrl;
        });
    };

    $ctrl.downloadFile = function () {
        $window.open(receiptLink + '?Authorization=' + userAuthService.getAuthToken(), '_self', '');
    };

    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.close = function () {
        $uibModalInstance.close();
    };

});