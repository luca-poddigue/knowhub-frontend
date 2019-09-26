angular.module('knowhub').directive('ngMustMatch', function () {
    return {
        scope: {
            "ngMustMatch": '@'
        },
        require: 'ngModel',
        link: function ($scope, $element, $attrs, $ctrl) {
            $ctrl.$validators.mustMatch = function (modelValue, viewValue) {
                if ($ctrl.$isEmpty(modelValue)) {
                    return true;
                }
                return viewValue === $scope.ngMustMatch;
            };
        }
    };
});