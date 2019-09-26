'use strict';

angular
    .module('knowhub')
    .factory('alertService', function alertFactory($log) {

        let service = this;
        let levels = ['SUCCESS', 'INFO', 'WARNING', 'DANGER'];
        let alertComponentApi;
        let pendingAlertsArgs = [];



        function registerAlertComponent(api) {
            if (alertComponentApi) {
                $log.debug('Only one alert component can be registered.');
                return;
            }
            alertComponentApi = api;
            if (pendingAlertsArgs.length) {
                angular.forEach(pendingAlertsArgs, function(args) {
                    alertComponentApi.display.apply(service, args);
                });
                pendingAlertsArgs = [];
            }
        }

        function displayAlert(name, data, level, timeout, additionalLinks, enableDontShowAnymore, showAlone) {
            if (!levels.contains(level)) {
                $log.debug('Invalid alert level: ' + level);
                return;
            }
            if (!angular.isObject(alertComponentApi)) {
                pendingAlertsArgs.push(arguments);
                return;
            }
            alertComponentApi.display(name, data, level, timeout, additionalLinks, enableDontShowAnymore, showAlone);
        }

        return {
            displayAlert: function (name, data, level, timeout, additionalLinks, enableDontShowAnymore, showAlone) {
                return displayAlert(name, data, level, timeout, additionalLinks, enableDontShowAnymore, showAlone);
            },
            registerAlertComponent: function (api) {
                return registerAlertComponent(api);
            }
        };

    });