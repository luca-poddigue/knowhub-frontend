'use strict';

angular.module('knowhub')
    .component('tagsPicker', {
        require: {
            ngModel: ''
        },
        bindings: {
            allowCustomTags: '<?',
            enableProficiency: '<?',
            tags: '<', // array of labels or object
            proficiencyLevels: '<?',
            onTagsChange: '&?',
            labelProperty: '@?',
            editableTags: '<?',
            noTagsFoundKey: '@?'
        },
        templateUrl: 'common/components/tags-picker/tags-picker.html',
        controller: function tagsPickerController($element, $scope, browserUtilsService, $sce, $exceptionHandler, $document) {

            let $ctrl = this;
            let MIN_TERM_LENGTH = 3;
            let MAX_DISPLAYED_MATCHING_TAGS = 15;
            let fuzzySearch;
            let missingProficiencyAlert;
            let currentTerm;
            let tags;

            $ctrl.$onInit = function () {
                $ctrl.hasFocus = false;
                $ctrl.mode = 'add';
                $ctrl.selectedExistingTag = false;
            };

            $ctrl.onInputKeyPress = function ($event) {
                if (browserUtilsService.pressedOnEnter($event)) {
                    $event.stopPropagation();
                    $event.preventDefault();
                    if (($ctrl.allowCustomTags || ($ctrl.selectedExistingTag && $ctrl.enableProficiency)) && $ctrl.tagsPickerForm.$valid) {
                        $ctrl.addTag({value: $ctrl.tag}, $event);
                    }
                } else {
                    $ctrl.selectedExistingTag = false;
                }
            };

            $ctrl.stopEnterKey = function ($event) {
                if (browserUtilsService.pressedOnEnter($event)) {
                    $event.stopPropagation();
                    $event.preventDefault();
                }
            };

            $ctrl.isArray = function (el) {
                return angular.isArray(el);
            };

            $ctrl.isObject = function (el) {
                return angular.isObject(el) && !angular.isArray(el);
            };

            $ctrl.$onChanges = function (changes) {
                if (changes.tags) {
                    if ($ctrl.isArray($ctrl.tags)) {
                        tags = angular.copy($ctrl.tags);
                    } else if ($ctrl.isObject($ctrl.tags)) {
                        tags = [];
                        angular.forEach($ctrl.tags, function (lang) {
                            this.push(lang[$ctrl.labelProperty]);
                        }, tags);
                    } else {
                        tags = [];
                    }

                    fuzzySearch = new Fuse(tags, {
                        shouldSort: true,
                        caseSensitive: false,
                        threshold: 0.4
                    });

                    if (currentTerm) {
                        $ctrl.searchSuggestions(currentTerm);
                    }
                }
            };

            $ctrl.proficiencyPickerExposedFunctions = function (functions) {
                missingProficiencyAlert = functions.missingValueAlert;
            };

            $ctrl.onFocus = function () {
                $ctrl.hasFocus = true;
            };


            $ctrl.$postLink = function () {
                $ctrl.ngModel.$render = function () {
                    $ctrl.selectedTags = $ctrl.ngModel.$viewValue || [];
                };
                $ctrl.selectedTags = $ctrl.ngModel.$viewValue || [];

                $document.bind('click', function () {
                    if ($ctrl.hasFocus) {
                        $ctrl.ngModel.$setTouched();
                        $ctrl.hasFocus = false;
                    }
                    $scope.$evalAsync(function () {
                        clear();
                    });
                });
            };

            function detectAlreadyAddedTag(term) {
                let i;
                for (i = 0; i < $ctrl.selectedTags.length; i++) {
                    if (($ctrl.isArray($ctrl.tags) && $ctrl.selectedTags[i].tagName.toLowerCase() === term.toLowerCase()) ||
                        (!$ctrl.isArray($ctrl.tags) && $ctrl.tags[$ctrl.selectedTags[i].tagName][$ctrl.labelProperty].toLowerCase() === term.toLowerCase())) {
                        $ctrl.mode = 'edit';
                        $ctrl.selectedExistingTag = true;
                        break;
                    }
                }
            }

            $ctrl.searchSuggestions = function (term) {
                currentTerm = term;
                if (!term || term.length < MIN_TERM_LENGTH) {
                    $ctrl.suggestions = [];
                    $ctrl.showTooManyTagsMessage = false;
                    $ctrl.showMatchingTags = false;
                } else {
                    let allSuggestions = fuzzySearch
                        .search(term);
                    $ctrl.showTooManyTagsMessage = allSuggestions.length > MAX_DISPLAYED_MATCHING_TAGS;
                    $ctrl.suggestions =
                        allSuggestions.slice(0, MAX_DISPLAYED_MATCHING_TAGS)
                            .map(function (i) {
                                let val = tags[i];
                                return {
                                    value: val,
                                    label: $sce.trustAsHtml(highlight(val, term))
                                };
                            });
                    $ctrl.showMatchingTags = $ctrl.suggestions.length || $ctrl.noTagsFoundKey;
                }
                if ($ctrl.editableTags) {
                    $ctrl.mode = 'add';
                    $ctrl.proficiency = null;
                    if (term) {
                        detectAlreadyAddedTag(term);
                    }
                }
            };

            $ctrl.editSelectedTag = function (tag, $event) {
                if (!$ctrl.editableTags) {
                    return;
                }
                clear();
                if ($ctrl.isArray($ctrl.tags)) {
                    $ctrl.tag = tag.tagName;
                } else {
                    $ctrl.tag = $ctrl.tags[tag.tagName][$ctrl.labelProperty];
                }
                if (tag.proficiency) {
                    $ctrl.proficiency = {level: tag.proficiency};
                }
                $ctrl.mode = 'edit';
                $ctrl.selectedExistingTag = true;
                $event.stopPropagation();
            };

            $ctrl.selectExistingTag = function (suggestion, $event) {
                clear();
                $ctrl.selectedExistingTag = true;
                if ($ctrl.enableProficiency) {
                    $ctrl.tag = suggestion.value;
                    detectAlreadyAddedTag($ctrl.tag);
                } else {
                    $ctrl.addTag(suggestion, $event);
                }
            };

            $ctrl.addTag = function (selected, $event) {
                let i;
                let tagId;
                let newTag;
                let alreadySelectedTag = false;

                $event.stopPropagation();
                $event.preventDefault();

                if ($ctrl.isArray($ctrl.tags)) {
                    newTag = selected.value;
                } else {
                    for (tagId in $ctrl.tags) {
                        if ($ctrl.tags.hasOwnProperty(tagId) && $ctrl.tags[tagId][$ctrl.labelProperty].toLowerCase() === selected.value.toLowerCase()) {
                            newTag = tagId;
                            break;
                        }
                    }
                }

                let tagObj;
                if (!$ctrl.enableProficiency) {
                    tagObj = {
                        tagName: newTag
                    };
                } else {
                    if (!$ctrl.proficiency) {
                        missingProficiencyAlert();
                        return;
                    }
                    tagObj = {
                        tagName: newTag,
                        proficiency: $ctrl.proficiency.level
                    };
                }

                for (i = 0; i < $ctrl.selectedTags.length; i++) {
                    if (($ctrl.isArray($ctrl.tags) && $ctrl.selectedTags[i].tagName.toLowerCase() === newTag.toLowerCase()) ||
                        (!$ctrl.isArray($ctrl.tags) && $ctrl.selectedTags[i].tagName === newTag.toLowerCase())) {
                        alreadySelectedTag = true;
                        $ctrl.selectedTags[i] = tagObj;
                    }
                }
                if (!alreadySelectedTag) {
                    $ctrl.selectedTags.push(tagObj);
                }

                clear();
                $ctrl.ngModel.$setViewValue(angular.copy($ctrl.selectedTags));
                if ($ctrl.onTagsChange) {
                    $ctrl.onTagsChange({
                        $event: {
                            tag: tagObj,
                            action: 'add',
                            allTags: $ctrl.selectedTags
                        }
                    });
                }
            };

            $ctrl.deleteTag = function (index) {
                let deletedTag = $ctrl.selectedTags[index];
                $ctrl.selectedTags.splice(index, 1);
                $ctrl.ngModel.$setViewValue(angular.copy($ctrl.selectedTags));
                if ($ctrl.onTagsChange) {
                    $ctrl.onTagsChange({
                        $event: {
                            tag: deletedTag,
                            action: 'delete',
                            allTags: $ctrl.selectedTags
                        }
                    });
                }
            };

            function clear() {
                $ctrl.tag = null;
                $ctrl.proficiency = null;
                $ctrl.suggestions = [];
                $ctrl.showMatchingTags = false;
                $ctrl.showTooManyTagsMessage = false;
                $ctrl.selectedExistingTag = false;
                $ctrl.mode = 'add';
            }

            function highlight(str, term) {
                let highlight_regex = new RegExp('(' + term + ')', 'gi');
                let highlightedStr = str.replace(highlight_regex,
                    '<span class="highlight">$1</span>');
                return highlightedStr;
            }
        }
    });