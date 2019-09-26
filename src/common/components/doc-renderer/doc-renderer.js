'use strict';

angular.module('knowhub')
    .component('docRenderer', {
        templateUrl: 'common/components/doc-renderer/doc-renderer.html',
        bindings: {
            translationKey: '@',
            substitutions: '<?',
            disableUrlLinks: '<?'
        },
        controller: function docRendererController($rootScope, $scope, $window, $anchorScroll, $filter, $location, $compile, $element, $timeout) {

            let $ctrl = this;
            let unscribeTranslationListener;

            $ctrl.$onInit = function () {
                $ctrl.questions = [];
                $ctrl.outlineStyle = {};

                angular.element($window).on("scroll", function () {
                    let outlineHeight = $element.find('.outline').height();
                    let windowHeight = $window.innerHeight;
                    let docContainerHeight = $element.find('.doc-container').height();
                    let thr = angular.element($element)[0].getBoundingClientRect().top;
                    if (outlineHeight < windowHeight - 180) {
                        $scope.$applyAsync(function () {
                            $ctrl.outlineStyle.top = thr < 80 ? -thr + 80 : 0;
                        });
                    } else if (outlineHeight - thr + 100 > docContainerHeight) {
                        $scope.$applyAsync(function () {
                            $ctrl.outlineStyle.top = docContainerHeight - outlineHeight;
                        });
                    } else {
                        let outlineRect = $element.find('.outline')[0].getBoundingClientRect();
                        if (outlineRect.top > 80 || outlineRect.bottom < 300) {
                            $scope.$applyAsync(function () {
                                $ctrl.outlineStyle.top = thr < 80 ? -thr + 80 : 0;
                            });
                        }
                    }
                });
                angular.element($window).on("resize", function () {
                    let outlineHeight = $element.find('.outline').height();
                    let docContainerHeight = $element.find('.doc-container').height();
                    if ($ctrl.outlineStyle.top > docContainerHeight - outlineHeight) {
                        $scope.$applyAsync(function () {
                            $ctrl.outlineStyle.transition = 'none';
                            $window.scrollTo(0, docContainerHeight - outlineHeight - 100);
                        });
                        $timeout(function () {
                            delete $ctrl.outlineStyle.transition;
                        }, 50);
                    }
                });

                initDoc();
                unscribeTranslationListener = $rootScope.$on('$translateChangeSuccess', function () {
                    initDoc();
                });

                $ctrl.selectedItemId = $location.hash();

                $scope.$on('$routeUpdate', function () {
                    $ctrl.selectedItemId = $location.hash();
                    $anchorScroll();
                });
            };

            $ctrl.$onDestroy = function () {
                unscribeTranslationListener();
                angular.element($window).off("scroll");
                angular.element($window).off("resize");
            };

            $ctrl.$onChanges = function (changes) {
                if (changes.translationKey && $ctrl.translationKey) {
                    initDoc();
                }
            };

            function initDoc() {
                let newDoc = $filter('translate')($ctrl.translationKey);
                if (newDoc === $ctrl.translationKey) {
                    return;
                }
                $ctrl.outlineItems = [];
                newDoc = newDoc.replace(/<br>/g, '\r\n');
                newDoc = $filter('mdToHtml')(newDoc);
                newDoc = newDoc.replace(/<a href="(http.*?)">(.*?)<\/a>/g, '<a href="$1" target="_blank">$2</a>');
                newDoc = newDoc.replace(/<a href="#(.*?)">(.*?)<\/a>/g, '<a ng-click="$ctrl.goToAnchor(\'$1\')">$2</a>');
                if (!$ctrl.disableUrlLinks) {
                    newDoc = newDoc.replace(/<a href="(?!http)(.*?)">(.*?)<\/a>/g, '<a ng-click="$ctrl.goToUrl(\'$1\')">$2</a>');
                } else {
                    newDoc = newDoc.replace(/<a href="(?!http)(.*?)">(.*?)<\/a>/g, '<a class="disabled-link">$2</a>');
                }
                newDoc = newDoc.replace(/<h3 id="(.*?)">(.+?)<\/h3>/g, function replacer(match, p1, p2) {

                    $ctrl.outlineItems.push({
                        id: p1,
                        text: p2
                    });
                    return match;
                });
                if ($ctrl.substitutions) {
                    newDoc = newDoc.replace(/%%(.*?)%/g, function replacer(match, p1) {
                        let substitution = $ctrl.substitutions[p1];
                        if (substitution) {
                            if (!substitution.value) {
                                return substitution;
                            } else {
                                if (substitution.type === 'date') {
                                    return $filter('date')(substitution.value, 'longDate');
                                } else {
                                    return substitution.value;
                                }
                            }
                        } else {
                            return 'MISSING_SUBSTITUTION';
                        }
                    });
                }
                $element.find('#doc-container').empty().append($compile(newDoc)($scope));
            }

            $ctrl.goToAnchor = function (anchorId) {
                $location.hash(anchorId);
            };

            $ctrl.goToUrl = function (url) {
                $location.urlWithReplace(url);
            };

        }
    });
