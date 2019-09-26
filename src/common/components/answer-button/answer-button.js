'use strict';

angular.module('knowhub')
    .component('answerButton', {
        templateUrl: 'common/components/answer-button/answer-button.html',
        require: {
            ngModel: ''
        },
        bindings: {
            options: '<' //[{key: 'YES_KEY', activeClass: 'danger', id: 'YES}, ...]
        },
        controller: function answerButtonController() {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.ngModel.$render = function () {
                    $ctrl.selectedOption = $ctrl.options.find(function (option) {
                        return option.id === $ctrl.ngModel.$viewValue;
                    });
                };
            };

            $ctrl.setOption = function (option) {
                $ctrl.selectedOption = option;
                $ctrl.ngModel.$setViewValue(option.id);
            };
        }
    });