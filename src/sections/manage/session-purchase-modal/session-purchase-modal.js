'use strict';

angular.module('knowhub').controller('sessionPurchaseModal', function ($uibModalInstance, alertService, $scope, localStorageService, $q, sessionStatus,
                                                                       userService, stripeService, sharingSessionWorkflowService,
                                                                       spinnerService, platformCountry, defaultCurrency, $filter,
                                                                       $log, parentScope, session, userType) {
    let $ctrl = this;
    let stripe;
    let card;
    let translate = $filter('translate');

    spinnerService.show("session-purchase-spinner");
    $ctrl.paymentMethods = [];
    $ctrl.savePaymentMethod = false;
    $ctrl.showPaymentButton = false;
    $ctrl.deletingPaymentMethod = false;

    let currency = translate('CURRENCY_SYMBOL_EUR');
    $ctrl.sessionPrice = currency + ' ' + session.price;

    $ctrl.saveCardOptions = [{
        key: 'COMMON_YES',
        activeClass: 'btn-success',
        id: true
    },
        {
            key: 'COMMON_NO',
            id: false
        }];

    let style = {
        base: {
            fontSize: '16px',
            color: "#555",
            '::placeholder': {
                color: '#999'
            }
        }
    };

    $uibModalInstance.rendered.then(function () {
        spinnerService.show("session-purchase-spinner");
        stripe = stripeService.getStripeApi();
        let elements = stripe.elements({
            locale: userService.language()
        });
        card = elements.create('card', {style: style});
        card.mount('#card-element');
        card.addEventListener('change', function (event) {
            $scope.$evalAsync(function () {
                $ctrl.cardFieldError = !!event.error;
            })
        });

        let paymentRequest = stripe.paymentRequest({
            country: platformCountry,
            currency: defaultCurrency.toLowerCase(),
            total: {
                label: translate('SESSION_PURCHASE_BROWSER_PAYMENT_PRODUCT_LABEL'),
                amount: session.price * 100
            },
            requestPayerName: true,
            requestPayerEmail: true
        });
        elements.create('paymentRequestButton', {
            paymentRequest: paymentRequest
        });
        paymentRequest.canMakePayment().then(function (result) {
            $scope.$evalAsync(function () {
                if (result) {
                    $ctrl.showPaymentButton = true;
                    $ctrl.showBrowserPaymentInterface = function () {
                        paymentRequest.show();
                    };
                }
                spinnerService.hide("session-purchase-spinner");
            });
        });
        paymentRequest.on('paymentmethod', function (ev) {
            $ctrl.acceptAndPurchase(ev.paymentMethod.id).then(function () {
                // Report to the browser that the payment was successful, prompting
                // it to close the browser payment interface.
                ev.complete('success');
            }, function () {
                // Report to the browser that the payment failed, prompting it to
                // re-show the payment interface, or show an error message and close
                // the payment interface.
                ev.complete('fail');
            });
        });

    });

    sharingSessionWorkflowService.initPurchase().then(function (initData) {
        $ctrl.paymentMethods = initData.paymentMethods || [];
        let paymentMethodIdx = parseInt(localStorageService.get("paymentMethodIdx"));
        if (angular.isReallyNumber(paymentMethodIdx)) {
            if (paymentMethodIdx === -1) {
                $ctrl.isCustomPaymentMethod = true;
                $ctrl.selectedPaymentMethod = undefined;
            } else {
                if (paymentMethodIdx < $ctrl.paymentMethods.length) {
                    $ctrl.selectedPaymentMethod = $ctrl.paymentMethods[paymentMethodIdx];
                } else {
                    $ctrl.selectedPaymentMethod = undefined;
                }
            }
        } else {
            $ctrl.isCustomPaymentMethod = true;
            $ctrl.selectedPaymentMethod = undefined;
        }
    }, angular.noop).finally(function () {
        spinnerService.hide("session-purchase-spinner");
    });

    $ctrl.acceptAndPurchase = function (paymentMethodId) {
        spinnerService.show("session-purchase-spinner");
        let deferred = $q.defer();

        let paymentMethodIdPromise;
        let savePaymentMethod;
        if (paymentMethodId) {
            paymentMethodIdPromise = $q.resolve({paymentMethod: {id: paymentMethodId}});
            savePaymentMethod = false;
        } else {
            paymentMethodIdPromise = stripe.createPaymentMethod('card', card);
            savePaymentMethod = $ctrl.savePaymentMethod;
        }

        paymentMethodIdPromise.then(function (result) {
            if (result.error) {
                managePaymentError(result, deferred);
            } else {
                doAcceptSession(result.paymentMethod.id, null, savePaymentMethod, deferred);
            }
        });
        return deferred.promise;
    };

    function managePaymentError(result, deferred) {
        $log.error(result.error);
        spinnerService.hide("session-purchase-spinner");
        if (result.error.type === 'invalid_request_error' && (result.error.code === 'card_declined' || result.error.code === 'payment_intent_authentication_failure')) {
            // 6 = backend error code for declined card
            alertService.displayAlert("6", null, 'DANGER');
        } else if (result.error.type !== 'validation_error') {
            alertService.displayAlert("PAYMENT", null, 'DANGER');
        }
        deferred.reject();
    }

    function doAcceptSession(paymentMethodId, paymentIntentId, savePaymentMethod, deferred) {
        return sharingSessionWorkflowService.acceptSession(userType.seeker, session.id, paymentMethodId, paymentIntentId, savePaymentMethod).then(function (sessionPurchaseResponse) {
            if (sessionPurchaseResponse.requiresAction) {
                handlePaymentAdditionalAction(sessionPurchaseResponse, savePaymentMethod, deferred);
            } else {
                handlePaymentSuccess(sessionPurchaseResponse, deferred);
            }
        }, function () {
            spinnerService.hide("session-purchase-spinner");
            deferred.reject();
        });
    }

    function handlePaymentAdditionalAction(sessionPurchaseResponse, savePaymentMethod, deferred) {
        stripe.handleCardAction(
            sessionPurchaseResponse.paymentIntentClientSecret
        ).then(function (result) {
            if (result.error) {
                managePaymentError(result, deferred);
            } else {
                doAcceptSession(null, result.paymentIntent.id, savePaymentMethod, deferred);
            }
        });
    }

    function handlePaymentSuccess(sessionPurchaseResponse, deferred) {
        spinnerService.hide("session-purchase-spinner");
        sessionPurchaseResponse.status = sessionStatus.planned;
        deferred.resolve();
        $uibModalInstance.close(sessionPurchaseResponse);
    }

    $ctrl.selectPaymentMethod = function (paymentMethod, index) {
        if (paymentMethod === 'custom') {
            $ctrl.isCustomPaymentMethod = true;
            $ctrl.selectedPaymentMethod = undefined;
        } else {
            $ctrl.isCustomPaymentMethod = false;
            $ctrl.selectedPaymentMethod = paymentMethod;
        }
        localStorageService.set('paymentMethodIdx', index);
    };

    $ctrl.deletePaymentMethod = function (method, index) {
        $ctrl.deletingPaymentMethod = true;
        spinnerService.show("session-purchase-spinner");
        sharingSessionWorkflowService.deletePaymentMethod(method.id).then(function () {
            $ctrl.paymentMethods.splice(index, 1);
            $ctrl.selectedPaymentMethod = undefined;
            localStorageService.remove('paymentMethodIdx');
        }).finally(() => {
            spinnerService.hide("session-purchase-spinner");
            $ctrl.deletingPaymentMethod = false;
        });
    };


    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.onTransactionCompleted = function () {
        parentScope.$emit('sharingSession:sessionChange');
        $uibModalInstance.close();
    };

});