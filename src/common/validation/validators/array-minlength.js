angular.module('knowhub').directive('ngArrayMinlength', function ($exceptionHandler) {
    return {
        require: 'ngModel',
        link: function ($scope, $element, $attrs, $ctrl) {
            let threshold = parseInt($attrs.ngArrayMinlength);
            if (!angular.isReallyNumber(threshold)) {
                $exceptionHandler(new Error($scope.ngArrayMinlength + "is not a number."));
            }
            $ctrl.$validators.arrayMinlength = function (modelValue) {
                if (!modelValue) {
                    return true;
                }
                if (!angular.isArray(modelValue)) {
                    $exceptionHandler(new Error("Model value is not an array: " + modelValue));
                }
                return modelValue.length >= threshold;
            };
        }
    };
});