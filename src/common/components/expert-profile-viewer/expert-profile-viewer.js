'use strict';

angular.module('knowhub')
    .component('expertProfileViewer', {
        bindings: {
            expertProfile: '<'
        },
        templateUrl: 'common/components/expert-profile-viewer/expert-profile-viewer.html',
        controller: function expertProfileViewerController(profilePictureSize, languageProficiencyLevels, skillProficiencyLevels, languages, userService, $filter) {

            let $ctrl = this;
            let translate;
            let number;

            $ctrl.$onInit = function () {
                translate = $filter('translate');
                number = $filter('number');
                $ctrl.profilePictureSize = profilePictureSize;
                $ctrl.languageProficiencyLevels = angular.getObjectValues(languageProficiencyLevels);
                $ctrl.skillProficiencyLevels = angular.getObjectValues(skillProficiencyLevels);
                $ctrl.languages = languages;

                let userCurrentLang = userService.language();
                if ($ctrl.expertProfile.availableLanguages.contains(userCurrentLang)) {
                    $ctrl.profileDisplayLanguage = userCurrentLang;
                } else if ($ctrl.expertProfile.availableLanguages.contains('en')) {
                    $ctrl.profileDisplayLanguage = 'en';
                } else {
                    $ctrl.profileDisplayLanguage = $ctrl.expertProfile.availableLanguages[0];
                }
            };

            $ctrl.formatProfileViewsCount = function () {
                return translate('EXPERT_PROFILE_PROFILE_VIEWED') + ' <strong>' + number($ctrl.expertProfile.viewsCount) + '</strong> ' + translate(Number($ctrl.expertProfile.viewsCount) === 1 ? 'EXPERT_PROFILE_TIME' : 'EXPERT_PROFILE_TIMES');
            }

        }
    });