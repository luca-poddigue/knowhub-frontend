'use strict';

angular.module('knowhub').directive('isolateForm', [function () {
    return {
        restrict: 'A',
        require: '?form',
        link: function (scope, element, attrs, formController) {
            if (!formController) {
                return;
            }

            let parentForm = formController.$$parentForm;
            if (!parentForm) {
                return;
            }

            parentForm.$removeControl(formController);
        }
    };
}]);