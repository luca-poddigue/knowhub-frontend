'use strict';

angular.module('knowhub')
    .component('tabLog', {
        templateUrl: 'sections/manage/tab-log/tab-log.html',
        controller: function tabLogController($uibModal, userAuthService, $q, $rootScope, userService, spinnerService, $translatePartialLoader, $filter, userType, defaultPaginationSize, $scope) {

            let $ctrl = this;
            let paginationCursor;
            let ongoingLoading;
            let hasMoreResults;
            let translate;

            $ctrl.$onInit = function () {
                translate = $filter('translate');
                ongoingLoading = false;
                hasMoreResults = true;
                $ctrl.isAppReady = spinnerService.isAppReady;
                paginationCursor = null;

                /* Keep aligned to EventType.java */
                $ctrl.eventTypeIds = [
                    'PROMO_CODE_ACTIVATION',
                    'SESSION_COMPLETED',
                    'SESSION_UPDATED',
                    'SESSION_ACCEPTED',
                    'SESSION_REQUEST',
                    'SESSION_REJECTED',
                    'SESSION_PLANNED',
                    'FEEDBACK_PROVIDED',
                    'FEEDBACK_RECEIVED',
                    'SESSION_UNDER_INQUIRY',
                    'ADDED_UNRESOLVED_LITIGATION',
                    'LITIGATION_SOLVED',
                    'SESSION_FILE_DELETED',
                    'SESSION_FILE_UPLOADED',
                    'SESSION_FILE_REPLACED',
                    'EMAIL_CHANGE',
                    'PASSWORD_RESET',
                    'USER_CREATED',
                    'SESSION_PRICE_LIMIT_INCREASE_REQUEST',
                    'SESSION_PRICE_LIMIT_INCREASE_APPROVED',
                    'SESSION_PRICE_LIMIT_INCREASE_REJECTED',
                    'PAYOUT_INITIATED',
                    'PAYOUT_EXECUTED',
                    'PAYOUT_ERROR',
                    'PAYOUT_RETRIED'
                ];

                $ctrl.userType = userType;

                $ctrl.logs = null;
                initLogsConfig();
            };

            $ctrl.buildFileHref = function (fileUrl) {
                return fileUrl + '?Authorization=' + userAuthService.getAuthToken();
            };

            $ctrl.shouldPreventClick = function () {
                let activeTypes = 0;
                angular.forEach($ctrl.logsConfig.userTypes, function (value) {
                    if (value) {
                        activeTypes++;
                    }
                });
                return activeTypes === 1;
            };

            function initLogsConfig() {
                $ctrl.logsConfig = {
                    userTypes: {}
                };
                $ctrl.logsConfig.userTypes[userType.user] = true;
                $ctrl.logsConfig.userTypes[userType.seeker] = true;
                $ctrl.logsConfig.userTypes[userType.expert] = true;
            }

            $ctrl.loadLogs = function () {
                _loadLogs($ctrl.logsConfig, true);
            };

            $ctrl.loadMoreLogs = function () {
                return _loadLogs($ctrl.logsConfig, false);
            };

            function _loadLogs(logsConfig, reset) {
                if (ongoingLoading) {
                    return;
                }
                if (!reset && !hasMoreResults) {
                    return;
                }
                ongoingLoading = true;
                if (reset) {
                    paginationCursor = null;
                    hasMoreResults = true;
                }

                return userService.getUserLogs(logsConfig, paginationCursor).then(function (response) {
                    let newLogs = response.data.logs || [];
                    angular.forEach(newLogs, function (log) {
                        let relatedData = log.relatedData;
                        let splitRelatedData = [];
                        angular.forEach(relatedData, function (data) {
                            let splitData = data.split(/:(.+)/);
                            let logType = 'text';
                            //custom formatting
                            switch (splitData[0]) {
                                case 'invoice':
                                    logType = 'file-link';
                                    break;
                                case 'reputation':
                                    splitData[1] = $filter('number')(splitData[1], 0);
                                    break;
                                case 'price':
                                case 'earnedAmount':
                                case 'expertIncome':
                                case 'serviceFee':
                                case 'requestedLimit':
                                case 'refundedAmount':
                                    var regex = /{{(\w*)}}([\d.]*)/;
                                    var match = regex.exec(splitData[1]);
                                    splitData[1] = translate('CURRENCY_SYMBOL_' + match[1]) + ' ' + $filter('number')(match[2], 2);
                                    break;
                                case 'fileSize':
                                    splitData[1] = $filter('fileSize')(splitData[1], 2);
                                    break;
                                case 'rejectedBy':
                                    splitData[1] = translate("COMMON_" + (log.userType === splitData[1] ? 'YOU' : splitData[1])).toLowerCase().trim() || splitData[1];
                                    break;
                                case 'promoType':
                                    splitData[1] = translate("ACCOUNT_PROMO_CODES_TYPE_" + splitData[1]);
                            }
                            this.push({
                                property: translate('LOGS_DATA_' + splitData[0].toUpperCase()),
                                value: splitData[1],
                                type: logType
                            });
                        }, splitRelatedData);
                        log.relatedData = splitRelatedData;
                    });
                    if (newLogs.length < defaultPaginationSize) {
                        hasMoreResults = false;
                    } else {
                        paginationCursor = response.data.pagination[1];
                    }
                    if (!$ctrl.logs || reset) {
                        $ctrl.logs = [];
                    }
                    if (angular.isArray(newLogs)) {
                        $ctrl.logs = $ctrl.logs.concat(newLogs);
                    }
                }, angular.noop).finally(function () {
                    ongoingLoading = false;
                });
            }

        }
    });
