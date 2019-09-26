'use strict';

angular
    .module('knowhub')
    .factory('liveNotificationsService', function liveNotificationsFactory($location, $log, $exceptionHandler, liveNotificationType, $interval, alertService, $rootScope, spinnerService, $timeout, userAuthService, userBasicInfoService, userStatus, userType, browserUtilsService, cacheService, firebaseMessagingKey) {

        let messaging;

        let stopOnTokenRefresh;
        let currentRegistrationToken;
        let chatApi = null;
        let currentActiveChat = null;
        let notificationsStatus = 'off';
        let $http;
        let messageAlertAudio = new Howl({
            src: ['common/media/message-alert.webm', 'common/media/message-alert.mp3']
        });

        function onMessageFn(event) {
            manageMessage(event.data['firebase-messaging-msg-data'].data);
        }

        function setHttpService(httpService) {
            $http = httpService;
        }

        function registerChat(newChatApi) {
            chatApi = newChatApi;
        }

        function deregisterChat() {
            chatApi = null;
        }

        function initMessaging(requestPermission, showAlerts) {
            if (!browserUtilsService.isLiveNotificationsSupported() ||
                !browserUtilsService.isServiceWorkerSupported()) {
                $rootScope.$evalAsync(function () {
                    notificationsStatus = 'unsupported';
                });
                return;
            }
            if (messaging == null) {
                messaging = firebase.messaging();
                messaging.usePublicVapidKey(firebaseMessagingKey);
            }

            if (userAuthService.isSignedIn() && userBasicInfoService.basicInfo().notificationsEnabled) {
                if ((userBasicInfoService.basicInfo().type === userType.seeker && userStatus.pendingTOSQuestionnaire === userBasicInfoService.basicInfo().status) || [userStatus.active, userStatus.unverifiedEmailChange, userStatus.unconfirmedPassword, userStatus.unconfirmedUserDeletion].contains(userBasicInfoService.basicInfo().status)) {
                    $rootScope.$evalAsync(function () {
                        spinnerService.show("general-spinner");
                        notificationsStatus = 'off';
                    });
                    messaging.getToken()
                        .then(function (currentToken) {
                            if (currentToken) {
                                currentRegistrationToken = currentToken;
                                _putMessagingRegistrationToken(currentToken).then(function () {
                                    notificationsStatus = 'enabled';
                                    if (showAlerts) {
                                        alertService.displayAlert('NOTIFICATIONS_ENABLED', null, 'SUCCESS');
                                    }
                                    navigator.serviceWorker.addEventListener('message', onMessageFn);
                                    stopOnTokenRefresh = messaging.onTokenRefresh(function () {
                                        initMessaging(false);
                                    });
                                });
                            } else {
                                if (requestPermission) {
                                    messaging.requestPermission()
                                        .then(function () {
                                            initMessaging(false);
                                        })
                                        .catch(function () {
                                            $rootScope.$evalAsync(function () {
                                                if (showAlerts) {
                                                    alertService.displayAlert('MESSAGING_NO_PERMISSION', null, 'WARNING');
                                                }
                                                notificationsStatus = 'blocked';
                                            });
                                        });
                                } else {
                                    $rootScope.$evalAsync(function () {
                                        if (showAlerts) {
                                            alertService.displayAlert('MESSAGING_NO_PERMISSION', null, 'WARNING');
                                        }
                                        notificationsStatus = 'blocked';
                                    });
                                }
                            }
                            $rootScope.$evalAsync(function () {
                                spinnerService.hide("general-spinner");
                            });
                        })
                        .catch(function (err) {
                            $rootScope.$evalAsync(function () {
                                if (err.code === 'messaging/notifications-blocked') {
                                    if (showAlerts) {
                                        alertService.displayAlert('MESSAGING_NO_PERMISSION', null, 'WARNING');
                                    }
                                    notificationsStatus = 'blocked';
                                } else {
                                    if (showAlerts) {
                                        alertService.displayAlert('MESSAGING_ERROR', null, 'DANGER', null, [{
                                            titleKey: "ALERT_VIEWER_RETRY",
                                            target: function () {
                                                initMessaging(requestPermission, showAlerts);
                                            },
                                            icon: "repeat"
                                        }]);
                                    }
                                    notificationsStatus = 'error';
                                    $exceptionHandler(new Error(err));
                                }
                                spinnerService.hide("general-spinner");
                            });
                        });
                } else {
                    $rootScope.$evalAsync(function () {
                        notificationsStatus = 'invalid-user-status';
                    });
                }

            }
        }

        function manageMessage(newMessage) {
            $rootScope.$evalAsync(function () {
                if (newMessage.doRedirection) {
                    $location.url(newMessage.redirectionPath);
                    return;
                }

                switch (newMessage.type) {
                    case liveNotificationType.chatMessage:
                        if (chatApi) {
                            if (currentActiveChat && currentActiveChat.sessionId === newMessage.sessionId && chatApi.isOpen()) {
                                chatApi.newMessage(newMessage);
                            } else {
                                if (!newMessage.disableForegroundAlert) {
                                    alertService.displayAlert(newMessage.type, {
                                        senderName: newMessage.senderFullName,
                                        sessionTopic: newMessage.sessionTopic
                                    }, 'INFO', null, [{
                                        titleKey: "ALERT_VIEWER_GO_TO_SESSION",
                                        target: "/manage?mode=dashboard&session=" + newMessage.sessionId + "&chat",
                                        icon: "arrow-right"
                                    }]);
                                }
                            }
                        }
                        break;
                    case liveNotificationType.sessionUpdate:
                    case liveNotificationType.filesUpload:
                    case liveNotificationType.fileDeletion:
                    case liveNotificationType.sessionCompletion:
                    case liveNotificationType.sessionRejection:
                    case liveNotificationType.sessionAccepted:
                    case liveNotificationType.sessionPlanned:
                    case liveNotificationType.sessionUnderInquiry:
                        if (!newMessage.disableForegroundAlert) {
                            alertService.displayAlert(newMessage.type, {
                                senderName: newMessage.senderFullName,
                                sessionTopic: newMessage.sessionTopic
                            }, 'INFO', null, [{
                                titleKey: "ALERT_VIEWER_GO_TO_SESSION",
                                target: "/manage?mode=dashboard&session=" + newMessage.sessionId,
                                icon: "arrow-right"
                            }]);
                        }
                        break;
                    case liveNotificationType.sessionRequest:
                        cacheService.clearCacheResource($location.apiBaseUrl() + 'sessions/filtersData');
                        if (!newMessage.disableForegroundAlert) {
                            alertService.displayAlert(newMessage.type, {
                                senderName: newMessage.senderFullName
                            }, 'INFO', null, [{
                                titleKey: "ALERT_VIEWER_GO_TO_SESSION",
                                target: "/manage?mode=dashboard&session=" + newMessage.sessionId,
                                icon: "arrow-right"
                            }]);
                        }
                        break;
                    case liveNotificationType.sessionPriceLimitIncreaseRejected:
                    case liveNotificationType.sessionPriceLimitIncreaseApproved:
                        let requestedLimit = userBasicInfoService.basicInfo().sessionPriceLimit.requestedLimit;
                        delete userBasicInfoService.basicInfo().sessionPriceLimit.requestedLimit;
                        if (newMessage.type === liveNotificationType.sessionPriceLimitIncreaseApproved) {
                            userBasicInfoService.basicInfo().sessionPriceLimit.limit = requestedLimit;
                        }
                        if (!newMessage.disableForegroundAlert) {
                            alertService.displayAlert(newMessage.type, null, 'INFO', null, [{
                                titleKey: "ALERT_VIEWER_VIEW_PREFERENCES",
                                target: "/account?mode=preferences#session-price-limit",
                                icon: "arrow-right"
                            }]);
                        }
                        break;
                    default:
                        $exceptionHandler(new Error("Unrecognized live notification type: " + newMessage.type));
                }

                if (userBasicInfoService.basicInfo().playNotificationSound && !newMessage.disableNotificationSound && !messageAlertAudio.playing() && !(newMessage.isBackgroundMessage && browserUtilsService.isMobileDevice())) {
                    messageAlertAudio.play();
                }

                $rootScope.$broadcast("liveNotifications:message", newMessage);
            });
        }

        function activeChat(newActiveChat) {
            if (angular.isUndefined(newActiveChat)) {
                return currentActiveChat;
            } else {
                currentActiveChat = newActiveChat;
                if (newActiveChat) {
                    chatApi.init();
                    $timeout(function () {
                        chatApi.showChat(true);
                    });
                } else {
                    chatApi.showChat(false);
                }

            }
        }

        function stopMessaging() {
            currentActiveChat = null;
            if (chatApi) {
                chatApi.showChat(false);
            }

            if (browserUtilsService.isServiceWorkerSupported()) {
                if (stopOnTokenRefresh) {
                    stopOnTokenRefresh();
                }
                navigator.serviceWorker.removeEventListener('message', onMessageFn);
                if (currentRegistrationToken) {
                    messaging.deleteToken(currentRegistrationToken);
                    if (userAuthService.isSignedIn()) {
                        _deleteMessagingRegistrationToken();
                    }
                }
                $rootScope.$evalAsync(function () {
                    notificationsStatus = 'off';
                });
            }
        }

        function getNotificationsStatus() {
            return notificationsStatus;
        }

        function _putMessagingRegistrationToken(token) {
            return $http({
                method: 'PUT',
                url: $location.apiBaseUrl() + 'user/messagingRegistrationToken',
                data: {
                    token: token
                }
            });
        }

        function _deleteMessagingRegistrationToken() {
            let authToken = userAuthService.getAuthToken();
            return $http({
                method: 'DELETE',
                khIgnoreErrors: true,
                url: $location.apiBaseUrl() + 'user/messagingRegistrationToken',
                headers: {
                    'Authorization': authToken
                },
                data: {
                    'token': currentRegistrationToken
                }
            });
        }

        return {
            activeChat: function (newActiveChat) {
                return activeChat(newActiveChat);
            },
            registerChat: function (chatApi) {
                return registerChat(chatApi);
            },
            deregisterChat: function () {
                deregisterChat();
            },
            initMessaging: function (requestPermission, showAlerts) {
                initMessaging(requestPermission, showAlerts);
            },
            stopMessaging: function () {
                stopMessaging();
            },
            getNotificationsStatus: function () {
                return getNotificationsStatus();
            },
            setHttpService: function (httpService) {
                return setHttpService(httpService);
            }
        };

    });
