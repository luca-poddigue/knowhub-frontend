'use strict';

angular.module('knowhub').filter('fileSize', function () {
    let units = [
        'bytes',
        'KB',
        'MB',
        'GB',
        'TB',
        'PB'
    ];

    return function (bytes, decimals) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
            return '';
        }

        let unit = 0;
        decimals = decimals || 0;

        while (bytes >= 1024) {
            bytes /= 1024;
            unit++;
        }

        if (decimals === 0) {
            return Math.round(bytes) + ' ' + units[unit];
        }
        return (Math.round(bytes * 10 * decimals) / (10 * decimals)) + ' ' + units[unit];
    };
});
