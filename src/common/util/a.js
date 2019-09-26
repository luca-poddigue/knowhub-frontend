'use strict';

angular.module('knowhub').directive('a', function ($location) {
    return {
        restrict: 'E',
        link: function (scope, elm, attr) {
            elm.on('click', function ($event) {
                if (!attr.href) {
                    $event.preventDefault();
                    return;
                }
                if (attr.href.startsWith('/')) {
                    $event.preventDefault();
                    scope.$evalAsync(function () {
                        $location.urlWithReplace(attr.href, attr.replace === "true");
                    });
                }
            });
        }
    };
});
