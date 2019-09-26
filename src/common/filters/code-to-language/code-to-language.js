'use strict';

angular.module('knowhub').filter('codeToLanguage', function (languages) {

    return function (languageCode) {
        return languages[languageCode].nativeName;
    };

});