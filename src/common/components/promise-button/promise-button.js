'use strict';

angular.module('knowhub')
    .component('promiseButton', {
        require: '',
        bindings: {
            form: '<?',
            onConfirm: '<',
            onConfirmArgs: '<?',
            beforeConfirm: '<?',
            onCancel: '<',
            onCancelArgs: '<',
            confirmTextKey: '@',
            cancelTextKey: '@',
            btnType: '@?',
            btnStyle: '@?',
            btnDisabled: '<?',
            btnIcon: '@?',
            spinner: '@?'
        },
        templateUrl: 'common/components/promise-button/promise-button.html',
        controller: function promiseButtonController($exceptionHandler, spinnerService) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.isProcessing = false;
            };

            $ctrl.doOnConfirm = function () {
                if (angular.isFunction($ctrl.beforeConfirm)) {
                    $ctrl.beforeConfirm.apply();
                }

                if ($ctrl.form && $ctrl.form.$invalid) {
                    setFormTouched($ctrl.form);
                    return;
                }

                $ctrl.isProcessing = true;
                if ($ctrl.spinner) {
                    spinnerService.show($ctrl.spinner);
                }
                let promise = $ctrl.onConfirm.apply(null, $ctrl.onConfirmArgs);
                if (promise && angular.isFunction(promise.then)) {
                    promise.then(function () {
                        $ctrl.isProcessing = false;
                        if ($ctrl.spinner) {
                            spinnerService.hide($ctrl.spinner);
                        }
                    }, function () {
                        $ctrl.isProcessing = false;
                        if ($ctrl.spinner) {
                            spinnerService.hide($ctrl.spinner);
                        }
                    });
                } else {
                    $ctrl.isProcessing = false;
                    if ($ctrl.spinner) {
                        spinnerService.hide($ctrl.spinner);
                    }
                    $exceptionHandler(new Error("The object returned by the onConfirm function must be a promise."));
                }
            };

            $ctrl.doOnCancel = function () {
                $ctrl.onCancel.apply(null, $ctrl.onCancelArgs);
            };

            function setFormTouched(form) {
                angular.forEach(form.$$controls, function (control) {
                    if (control.$$controls) {
                        setFormTouched(control);
                    } else {
                        control.$setTouched();
                    }
                });
            }
        }
    });