'use strict';

angular.module('knowhub').filter('mdToHtml', function () {

    let converter = new showdown.Converter();

    return function (markdownText) {
        let html = converter.makeHtml(markdownText);
        html = html.replace(/(width|height)\s?=\s?"auto"/g, '');
        return html;
    };

});