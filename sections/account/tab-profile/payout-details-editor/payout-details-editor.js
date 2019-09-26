'use strict';

angular.module('knowhub')
    .component('payoutDetailsEditor', {
        bindings: {
            onSave: '&',
            onCancel: '&',
            payoutDetails: '<',
            userFullName: '@',
            expertCountry: '@'
        },
        templateUrl: 'sections/account/tab-profile/payout-details-editor/payout-details-editor.html',
        controller: function payoutDetailsEditorController($filter, filesService, supportedCountries, alertService, $q, stripeService, platformCountry, defaultCurrency, $scope, $uibModal, spinnerService, userService, $timeout, $anchorScroll) {

            const $ctrl = this;
            let iban;
            let emptyIban;

            $ctrl.$onInit = function () {

                $ctrl.formattedBirthDate = $filter('date')(moment($ctrl.payoutDetails.birthDate, "MM/DD/YYYY").toDate(), 'longDate');

                emptyIban = true;
                $ctrl.mustDefineIban = !$ctrl.payoutDetails.ibanLastFourDigits;
                if ($ctrl.mustDefineIban) {
                    $ctrl.ibanFieldError = 'empty';
                }
                $ctrl.ibanFieldTouched = false;

                $ctrl.expertHasVatNumberOptions = [{
                    key: 'COMMON_NO',
                    activeClass: 'btn-primary',
                    id: false
                },
                    {
                        key: 'COMMON_YES',
                        activeClass: 'btn-primary',
                        id: true
                    }];
                $ctrl.expertHasVatNumber = !!$ctrl.payoutDetails.vatNumber;

                $ctrl.receiverOptions = [{
                    key: 'EXPERT_PROFILE_CODICE_DESTINATARIO',
                    activeClass: 'btn-primary',
                    id: 'codiceDestinatario'
                },
                    {
                        key: 'EXPERT_PROFILE_PEC_ADDRESS',
                        activeClass: 'btn-primary',
                        id: 'pecAddress'
                    }];
                if ($ctrl.payoutDetails.pecAddress) {
                    $ctrl.receiver = 'pecAddress';
                } else {
                    $ctrl.receiver = 'codiceDestinatario';
                }

                $ctrl.birthDatePopup = {
                    opened: false
                };

                let today = new Date();
                $ctrl.birthDatePickerOptions = {
                    maxDate: new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()),
                    minDate: new Date(1900, 1, 1),
                    startingDay: userService.weekStartsAtDay(),
                    datepickerMode: 'year',
                    showWeeks: false
                };

                $scope.$watch('$ctrl.userInfo.locale', function () {
                    $ctrl.birthDatePickerOptions.startingDay = userService.weekStartsAtDay();
                });

                $scope.$watch('$ctrl.birthDatePopup.opened', function (newValue, oldValue) {
                    if (oldValue && !newValue) {
                        $ctrl.payoutDetailsForm.birthDate.$setTouched();
                    }
                });

                let elements = stripeService.getStripeApi().elements();
                let style = {
                    base: {
                        fontSize: '16px',
                        color: "#555",
                        '::placeholder': {
                            color: '#999'
                        }
                    }
                };
                let options = {
                    style: style,
                    supportedCountries: ['SEPA'],
                    placeholderCountry: platformCountry,
                };
                iban = elements.create('iban', options);
                iban.mount('#iban-element');
                iban.on('change', function (event) {
                    $scope.$evalAsync(function () {
                        $ctrl.ibanFieldTouched = true;
                        $ctrl.ibanFieldError = null;
                        emptyIban = false;
                        if (event.empty) {
                            if ($ctrl.mustDefineIban) {
                                $ctrl.ibanFieldError = 'empty';
                            } else {
                                emptyIban = true;
                            }
                        } else if (event.complete === false || event.error) {
                            $ctrl.ibanFieldError = 'invalid';
                        } else if (!supportedCountries.contains(event.country)) {
                            $ctrl.ibanFieldError = 'country';
                        }
                    });
                });

                $timeout(function () {
                    $anchorScroll('payout-details-editor');
                });
            };

            $ctrl.$onChanges = function (changes) {
                if (!$ctrl.payoutDetails) {
                    $ctrl.payoutDetails = {};
                }

                if (changes.payoutDetails && $ctrl.payoutDetails) {
                    $ctrl.payoutDetails = angular.copy($ctrl.payoutDetails);

                    if ($ctrl.payoutDetails.birthDate) {
                        $ctrl._birthDate = moment($ctrl.payoutDetails.birthDate, "MM/DD/YYYY").toDate();
                    }
                }
            };

            $ctrl.showIdentityDocumentUploadModal = function (side) {
                const modalInstance = $uibModal.open({
                    animation: true,
                        templateUrl: 'common/components/expert-profile-editor/image-upload-modal/image-upload-modal.html',
                        controller: 'imageUploadModal',
                    controllerAs: '$ctrl',
                        windowClass: 'image-upload-modal',
                    resolve: {
                        modalConfig: () => ({
                            title: 'EXPERT_PROFILE_UPLOAD_ID_DOC_' + side.toUpperCase(),
                            helpText: 'EXPERT_PROFILE_UPLOAD_ID_DOC_HELP_TEXT',
                            enableImageUrl: false,
                            enableImageResizing: false,
                            uploadFn: file => filesService.uploadIdentityDocumentToStripe($ctrl.payoutDetails.stripeAccount, file)
                        })
                    }
                    })
                ;
                modalInstance.result.then(function (result) {
                    if (side === 'front') {
                        $ctrl.payoutDetails.idDocumentFrontFileId = result.uploadResponse.id;
                    } else if (side === 'rear') {
                        $ctrl.payoutDetails.idDocumentRearFileId = result.uploadResponse.id;
                    }
                }, angular.noop);
            };

            $ctrl.openBirthDatePopup = function () {
                $ctrl.birthDatePickerOptions.datepickerMode = 'year';
                $ctrl.birthDatePopup.opened = true;
            };

            $ctrl.cancel = function () {
                $ctrl.onCancel();
            };

            $ctrl.beforeSave = function () {
                $ctrl.ibanFieldTouched = true;
                if (!$ctrl.payoutDetails.idDocumentFrontFileId) {
                    $ctrl.idDocumentFrontTouched = true;
                }
                if (!$ctrl.payoutDetails.idDocumentRearFileId) {
                    $ctrl.idDocumentRearTouched = true;
                }
            };

            $ctrl.isExpertItalian = () => {
                return $ctrl.expertCountry === 'IT'
            };

            $ctrl.save = function () {
                let errors = [];

                if ($ctrl.ibanFieldError) {
                    errors.push('IBAN field error: ' + $ctrl.ibanFieldError);
                }
                if (!$ctrl.payoutDetails.filledAtLeastOnce || $ctrl.payoutDetails.idDocumentRequired) {
                    if (!$ctrl.payoutDetails.idDocumentFrontFileId || !$ctrl.payoutDetails.idDocumentRearFileId) {
                        errors.push('Missing ID document image');
                    }
                }
                if (errors.length > 0) {
                    return $q.reject(errors.join('\n'));
                }

                const deferred = $q.defer();
                spinnerService.show('general-spinner');
                $ctrl.payoutDetails.birthDate = `${$ctrl._birthDate.getMonth() + 1}/${$ctrl._birthDate.getDate()}/${$ctrl._birthDate.getFullYear()}`;

                /*
                DE-COMMENT WHEN SUPPORTING ELECTRONIC INVOICING
                if ($ctrl.expertHasVatNumber) {
                    delete $ctrl.payoutDetails.taxCode;
                    if ($ctrl.receiver === 'codiceDestinatario') {
                        delete $ctrl.payoutDetails.pecAddress;
                    } else {
                        delete $ctrl.payoutDetails.codiceDestinatario;
                    }
                } else {
                    delete $ctrl.payoutDetails.vatNumber;
                    delete $ctrl.payoutDetails.pecAddress;
                    delete $ctrl.payoutDetails.codiceDestinatario;
                }*/

                let ibanTokenRequest;
                if (emptyIban) {
                    ibanTokenRequest = $q.resolve({token: {id: null}});
                } else {
                    ibanTokenRequest = stripeService.getStripeApi().createToken(iban, {
                        /*
                        Country and account_number are automatically populated from the IBAN Element.
                        Setting the currency to eur ensures that only bank accounts
                        supporting eur as a settlement currency can be added.
                        */
                        currency: 'eur',
                        account_holder_name: $ctrl.userFullName,
                        account_holder_type: 'individual',
                    })
                }
                ibanTokenRequest.then(function (result) {
                    if (result.error) {
                        if (result.error.type === "invalid_request_error" &&
                            result.error.message.match(/invalid country for.*bank account.*/i)) {
                            alertService.displayAlert("NON_EUR_BANK_ACCOUNT", null, 'DANGER');
                        } else {
                            alertService.displayAlert("BACKEND_ERROR", null, 'DANGER');
                        }
                        deferred.reject(result.error);
                    } else {
                        $ctrl.payoutDetails.bankAccountToken = result.token.id;
                        userService.putPayoutDetails($ctrl.payoutDetails).then(function (response) {
                            $ctrl.onSave({
                                payoutDetails: response.data
                            });
                            alertService.displayAlert('UPDATE_USER', null, 'SUCCESS');
                            deferred.resolve();
                        }, function (rejection) {
                            deferred.reject(rejection);
                        });
                    }
                    spinnerService.hide('general-spinner');
                });
                return deferred.promise;
            };
        }
    });