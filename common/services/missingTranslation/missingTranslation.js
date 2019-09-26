'use strict';

angular
    .module('knowhub')
    .factory('missingTranslationService', function () {
        return function (translationID, uses) {
            return " ";
        };
    });