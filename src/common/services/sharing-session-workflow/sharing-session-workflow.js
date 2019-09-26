'use strict';

angular
    .module('knowhub')
    .factory('sharingSessionWorkflowService', function sharingSessionReportingFactory($http, $location, cacheService, userType) {

        function rejectSession(sessionId, rejectionDetails) {
            return $http({
                method: 'PUT',
                url: $location.apiBaseUrl() + 'session/' + sessionId + '/reject',
                data: rejectionDetails
            });
        }

        function completeSession(sessionId) {
            return $http({
                method: 'PUT',
                url: $location.apiBaseUrl() + 'session/' + sessionId + '/complete'
            });
        }

        function sendSessionChatMessage(sessionId, messageText) {
            return $http({
                method: 'POST',
                khIgnoreErrors: true,
                url: $location.apiBaseUrl() + 'session/' + sessionId + '/chatMessage',
                data: {
                    text: messageText
                }
            });
        }

        function requestSession(sessionRequest) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'session',
                data: sessionRequest
            }).then(function (response) {
                cacheService.clearCacheResource($location.apiBaseUrl() + 'expert/' + sessionRequest.expertId + '/availability');
                return response.data.id;
            });
        }

        function processFeedback(sessionId, feedback) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'session/' + sessionId + '/feedback',
                data: feedback,
                transformRequest: [function (req) {
                    if (!req.sessionHeld) {
                        return {
                            sessionHeld: false
                        };
                    }
                    return req;
                }].concat($http.defaults.transformRequest)
            });
        }

        function acceptSession(currUserType, sessionId, paymentMethodId, paymentIntentId, save) {
            let config = {
                method: 'POST',
                url: $location.apiBaseUrl() + currUserType.toLowerCase() + '/session/' + sessionId + '/accept',
            };
            if (currUserType === userType.seeker) {
                config.data = {
                    paymentMethodId: paymentMethodId,
                    paymentIntentId: paymentIntentId,
                    save: save
                };
            }
            return $http(config).then(function (response) {
                return response.data;
            });
        }

        function updateSession(sessionId, price, timeSpan) {
            return $http({
                method: 'PUT',
                url: $location.apiBaseUrl() + 'session/' + sessionId,
                data: {
                    price: price,
                    timeSpan: timeSpan
                }
            });
        }

        function createSessionReceipt(sessionId, receiptData) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'session/' + sessionId + '/receipt',
                data: receiptData,
            }).then(function (response) {
                return response.data;
            });
        }

        function addSessionReceiptToSessionFiles(dateFolder, sessionId) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'session/' + dateFolder + '/' + sessionId + '/receipt/toSessionFiles'
            });
        }

        function initPurchase() {
            let config = {
                method: 'GET',
                url: $location.apiBaseUrl() + 'initPurchase'
            };
            return $http(config)
                .then(function (response) {
                    return response.data;
                });
        }

        function deletePaymentMethod(id) {
            return $http({
                method: 'DELETE',
                url: $location.apiBaseUrl() + 'paymentMethod/' + id
            });
        }

        return {
            createSessionReceipt: function (sessionId, receiptData) {
                return createSessionReceipt(sessionId, receiptData);
            },
            addSessionReceiptToSessionFiles: function (dateFolder, sessionId) {
                return addSessionReceiptToSessionFiles(dateFolder, sessionId);
            },
            updateSession: function (sessionId, price, timeSpan) {
                return updateSession(sessionId, price, timeSpan);
            },
            acceptSession: function (userType, sessionId, paymentMethodId, paymentIntentId, save) {
                return acceptSession(userType, sessionId, paymentMethodId, paymentIntentId, save);
            },
            completeSession: function (sessionId) {
                return completeSession(sessionId);
            },
            rejectSession: function (sessionId, rejectionDetails) {
                return rejectSession(sessionId, rejectionDetails);
            },
            processFeedback: function (sessionId, feedback) {
                return processFeedback(sessionId, feedback);
            },
            requestSession: function (sessionRequest) {
                return requestSession(sessionRequest);
            },
            sendSessionChatMessage: function (sessionId, messageText) {
                return sendSessionChatMessage(sessionId, messageText);
            },
            initPurchase: function () {
                return initPurchase();
            },
            deletePaymentMethod: function (id) {
                return deletePaymentMethod(id);
            }
        };

    });
