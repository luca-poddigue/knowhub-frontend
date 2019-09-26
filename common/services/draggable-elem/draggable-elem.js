'use strict';

angular
    .module('knowhub')
    .factory('draggableElemService', function draggableElemFactory($document) {

        let dragData = null;

        function drop(event) {
            if (dragData) {
                let targetElement = $document.find('#' + dragData.draggedElemId);
                let mouseX = $(window).width() - (event.type === 'touchmove' ? event.originalEvent.touches[0].clientX : event.clientX);
                let mouseY = $(window).height() - (event.type === 'touchmove' ? event.originalEvent.touches[0].clientY : event.clientY);

                let candidateRight = mouseX - dragData.offsetX;
                if (candidateRight < 0) {
                    targetElement.css('right', '0');
                } else if (candidateRight > $(window).width() - targetElement.outerWidth()) {
                    targetElement.css('right', ($(window).width() - targetElement.outerWidth()) + 'px');
                } else {
                    targetElement.css('right', candidateRight + 'px');
                }

                let candidateBottom = mouseY - dragData.offsetY;
                if (candidateBottom < 0) {
                    targetElement.css('bottom', '0');
                } else if (candidateBottom > $(window).height() - targetElement.outerHeight()) {
                    targetElement.css('bottom', ($(window).height() - targetElement.outerHeight()) + 'px');
                } else {
                    targetElement.css('bottom', candidateBottom + 'px');
                }

                if (event.type !== 'touchmove') {
                    dragData = null;
                }
                event.preventDefault();
                return false;
            }

        }

        function dragOver(event) {
            event.preventDefault();
            return false;
        }

        function touchEnd() {
            dragData = null;
        }

        $document.find('body')
            .on('dragover', dragOver)
            .on('drop', drop)
            .on('touchmove', drop)
            .on('touchend', touchEnd);

        return {
            dragData: function (data) {
                if (data) {
                    dragData = data;
                } else {
                    return dragData;
                }
            }
        };

    });
