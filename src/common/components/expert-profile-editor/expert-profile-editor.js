'use strict';

angular.module('knowhub')
    .component('expertProfileEditor', {
        bindings: {
            expertProfile: '<',
            onSave: '&',
            onCancel: '&'
        },
        templateUrl: 'common/components/expert-profile-editor/expert-profile-editor.html',
        controller: function expertProfileEditorController($element, $location, filesService, $exceptionHandler, spinnerService, $filter, userAuthService, userService, $scope, alertService, $timeout, $uibModal, localStorageService, searchService, $document, languageProficiencyLevels, skillProficiencyLevels, languages, $anchorScroll) {

            let $ctrl = this;
            let POPOVER_SHOW_TIMEOUT = 600;
            let modalInstance;
            let translate;

            $ctrl.$onInit = function () {
                $ctrl.languageProficiencyLevels = languageProficiencyLevels;
                $ctrl.skillProficiencyLevels = skillProficiencyLevels;
                $ctrl.languages = languages;
                translate = $filter('translate');

                $ctrl.popovers = {};

                searchService.getSkillTags().then(function (skillTags) {
                    $ctrl.skillTags = skillTags;
                }, angular.noop);

                $timeout(function () {
                    $anchorScroll('expert-profile-editor');
                });
            };

            $ctrl.onLanguageTagsChange = function ($event) {
                if ($event.action === 'delete') {
                    $ctrl.deleteProfileLanguage($event.tag.tagName);
                    if ($ctrl.currentLanguage === $event.tag.tagName) {
                        $ctrl.currentLanguage = $ctrl.expertProfile.availableLanguages[0];
                    }
                } else if ($event.action === 'add') {
                    $ctrl.currentLanguage = $event.tag.tagName;
                }
            };

            $ctrl.profileLanguageIsAvailable = function () {
                return $ctrl.expertProfile.availableLanguages.contains($ctrl.currentLanguage);
            };

            $ctrl.getSpokenLanguagesCodes = function () {
                if ($ctrl.expertProfile.spokenLanguages) {
                    return $ctrl.expertProfile.spokenLanguages.map(function (tag) {
                        return tag.tagName;
                    });
                }
            };

            $ctrl.addElement = function (list) {
                list.push({});
            };

            $ctrl.deleteElement = function (list, index) {
                list.splice(index, 1);
            };

            $ctrl.moveElement = function (list, from, to) {
                let tmpEl = list[to];
                list[to] = list[from];
                list[from] = tmpEl;
            };

            $ctrl.displayProfileLanguage = function (language) {
                if ($ctrl.currentLanguage === language) {
                    return;
                }
                if ($ctrl.profileLanguageIsAvailable() && $ctrl.expertProfileForm.$invalid) {
                    alertService.displayAlert('EXPERT_PROFILE_INVALID_FORM_BEFORE_CHANGING_LANG', null, 'WARNING');
                    return;
                }
                $ctrl.currentLanguage = language;
            };

            $ctrl.deleteProfileLanguage = function (languageCode) {
                let langToDelete = languageCode || $ctrl.currentLanguage;
                if (!$ctrl.expertProfile.availableLanguages.contains(langToDelete)) {
                    return;
                }

                let indexToDelete = $ctrl.expertProfile.availableLanguages.indexOf(langToDelete);
                if (indexToDelete >= 0) {
                    $ctrl.expertProfile.availableLanguages.splice(indexToDelete, 1);
                    $ctrl.expertProfile.availableLanguages = angular.copy($ctrl.expertProfile.availableLanguages);
                }
                delete $ctrl.expertProfile.about[langToDelete];
                delete $ctrl.expertProfile.experiences[langToDelete];
                delete $ctrl.expertProfile.education[langToDelete];
                delete $ctrl.expertProfile.skills[langToDelete];

                $ctrl.expertProfileForm.availableLanguages.$setTouched();

                $timeout(function () {
                    $anchorScroll('multilang-profile');
                });
            };

            $ctrl.addProfileLanguage = function () {
                if ($ctrl.expertProfile.availableLanguages.contains($ctrl.currentLanguage)) {
                    return;
                }
                $ctrl.expertProfile.availableLanguages.push($ctrl.currentLanguage);
                $ctrl.expertProfile.availableLanguages = angular.copy($ctrl.expertProfile.availableLanguages);

                $ctrl.expertProfile.about[$ctrl.currentLanguage] = {
                    text: ''
                };
                $ctrl.expertProfile.experiences[$ctrl.currentLanguage] = [];
                $ctrl.expertProfile.education[$ctrl.currentLanguage] = [];
                $ctrl.expertProfile.skills[$ctrl.currentLanguage] = [];

                $ctrl.expertProfileForm.availableLanguages.$setTouched();
            };

            $ctrl.hideMarkdownAlert = function () {
                $ctrl.showMarkdownAlert = false;
                localStorageService.set('markdownAlert', 'false');
            };

            $ctrl.$onChanges = function (changes) {
                if (changes.expertProfile && $ctrl.expertProfile) {
                    prepareExpertProfile();
                    if ($ctrl.expertProfile.availableLanguages.contains(userService.language())) {
                        $ctrl.currentLanguage = userService.language();
                    } else {
                        $ctrl.currentLanguage = $ctrl.expertProfile.availableLanguages[0];
                    }
                }
            };

            $ctrl.showMarkdownSyntaxModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/components/markdown-syntax-modal/markdown-syntax-modal.html',
                    controller: 'markdownSyntaxModal',
                    controllerAs: '$ctrl',
                    size: 'lg',
                    resolve: {}
                });
                modalInstance.result.then(angular.noop, angular.noop);
            };


            $ctrl.cancel = function () {
                $ctrl.onCancel();
            };

            $ctrl.hidePopover = function (name) {
                $timeout.cancel($ctrl.popovers[name].timeout);
                $ctrl.popovers[name].show = false;
            };

            $ctrl.showPopover = function (name) {
                if (!$ctrl.popovers[name]) {
                    $ctrl.popovers[name] = {};
                }
                $ctrl.popovers[name].timeout = $timeout(function () {
                    $ctrl.popovers[name].show = true;
                }, POPOVER_SHOW_TIMEOUT);
            };

            $ctrl.showLinkModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/components/expert-profile-editor/link-modal/link-modal.html',
                    controller: 'linkModal',
                    controllerAs: '$ctrl',
                    windowClass: 'link-modal'
                });
                modalInstance.result.then(function (linkSnippet) {
                    $ctrl.expertProfile.about[$ctrl.currentLanguage].text += linkSnippet;
                }, angular.noop);
            };

            $ctrl.showImageUploadModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/components/expert-profile-editor/image-upload-modal/image-upload-modal.html',
                    controller: 'imageUploadModal',
                    controllerAs: '$ctrl',
                    windowClass: 'image-upload-modal',
                    resolve: {
                        modalConfig: () => ({
                            title: 'EXPERT_PROFILE_ADD_IMAGE',
                            enableImageUrl: true,
                            enableImageResizing: true,
                            uploadFn: filesService.uploadProfileImage
                        })
                    }
                })
                ;
                modalInstance.result.then(function (result) {
                    let imageUrl = result.imageUrl || result.uploadResponse.imageUrl;
                    let imageSnippet;
                    if (!result.imageWidth && !result.imageHeight) {
                        imageSnippet = '![](' + imageUrl + ')';
                    } else {
                        imageSnippet = '![](' + imageUrl + ' =' + (result.imageWidth || '*') + 'x' + (result.imageHeight || '*') + ')';
                    }
                    $ctrl.expertProfile.about[$ctrl.currentLanguage].text += imageSnippet;
                }, angular.noop);
            };

            $ctrl.save = function () {
                return userService.updateExpertProfile($ctrl.expertProfile).then(function () {
                    $ctrl.onSave({
                        expertProfile: $ctrl.expertProfile
                    });
                    alertService.displayAlert('UPDATE_USER', null, 'SUCCESS');
                });
            };

            $ctrl.aboutEditorAction = function (action) {
                let aboutEditor = $element.find('#about');
                aboutEditor.focus();
                switch (action) {
                    case 'bold':
                        aboutEditor.surroundSelectedText('**', '**');
                        break;
                    case 'italic':
                        aboutEditor.surroundSelectedText('*', '*');
                        break;
                    case 'hr':
                        aboutEditor.replaceSelectedText('\n\n---\n');
                        break;
                    case 'hlarge':
                        aboutEditor.surroundSelectedText('#', '#');
                        break;
                    case 'hmedium':
                        aboutEditor.surroundSelectedText('##', '##');
                        break;
                    case 'hsmall':
                        aboutEditor.surroundSelectedText('###', '###');
                        break;
                    case 'ollist':
                        aboutEditor.replaceSelectedText('1. %item% 1\n2. %item% 2\n3. %item% 3\n'.replaceAll('%item%', translate('EXPERT_PROFILE_MARKDOWN_ITEM')));
                        break;
                    case 'ullist':
                        aboutEditor.replaceSelectedText('* %item% 1\n* %item% 2\n* %item% 3\n'.replaceAll('%item%', translate('EXPERT_PROFILE_MARKDOWN_ITEM')));
                        break;
                }
            };

            function prepareExpertProfile() {
                $ctrl.expertProfile = angular.copy($ctrl.expertProfile);

                if (!$ctrl.expertProfile.availableLanguages) {
                    $ctrl.expertProfile.availableLanguages = [];
                }
                if (!$ctrl.expertProfile.spokenLanguages) {
                    $ctrl.expertProfile.spokenLanguages = [];
                }
                if (!$ctrl.expertProfile.experiences) {
                    $ctrl.expertProfile.experiences = {};
                }
                if (!$ctrl.expertProfile.education) {
                    $ctrl.expertProfile.education = {};
                }
                if (!$ctrl.expertProfile.skills) {
                    $ctrl.expertProfile.skills = {};
                }
                if (!$ctrl.expertProfile.about) {
                    $ctrl.expertProfile.about = {};
                }
            }
        }
    });
