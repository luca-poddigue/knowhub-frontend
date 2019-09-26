'use strict';

angular.module('knowhub').directive('onClickOutside', ['$document', function ($document) {
    return {
        link: function postLink(scope, element, attrs) {
            let onClick = function (event) {
                let sourceIsChild = $(element).has(event.currentTarget.activeElement).length > 0;
                let sourceIsSelf = element[0] == event.currentTarget.activeElement;
                let targetIsChild = $(element).has(event.target).length > 0;
                let targetIsSelf = element[0] == event.target;
                if (!targetIsChild && !targetIsSelf && !sourceIsChild && !sourceIsSelf) {
                    scope.$evalAsync(attrs.onClickOutside);
                }
            };
            $document.bind('click', onClick);

            scope.$on('$destroy', function () {
                $document.unbind('click', onClick);
            });
        }
    };
}]);
