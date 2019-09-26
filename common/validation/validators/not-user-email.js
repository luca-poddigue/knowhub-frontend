angular.module('knowhub').directive('ngNotUserEmail', function (userAuthService) {
    return {
        scope: {},
        require: 'ngModel',
        link: function ($scope, $element, $attrs, $ctrl) {
            $ctrl.$validators.notUserEmail = function (modelValue, viewValue) {
                if ($ctrl.$isEmpty(modelValue)) {
                    return true;
                }
                return viewValue !== userAuthService.getAuthInfo().email;
            };
        }
    };
});