'use strict';

angular.module('knowhub').controller('dateRangePickerModal', function ($uibModalInstance, userService, range, rangeLimit, minDate, maxDate, enableToPresent) {
    let $ctrl = this;

    $ctrl.enableToPresent = enableToPresent;
    $ctrl.range = range ? angular.copy(range) : {};
    $ctrl.datePickerOptions = {
        showWeeks: false,
        startingDay: userService.weekStartsAtDay()
    };

    if (minDate) {
        $ctrl.datePickerOptions.minDate = minDate.toDate();
    }
    if (maxDate) {
        $ctrl.datePickerOptions.maxDate = maxDate.toDate();
    }
    switch (rangeLimit) {
        case 'futureOnly':
            $ctrl.datePickerOptions.minDate = new Date();
            break;
        case 'pastOnly':
            $ctrl.datePickerOptions.maxDate = new Date();
            break;
    }

    $ctrl.ok = function () {
        $uibModalInstance.close($ctrl.range);
    };

    $ctrl.cancel = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.updateFrom = function () {
        if (!$ctrl.range[1] || $ctrl.range[0] >= $ctrl.range[1]) {
            $ctrl.range[1] = new Date($ctrl.range[0].getTime());
        }
        setHoursToDateRange();
    };

    $ctrl.updateTo = function () {
        if (!$ctrl.range[0] || $ctrl.range[0] >= $ctrl.range[1]) {
            $ctrl.range[0] = new Date($ctrl.range[1].getTime());
        }
        setHoursToDateRange();
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

    function setHoursToDateRange() {
        if ($ctrl.range[0]) {
            $ctrl.range[0].setHours(0, 0, 0, 0);
        }
        if ($ctrl.range[1]) {
            $ctrl.range[1].setHours(23, 59, 59, 999);
        }
    }

});