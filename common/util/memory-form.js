'use strict';

angular.module('knowhub').directive('memoryForm', function (localStorageService) {
    return {
        restrict: 'A',
        require: '?form',
        scope: {
            onMemoryFormLoaded: '&'
        },
        link: function (scope, element, attrs, formController) {

            if (!formController) {
                return;
            }

            let stopInit = scope.$on('spinner:appReady', function () {
                let storedFormValues = localStorageService.get(getFormId());
                if (storedFormValues) {
                    angular.forEach(storedFormValues, function (fieldValue, formField) {
                        if (formController[formField] && shouldBeStored(formController[formField])) {
                            formController[formField].$$ngModelSet(scope.$parent, deserializeModelValue(fieldValue));
                        }
                    });
                }
                stopInit();
                scope.onMemoryFormLoaded();
                scope.$watch(function () {
                    let formValues = {};
                    angular.forEach(formController.$$controls, function (control) {
                        if (control.$name && shouldBeStored(control)) {
                            this[control.$name] = serializeModelValue(control.$modelValue);
                        }
                    }, formValues);
                    return formValues;
                }, function (formValues) {
                    localStorageService.set(getFormId(), formValues);
                }, true);
            });

            function shouldBeStored(modelValue) {
                return !modelValue.$$attr.$attr.doNotStore;
            }

            function serializeModelValue(modelValue) {
                if (angular.isDate(modelValue)) {
                    return '##DATE##' + modelValue.getTime();
                } else if (angular.isObject(modelValue)) {
                    let modelClone = angular.copy(modelValue);
                    angular.forEach(modelClone, function (value, key) {
                        modelClone[key] = serializeModelValue(value);
                    });
                    return modelClone;
                } else {
                    return modelValue;
                }
            }

            function deserializeModelValue(serializedModelValue) {
                if (angular.isString(serializedModelValue) && serializedModelValue.startsWith('##DATE##')) {
                    return new Date(Number(serializedModelValue.replace('##DATE##', '')));
                } else if (angular.isObject(serializedModelValue)) {
                    let serializedModelClone = angular.copy(serializedModelValue);
                    angular.forEach(serializedModelClone, function (value, key) {
                        serializedModelClone[key] = deserializeModelValue(value);
                    });
                    return serializedModelClone;
                } else {
                    return serializedModelValue;
                }
            }

            function getFormId() {
                if (angular.isString(formController.$name)) {
                    return 'form.' + formController.$name.replace('$ctrl.', '');
                }
                return 'form.' + formController.$name;
            }
        }
    };
});