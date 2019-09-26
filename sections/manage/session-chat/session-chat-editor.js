'use strict';

angular.module('knowhub').directive('sessionChatEditor', function ($compile, $sce) {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            getEditorApi: "&"
        },
        link: function (scope, element, attrs, ngModel) {
            let browserSupportsSvg = document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1");

            scope.getEditorApi({
                $event: {
                    addEmoji: function ($event, category, emojiCode) {
                        $event.stopPropagation();
                        let html = '<img class="emoji" src="sections/manage/session-chat/images/emoji/' + category + '/' + emojiCode + (browserSupportsSvg ? '.svg' : '.png') + '">';
                        pasteHtmlAtCaret(html);
                    }
                }
            });
            element.bind('mouseover mouseenter dragover drop dragenter dragleave', function(event){
                event.preventDefault();
                return false;
            });
            element.bind('mousedown', function(event){
                if (event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'img') {
                    event.preventDefault();
                    return false;
                }
            });
            element.on('blur keyup change', function () {
                scope.$evalAsync(function() {
                    read();
                });
            });
            read();

            ngModel.$render = function () {
                let viewValue = $sce.getTrustedHtml(ngModel.$viewValue);
                viewValue = viewValue.replace('<br>', '');
                viewValue = viewValue.replace(/##([\w]+)#([\w-]+)##/g, '<img src="sections/manage/session-chat/images/emoji/$1/$2' + (browserSupportsSvg ? '.svg' : '.png') + '">');
                element.html(viewValue);
            };

            function read() {
                let html = element.html();
                html = html.trim();
                html = html.replace(/<\/?span>|<br>/g, '');
                html = html.replace(/<img .*? src="sections\/manage\/session-chat\/images\/emoji\/([\w]+)\/([\w-]+).*?>/g, '##$1#$2##');
                ngModel.$setViewValue(html);
            }

            function pasteHtmlAtCaret(html) {
                let sel, range;
                element.focus();
                if (window.getSelection) {
                    sel = window.getSelection();
                    if (false) {
                        if (typeof window.getSelection != "undefined" &&
                            typeof document.createRange != "undefined") {
                            range = document.createRange();
                            range.selectNodeContents(element[0]);
                            range.collapse(false);
                            sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(range);
                        } else if (typeof document.body.createTextRange != "undefined") {
                            let textRange = document.body.createTextRange();
                            textRange.moveToElementText(element[0]);
                            textRange.collapse(false);
                            textRange.select();
                        }
                    }
                    if (sel.getRangeAt && sel.rangeCount >= 0) {
                        range = sel.getRangeAt(0);
                        range.deleteContents();
                        let el = document.createElement("div");
                        el.innerHTML = html;
                        let frag = document.createDocumentFragment(),
                            node, lastNode;
                        while ((node = el.firstChild)) {
                            lastNode = frag.appendChild(node);
                        }
                        range.insertNode(frag);
                        if (lastNode) {
                            range = range.cloneRange();
                            range.setStartAfter(lastNode);
                            range.collapse(true);
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }
                    }
                } else if (document.selection && document.selection.type != "Control") {
                    document.selection.createRange().pasteHTML(html);
                }

                read();
            }
        }
    };
});
