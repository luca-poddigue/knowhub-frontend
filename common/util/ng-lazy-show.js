'use strict';

angular.module('knowhub').directive('ngLazyShow', function ($animate) {
    return {
        transclude: 'element',
        priority: 600,
        restrict: 'A',
        link: function ($scope, $element, $attr, $ctrl, $transclude) {
            let loaded;
            $scope.$watch($attr.ngLazyShow, function ngLazyShowWatchAction(value) {
                if (loaded) {
                    $animate[value ? 'removeClass' : 'addClass']($element, 'ng-hide');
                } else if (value) {
                    loaded = true;
                    $transclude(function (clone) {
                        clone[clone.length++] = document.createComment(' end ngLazyShow: ' + $attr.ngLazyShow + ' ');
                        $animate.enter(clone, $element.parent(), $element);
                        $element = clone;
                    });
                }
            });
        }
    };
});