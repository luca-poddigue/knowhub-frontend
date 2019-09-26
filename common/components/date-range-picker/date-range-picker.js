'use strict';

angular.module('knowhub')
    .component('dateRangePicker', {
        require: {
            ngModel: ''
        },
        bindings: {
            "rangeLimit": '@', //pastOnly, futureOnly, none
            "maxDate": '<?',
            "minDate": '<?',
            "resettable": '<?',
            "enableToPresent": '<?',
            "inputSize": "@?",
            "rangePopoverPlacement": "@?",
            "disableHighlightWhenValid": '<?'
        },
        templateUrl: 'common/components/date-range-picker/date-range-picker.html',
        controller: function dateRangePickerController($uibModal, $document, $window, $scope, userService) {

            let $ctrl = this;
            let modalInstance;

            $ctrl.$onInit = function () {
                $ctrl.inputSize = $ctrl.inputSize || 'md';
                $ctrl.rangePopoverPlacement = $ctrl.rangePopoverPlacement || 'bottom';
                $ctrl.popoverOpen = false;
                if (angular.isUndefined($ctrl.resettable)) {
                    $ctrl.resettable = true;
                }
                $ctrl.ngModel.$render = function () {
                    if ($ctrl.ngModel.$viewValue) {
                        $ctrl.range = $ctrl.ngModel.$viewValue;
                        if ($ctrl.enableToPresent && angular.isUndefined($ctrl.range.toPresent)) {
                            $ctrl.range.toPresent = !$ctrl.range[1];
                        }
                    } else {
                        $ctrl.range = [];
                        if ($ctrl.enableToPresent && angular.isUndefined($ctrl.range.toPresent)) {
                            $ctrl.range.toPresent = false;
                        }
                    }
                };
                $ctrl.datePickerOptions = {
                    showWeeks: false,
                    startingDay: userService.weekStartsAtDay()
                };
                if ($ctrl.minDate) {
                    $ctrl.datePickerOptions.minDate = $ctrl.minDate.toDate();
                }
                if ($ctrl.maxDate) {
                    $ctrl.datePickerOptions.maxDate = $ctrl.maxDate.toDate();
                }
                switch ($ctrl.rangeLimit) {
                    case 'futureOnly':
                        $ctrl.datePickerOptions.minDate = new Date();
                        break;
                    case 'pastOnly':
                        $ctrl.datePickerOptions.maxDate = new Date();
                        break;
                }

                angular.element($window).on(
                    "click",
                    function (event) {
                        if ($ctrl.popoverOpen && $.contains($('app')[0], event.target) && !$.contains($('date-range-picker .btn')[0], event.target) && $('date-range-picker .btn')[0] !== event.target) {
                            $scope.$evalAsync(function () {
                                $ctrl.togglePopover();
                            });
                        }
                    });

                angular.element($window).on("resize", function () {
                    $scope.$evalAsync(function () {
                        if (modalInstance) {
                            modalInstance.dismiss();
                        }
                        if ($ctrl.popoverOpen) {
                            $ctrl.ngModel.$setTouched();
                            $ctrl.popoverOpen = false;
                        }
                    });
                });
            };

            $ctrl.$onDestroy = function () {
                angular.element($window).off("resize");
                angular.element($window).off("click");
            };

            $ctrl.togglePopover = function () {
                $ctrl.popoverOpen = !$ctrl.popoverOpen;
                $ctrl.popoverOpen ? $ctrl.ngModel.$setUntouched() : $ctrl.ngModel.$setTouched();
            };

            $ctrl.showModal = function () {
                $ctrl.ngModel.$setUntouched();
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/components/date-range-picker/date-range-picker-modal/date-range-picker-modal.html',
                    controller: 'dateRangePickerModal',
                    controllerAs: '$ctrl',
                    size: 'sm',
                    windowClass: 'date-range-modal',
                    resolve: {
                        range: function () {
                            return $ctrl.range;
                        },
                        rangeLimit: function () {
                            return $ctrl.rangeLimit;
                        },
                        minDate: function () {
                            return $ctrl.minDate;
                        },
                        maxDate: function () {
                            return $ctrl.maxDate;
                        },
                        enableToPresent: function () {
                            return $ctrl.enableToPresent;
                        }
                    }
                });
                modalInstance.result.then(function (range) {
                    $ctrl.range = range;
                    $ctrl.ngModel.$setViewValue(angular.copy($ctrl.range));
                    $ctrl.ngModel.$setTouched();
                }, function () {
                    $ctrl.ngModel.$setTouched();
                });
            };

            $ctrl.toggleToPresent = function () {
                if ($ctrl.range.toPresent) {
                    $ctrl.range.toPresent = false;
                    $ctrl.range[1] = new Date($ctrl.range[0].getTime());
                } else {
                    delete $ctrl.range[1];
                    $ctrl.range.toPresent = true;
                    if (!$ctrl.range[0]) {
                        $ctrl.range[0] = new Date();
                    }
                }
                setHoursToDateRange();
            };

            $ctrl.clearRange = function () {
                $ctrl.range = [];
                $ctrl.ngModel.$setViewValue(null);
            };

            $ctrl.updateFrom = function () {
                if (!$ctrl.range.toPresent && (!$ctrl.range[1] || $ctrl.range[0] >= $ctrl.range[1])) {
                    $ctrl.range[1] = new Date($ctrl.range[0].getTime());
                }
                setHoursToDateRange();
                updateViewValue();
            };

            $ctrl.updateTo = function () {
                if (!$ctrl.range[0] || $ctrl.range[0] >= $ctrl.range[1]) {
                    $ctrl.range[0] = new Date($ctrl.range[1].getTime());
                }
                setHoursToDateRange();
                updateViewValue();
            };

            function updateViewValue() {
                if ($ctrl.range && $ctrl.range[0] && $ctrl.range[1]) {
                    $ctrl.ngModel.$setViewValue(angular.copy($ctrl.range));
                } else {
                    $ctrl.ngModel.$setViewValue(null);
                }
            }

            function setHoursToDateRange() {
                if ($ctrl.range[0]) {
                    $ctrl.range[0].setHours(0, 0, 0, 0);
                }
                if ($ctrl.range[1]) {
                    $ctrl.range[1].setHours(23, 59, 59, 999);
                }
            }
        }
    });