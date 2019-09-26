angular.module('knowhub').directive('ngTruePredicate', function () {
    return {
        require: 'ngModel',
        link: function ($scope, $element, $attrs, $ctrl) {
            $ctrl.$validators.truePredicate = function (modelValue) {
                return modelValue;
            };
        }
    };
});