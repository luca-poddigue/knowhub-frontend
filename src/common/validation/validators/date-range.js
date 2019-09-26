angular.module('knowhub').directive('ngDateRange', function () {
    return {
        require: 'ngModel',
        link: function ($scope, $element, $attrs, $ctrl) {
            $ctrl.$validators.dateRange = function (modelValue) {
                return !modelValue || (!modelValue.from && !modelValue.to) || (angular.isObject(modelValue) && angular.isDate(modelValue.from) && angular.isDate(modelValue.to) && modelValue.from <= modelValue.to);
            };
        }
    };
});