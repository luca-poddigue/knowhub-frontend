'use strict';

angular.module("knowhub").decorator(
    "$exceptionHandler",
    function exceptionHandlerDecorator($delegate, alertService) {
        return function (exception, cause) {
            // Exception contains property 'name' that identifies the error, and 'data', that is an object with further data about the error.
            if (exception && exception.alert && exception.name) {
                alertService.displayAlert(exception.name, exception.data, 'DANGER');
            }
            $delegate(exception, cause);
        };
    }
);