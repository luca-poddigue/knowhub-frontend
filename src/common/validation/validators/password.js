angular.module('knowhub').directive('ngPassword', function () {
    let MIN_PASSWORD_LENGTH = 6;
    let MAX_PASSWORD_LENGTH = 20;
    return {
        require: 'ngModel',
        link: function ($scope, $element, $attrs, $ctrl) {
            $ctrl.$validators.password = function (modelValue, viewValue) {
                if ($ctrl.$isEmpty(modelValue)) {
                    return true;
                }
                return viewValue.length >= MIN_PASSWORD_LENGTH && viewValue.length <= MAX_PASSWORD_LENGTH;
            };
        }
    };
});