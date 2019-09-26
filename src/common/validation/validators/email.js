angular.module('knowhub').directive('ngEmail', function (emailRegexp) {
    let MIN_EMAIL_LENGTH = 5;
    let MAX_EMAIL_LENGTH = 200;

    return {
        require: '?ngModel',
        link: function (scope, elm, attrs, ctrl) {
            if (ctrl && !ctrl.$validators.email) {

                // this will overwrite the default Angular email validator
                ctrl.$validators.email = function (modelValue) {
                    if (ctrl.$isEmpty(modelValue)) {
                        return true;
                    }
                    if (modelValue.length < MIN_EMAIL_LENGTH) {
                        return false;
                    }
                    if (modelValue.length > MAX_EMAIL_LENGTH) {
                        return false;
                    }
                    return emailRegexp.test(modelValue);
                };
            }
        }
    };
});