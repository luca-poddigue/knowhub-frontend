'use strict';

angular.module('knowhub')
    .component('proficiencyPicker', {
        require: {
            ngModel: ''
        },
        bindings: {
            levels: '<',
            exposedFunctions: '&'
        },
        templateUrl: 'common/components/proficiency-picker/proficiency-picker.html',
        controller: function proficiencyPickerController($timeout) {

            let $ctrl = this;
            let missingValueTimeout;

            $ctrl.$onInit = function () {
                $ctrl.level = $ctrl.ngModel.$viewValue;
                $ctrl.exposedFunctions({
                    functions: {
                        missingValueAlert: function () {
                            return missingValueAlert();
                        }
                    }
                });

            };

            $ctrl.onSelect = function (level, index) {
                let levelObj = {
                    level: level,
                    index: index
                };
                $ctrl.level = levelObj;
                $ctrl.ngModel.$setViewValue(levelObj);
            };

            $ctrl.$postLink = function () {
                $ctrl.ngModel.$render = function () {
                    if (angular.isObject($ctrl.ngModel.$viewValue) && angular.isUndefined($ctrl.ngModel.$viewValue.index)) {
                        $ctrl.ngModel.$viewValue.index = $ctrl.levels.indexOf($ctrl.ngModel.$viewValue.level);
                    }
                    $ctrl.level = $ctrl.ngModel.$viewValue;
                };
            };

            function missingValueAlert() {
                if (missingValueTimeout != null) {
                    return;
                }
                $ctrl.missingValueAnimation = true;
                missingValueTimeout = $timeout(function () {
                    $ctrl.missingValueAnimation = false;
                    missingValueTimeout = null;
                }, 900);
            }

        }
    });