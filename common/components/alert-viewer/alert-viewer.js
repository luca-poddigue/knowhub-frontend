'use strict';

angular.module('knowhub')
    .component('alertViewer', {
        bindings: {},
        templateUrl: 'common/components/alert-viewer/alert-viewer.html',
        controller: function alertViewerController($exceptionHandler, $location, $translatePartialLoader, alertService, $timeout, $filter, $scope, $rootScope, localStorageService) {

            let $ctrl = this;
            let DEFAULT_TIMEOUT = 8000;
            let translate;
            let unscribeRouteChangeListener;

            $ctrl.$onInit = function () {
                $ctrl.alerts = {};
                translate = $filter('translate');
                alertService.registerAlertComponent({
                    display: function (name, data, level, timeout, additionalLinks, enableDontShowAnymore, showAlone) {
                        display(name, data, level, timeout, additionalLinks, enableDontShowAnymore, showAlone);
                    }
                });

                unscribeRouteChangeListener = $rootScope.$on('$routeChangeStart', function () {
                    angular.forEach($ctrl.alerts, function (alert, alertId) {
                        hideAlert(alertId);
                    });
                });

                $ctrl.message = function (messageKey, messageData) {
                    let message = translate(messageKey);
                    angular.forEach(messageData, function (value, key) {
                        message = message.replaceAll('%%' + key + '%%', $filter('escapeHtml')(value));
                    });
                    return message;
                };

                $ctrl.hideAlert = hideAlert;

                $ctrl.dontShowAnymore = function (alertId) {
                    localStorageService.set("dontShowAlert." + alertId, true);
                    hideAlert(alertId);
                };

                $ctrl.goToReportIssue = function (alertId) {
                    $location.urlWithReplace('/contactUs').search('reason', 'APP_ISSUE');
                    $rootScope.$broadcast('alertViewer:reportIssue');
                    hideAlert(alertId);
                };

                $ctrl.processAdditionalLink = function (alertId, action) {
                    if (angular.isString(action)) {
                        $location.urlWithReplace(action);
                    }
                    else if (angular.isFunction(action)) {
                        action();
                    } else {
                        $exceptionHandler(new Error('Action for additional link can be a string or a function.'))
                    }
                    hideAlert(alertId);
                };

                function hideAlert(alertId) {
                    if ($ctrl.alerts[alertId].timeoutObj) {
                        $timeout.cancel($ctrl.alerts[alertId].timeoutObj);
                    }
                    delete $ctrl.alerts[alertId];
                }

                function display(name, data, level, timeout, additionalLinks, enableDontShowAnymore, showAlone) {
                    if (showAlone) {
                        $ctrl.alerts = {};
                    }
                    let alertId = _getAlertId(name, data);

                    let alertTimeout;
                    if (timeout > 0) {
                        alertTimeout = timeout;
                    } else if (level === 'SUCCESS' && !(timeout > 0)) {
                        alertTimeout = DEFAULT_TIMEOUT;
                    }
                    if (localStorageService.get("dontShowAlert." + alertId)) {
                        return;
                    }

                    $ctrl.alerts[alertId] = {
                        messageKey: 'ALERT_' + level + '_' + name,
                        messageData: data,
                        level: level,
                        enableDontShowAnymore: enableDontShowAnymore,
                        additionalLinks: additionalLinks
                    };
                    if (!timeout && level === 'SUCCESS') {
                        timeout = DEFAULT_TIMEOUT;
                    }
                    if (alertTimeout) {
                        $ctrl.alerts[alertId].timeoutObj = $timeout(function () {
                            delete $ctrl.alerts[alertId];
                        }, timeout);
                    }
                }
            };

            $ctrl.$onDestroy = function () {
                unscribeRouteChangeListener();
            };

            function _getAlertId(name, data) {
                let dataStr = '';
                if (angular.isObject(data)) {
                    angular.forEach(data, function (value) {
                        dataStr = dataStr + value + '_';
                    });
                }
                return name + '-' + dataStr.hashCode();
            }
        }
    });