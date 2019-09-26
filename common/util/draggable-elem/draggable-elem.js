'use strict';

angular.module('knowhub').directive('draggableElem', function ($window, $exceptionHandler, $document, draggableElemService) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            if (!attrs.id) {
                $exceptionHandler(new Error("ID of draggable element is required."));
            }

            function dragStart(event) {
                let style = window.getComputedStyle($document.find('#' + attrs.id)[0], null);
                let mouseX = $(window).width() - (event.type === 'touchstart' ? event.originalEvent.touches[0].clientX : event.clientX);
                let mouseY = $(window).height() - (event.type === 'touchstart' ? event.originalEvent.touches[0].clientY : event.clientY);
                if (event.originalEvent.dataTransfer) {
                    event.originalEvent.dataTransfer.setData('text/plain', ' ');
                }
                let elemRight = parseInt(style.getPropertyValue("right"), 10);
                let elemBottom = parseInt(style.getPropertyValue("bottom"), 10);
                draggableElemService.dragData({
                    offsetX: mouseX - elemRight,
                    offsetY: mouseY - elemBottom,
                    draggedElemId: attrs.id
                });
            }

            attrs.$observe('draggableElem', function (draggable) {
                element.attr('draggable', draggable);
                if (draggable === 'true') {
                    element
                        .on('dragstart', dragStart)
                        .on('touchstart', dragStart);
                } else {
                    element
                        .off('dragstart')
                        .off('touchstart');
                }
            });

            scope.$on('$destroy', function () {
                element
                    .off('dragstart')
                    .off('touchstart')
            });

            angular.element($window).on("resize", function () {
                element.css({
                    bottom: '',
                    right: ''
                });
            });
        }
    };
});