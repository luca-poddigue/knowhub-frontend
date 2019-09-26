'use strict';

angular.module('knowhub').filter('escapeHtml', function () {

    let entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };

    return function (str) {
        return String(str).replace(/[&<>"'\/`=]/g, function (match, offset, string) {
            if (string.substring(offset).startsWith('&nbsp;')) {
                return match;
            }
            return entityMap[match];
        });
    };
});
