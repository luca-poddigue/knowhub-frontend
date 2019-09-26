'use strict';

angular.module('knowhub')
    .component('payoutDetailsViewer', {
        bindings: {
            payoutDetails: '<'
        },
        templateUrl: 'sections/account/tab-profile/payout-details-viewer/payout-details-viewer.html',
        controller: function payoutDetailsViewerController($filter) {

            let $ctrl = this;

            $ctrl.$onInit = () => {
                $ctrl.formattedBirthDate = $filter('date')(moment($ctrl.payoutDetails.birthDate, "MM/DD/YYYY").toDate(), 'longDate')
            };

            $ctrl.showAddress = () => {
                return $ctrl.payoutDetails.address || $ctrl.payoutDetails.city || $ctrl.payoutDetails.state || $ctrl.payoutDetails.zipCode || $ctrl.payoutDetails.country;
            };

            $ctrl.showBankAccountDetails = () => {
                return $ctrl.payoutDetails.ibanLastFourDigits;
            };

            $ctrl.showInvoicing = () => {
                return $ctrl.payoutDetails.taxCode || $ctrl.payoutDetails.vatNumber;
            }
        }
    });