'use strict';

angular.module('knowhub').directive('mfSrc', function ($window, $http) {
    return {
        restrict: 'A',
        link: function (scope, elm, attr) {

            let browserSupportsSvg = document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1");
            attr.$observe('mfSrc', function (mfSrc) {
                if (mfSrc.startsWith("data:")) {
                    attr.$set('src', mfSrc);
                    return;
                }
                if (angular.isString(mfSrc)) {
                    if (angular.isUndefined(attr.useHttp) || attr.useHttp === 'true') {
                        let url = mfSrc;
                        if (!attr.format) {
                            url += browserSupportsSvg ? '.svg' : '.png';
                        } else {
                            url += '.' + attr.format;
                        }
                        $http({
                            method: 'GET',
                            url: url,
                            responseType: 'arraybuffer'
                        })
                            .then(function (data) {
                                let arr = new Uint8Array(data.data);

                                let raw = '';
                                let i, j, subArray, chunk = 5000;
                                for (i = 0, j = arr.length; i < j; i += chunk) {
                                    subArray = arr.subarray(i, i + chunk);
                                    raw += String.fromCharCode.apply(null, subArray);
                                }

                                let b64 = $window.btoa(raw);

                                let src = 'data:';
                                switch (attr.format) {
                                    case 'png':
                                        src += 'image/png';
                                        break;
                                    case 'svg':
                                        src += 'image/svg+xml';
                                        break;
                                    default:
                                        src += (browserSupportsSvg ? 'image/svg+xml' : 'image/png');
                                }
                                src += ';base64,' + b64;
                                attr.$set('src', src);
                            });
                    } else {
                        let src = mfSrc;
                        if (attr.format) {
                            src += '.' + attr.format;
                        } else {
                            src += (browserSupportsSvg ? '.svg' : '.png');
                        }
                        attr.$set('src', src);
                    }
                } else {
                    elm.removeAttr('src');
                }


            });
        }
    };
});
