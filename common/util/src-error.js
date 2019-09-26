'use strict';

angular.module('knowhub').directive('srcError', function () {
    return {
        restrict: 'A',
        scope: {
            srcError: '&'
        },
        link: function (scope, element) {
            element.bind('error', function () {
                scope.$evalAsync(function () {
                    scope.srcError();
                });
            });
        }
    };
});
