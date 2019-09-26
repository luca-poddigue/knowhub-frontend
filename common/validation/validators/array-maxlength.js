angular.module('knowhub').directive('ngArrayMaxlength', function ($exceptionHandler) {
    return {
        require: 'ngModel',
        link: function ($scope, $element, $attrs, $ctrl) {
            let threshold = parseInt($attrs.ngArrayMaxlength);
            if (!angular.isReallyNumber(threshold)) {
                $exceptionHandler(new Error($scope.ngArrayMaxlength + "is not a number."));
            }
            $ctrl.$validators.arrayMaxlength = function (modelValue) {
                if (!modelValue) {
                    return true;
                }
                if (!angular.isArray(modelValue)) {
                    $exceptionHandler(new Error("Model value is not an array: " + modelValue));
                }
                return modelValue.length <= threshold;
            };
        }
    };
});