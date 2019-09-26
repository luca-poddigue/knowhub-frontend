'use strict';

angular
    .module('knowhub')
    .factory('userBasicInfoService', function userBasicInfoFactory() {

        let basicInfoObj = null;

        function basicInfo(newBasicInfoObj) {
            if (newBasicInfoObj) {
                basicInfoObj = newBasicInfoObj;
            } else {
                return basicInfoObj;
            }
        }

        return {
            basicInfo: function (newBasicInfoObj) {
                return basicInfo(newBasicInfoObj);
            }
        };

    });
