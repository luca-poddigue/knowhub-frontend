'use strict';

angular.module('knowhub')
    .component('seekerProfileViewer', {
        bindings: {
            userInfo: '<'
        },
        templateUrl: 'common/components/seeker-profile-viewer/seeker-profile-viewer.html',
        controller: function seekerProfileEditorController(userAuthService, userService, locales, profilePictureSize) {

            let $ctrl = this;

            $ctrl.$onInit = function () {
                $ctrl.profilePictureSize = profilePictureSize;
                $ctrl.email = userAuthService.getAuthInfo().email;
            };

            $ctrl.$onChanges = function (changes) {
                if (!$ctrl.userInfo) {
                    return;
                }
                if (changes.userInfo) {
                    $ctrl.userInfo.locale = userService.basicInfo().locale;
                }
            };

            $ctrl.formatLocaleString = function formatLocaleString(locale) {
                let localeStr = "";
                if (locale) {
                    localeStr = locales[locale].language.nativeName;
                    if (angular.isDefined(locales[locale].country)) {
                        localeStr += " (" + locales[locale].country.nativeName + ")";
                    }
                }
                return localeStr;
            };

        }
    });