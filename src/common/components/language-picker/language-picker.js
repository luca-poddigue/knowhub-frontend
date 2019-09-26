'use strict';

angular.module('knowhub')
    .component('languagePicker', {
        require: {
            ngModel: ''
        },
        bindings: {
            "id": '@',
            "keepSelection": "<?",
            "availableLanguages": "<?", //['en', 'it', ...] If supplied, show only these languages, otherwise show them all
            "allowClear": "<?",
            "disableSearch": "<?"
        },
        templateUrl: 'common/components/language-picker/language-picker.html',
        controller: function languagePickerController($timeout, $element, $scope, languages, localStorageService) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                if (angular.isUndefined($ctrl.allowClear)) {
                    $ctrl.allowClear = true;
                }

                $ctrl.ngModel.$render = function () {
                    if ($ctrl.keepSelection) {
                        $ctrl.language = $ctrl.languages[localStorageService.get('langPicker.' + $ctrl.id) || $ctrl.ngModel.$viewValue];
                    } else {
                        $ctrl.language = $ctrl.languages[$ctrl.ngModel.$viewValue];
                    }
                };

                $timeout(function () {
                    $element.find('input[type=search]').on('blur', function () {
                        $scope.$evalAsync(function () {
                            $ctrl.ngModel.$setTouched();
                        });
                    });
                });
            };

            $ctrl.$onChanges = function (changes) {
                if (changes.availableLanguages) {
                    if (!angular.isArray($ctrl.availableLanguages) || $ctrl.availableLanguages.length === 0) {
                        $ctrl.languages = angular.copy(languages);
                    } else {
                        $ctrl.languages = {};
                        angular.forEach($ctrl.availableLanguages, function (languageCode) {
                            this[languageCode] = languages[languageCode];
                        }, $ctrl.languages);
                    }
                } else {
                    $ctrl.languages = angular.copy(languages);
                }
            };

            $ctrl.refreshChoices = function (search) {
                if (search.length >= 2) {
                    $ctrl.delayedSearch = search;
                } else {
                    $ctrl.delayedSearch = '';
                }
            };

            $ctrl.onSelectCallback = function ($item) {
                if ($item) {
                    if ($ctrl.keepSelection && $ctrl.id) {
                        localStorageService.set('langPicker.' + $ctrl.id, $item.key);
                    }
                    $ctrl.ngModel.$setViewValue($item.key);
                } else {
                    if ($ctrl.keepSelection && $ctrl.id) {
                        localStorageService.remove('langPicker.' + $ctrl.id);
                    }
                    $ctrl.ngModel.$setViewValue(null);
                }
            };
        }

    });