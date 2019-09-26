'use strict';

angular.module('knowhub')
    .component('sessionChat', {
        templateUrl: 'sections/manage/session-chat/session-chat.html',
        controller: function sessionChatController(userService, $document, $filter, $sce, $timeout, $http, $element, spinnerService, $q, liveNotificationsService, browserUtilsService, sharingSessionReportingService, $scope, sharingSessionWorkflowService, chatPaginationSize, $location) {
            let $ctrl = this;
            let escapeHtml;
            let filter;
            let pendingNewMessages;
            let paginationCursor;
            let ongoingLoading;
            let hasMoreResults;
            let localIdsCount;
            let showScrollToBottomBtn;

            $ctrl.$onInit = function () {
                paginationCursor = null;
                escapeHtml = $filter('escapeHtml');
                filter = $filter('filter');

                let browserSupportsSvg = document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1");
                $ctrl.emojiFormat = browserSupportsSvg ? '.svg' : '.png';

                $ctrl.showScrollToBottomBtn = false;
                $ctrl.arr = angular.ngRepeatToForArray;
                $ctrl.ngRepeatToForArray = angular.ngRepeatToForArray;
                $ctrl.userId = userService.basicInfo().id;

                $element.find('.messages-container').scroll(function () {
                    let newShowScrollToBottomBtn = computeShowScrollToBottomBtn();
                    if (newShowScrollToBottomBtn !== showScrollToBottomBtn) {
                        // avoids repeated calls of $evalAsync
                        showScrollToBottomBtn = newShowScrollToBottomBtn;
                        $scope.$evalAsync(function () {
                            $ctrl.showScrollToBottomBtn = newShowScrollToBottomBtn;
                        })
                    }
                });

                $ctrl.categoryToIconMap = {
                    'symbols': 'heart',
                    'people': 'smile-o',
                    'objects': 'lightbulb-o',
                    'activity': 'futbol-o',
                    'nature': 'leaf',
                    'travel': 'car',
                    'food': 'cutlery',
                    'flags': 'flag',
                    'regional': 'globe'
                };

                $scope.$watch(function () {
                    return $element.find('.chat').height();
                }, function () {
                    $element.find('.messages-container').scrollTo('max');
                });

                $http({
                    url: 'sections/manage/session-chat/emoji.json',
                    method: 'GET'
                }).then(function (response) {
                    $ctrl.emojiCatalogue = response.data;

                    /*angular.forEach($ctrl.emojiCatalogue, function (emojiCodes, category) {
                        preload(emojiCodes, category);
                    });*/
                });

                liveNotificationsService.registerChat({
                    newMessage: newMessage,
                    isOpen: isOpen,
                    init: init,
                    showChat: showChat
                });
            };

            $ctrl.showReloadChaButton = function () {
                return liveNotificationsService.getNotificationsStatus() !== 'enabled';
            };

            $ctrl.reloadChat = function () {
                return init();
            };

            function preload(imageArray, category, index) {
                index = index || 0;
                if (imageArray && imageArray.length > index) {
                    let img = new Image();

                    img.onload = function () {
                        preload(imageArray, category, index + 1);
                    };
                    img.src = 'sections/manage/session-chat/images/emoji/' + category + '/' + imageArray[index] + $ctrl.emojiFormat;
                }
            }

            function computeShowScrollToBottomBtn() {
                let container = $element.find('.messages-container');
                let scrollDistFromBottom = container[0].scrollHeight -
                    container.scrollTop() -
                    container.height();
                return scrollDistFromBottom > 40;
            }

            $ctrl.getEditorApi = function (api) {
                $ctrl.addEmoji = function ($event, category, emojiCode) {
                    api.addEmoji($event, category, emojiCode);
                };
            };

            $ctrl.$onDestroy = function () {
                liveNotificationsService.deregisterChat();
                $document.find("body").removeClass("no-scroll-when-sm");
            };

            $ctrl.setCurrentEmojiCategory = function (category) {
                if ($ctrl.currentEmojiCategory !== category) {
                    $ctrl.currentEmojiCategory = category;
                } else {
                    $ctrl.currentEmojiCategory = null;
                }
            };

            $ctrl.sendNewMessage = function () {
                let localId = localIdsCount;
                $ctrl.currentEmojiCategory = null;
                appendNewMessage({
                    html: getMessageHtml($ctrl.newMessage.trim()),
                    userId: $ctrl.userId,
                    timestamp: new Date(),
                    localId: localId,
                    error: false
                });
                localIdsCount++;
                sharingSessionWorkflowService.sendSessionChatMessage(liveNotificationsService.activeChat().sessionId, $ctrl.newMessage.trim()).then(angular.noop, function () {
                    filter($ctrl.messages, {'localId': localId})[0].error = true;
                });
                $ctrl.newMessage = '';
                $element.find('#newMessageEditor').focus();
                $timeout(function () {
                    $element.find('.messages-container').scrollTo('max');
                });
            };

            $ctrl.scrollToBottom = function () {
                scrollToBottom();
                $ctrl.showScrollToBottomBtn = false;
            };

            $ctrl.onEditorKeyPress = function ($event) {
                if (browserUtilsService.pressedOnEnter($event)) {
                    $event.preventDefault();
                    if ($ctrl.canSendNewMessage()) {
                        $ctrl.sendNewMessage();
                    }
                }
            };

            $ctrl.toggleShowMessageDate = function (message) {
                message.showDate = !message.showDate;

                $timeout(function () {
                    let newShowScrollToBottomBtn = computeShowScrollToBottomBtn();
                    showScrollToBottomBtn = newShowScrollToBottomBtn;
                    $ctrl.showScrollToBottomBtn = newShowScrollToBottomBtn;
                });
            };

            $ctrl.canSendNewMessage = function () {
                return $ctrl.newMessage && $ctrl.newMessage.match(/[^\s*$]/);
            };

            $ctrl.loadChatMessages = function () {
                return _loadChatMessages();
            };

            $ctrl.hideChat = function () {
                showChat(false);
                liveNotificationsService.activeChat(null);
            };

            function init() {
                $ctrl.messages = [];
                pendingNewMessages = [];
                paginationCursor = null;
                hasMoreResults = true;
                localIdsCount = 0;
                $ctrl.newMessage = '';
                $ctrl.initialized = false;
                $ctrl.currentEmojiCategory = null;
                $ctrl.activeChat = liveNotificationsService.activeChat();
                _loadChatMessages();
            }

            function showChat(chatOpen) {
                $ctrl.chatOpen = chatOpen;
                if (chatOpen) {
                    $document.find("body").addClass("no-scroll-when-sm");
                } else {
                    $document.find("body").removeClass("no-scroll-when-sm");
                    $location.search('chat', null);
                }
            }

            function _loadChatMessages() {
                if (ongoingLoading) {
                    return;
                }
                if (!hasMoreResults) {
                    return;
                }
                ongoingLoading = true;
                $ctrl.showScrollToBottomBtn = false;

                let promise = sharingSessionReportingService.getSessionChatMessages($ctrl.activeChat.sessionId, paginationCursor);
                spinnerService.showPromise('chat-messages-spinner', promise);
                promise.then(function (response) {
                    let firstMessageIdInList;
                    if ($ctrl.initialized) {
                        firstMessageIdInList = $ctrl.messages[0].userId + '-' + $ctrl.messages[0].timestamp;
                    }
                    if (!response.messages) {
                        response.messages = [];
                    }
                    angular.forEach(response.messages, function (message) {
                        message.html = getMessageHtml(message.text);
                    });
                    $ctrl.messages = response.messages.reverse().concat($ctrl.messages);

                    angular.forEach(pendingNewMessages, function (message) {
                        if (message.timestamp > $ctrl.messages[$ctrl.messages.length - 1].timestamp) {
                            appendNewMessage(message);
                            $timeout(function () {
                                $ctrl.showScrollToBottomBtn = computeShowScrollToBottomBtn();
                            });
                        }
                    });
                    if (response.messages.length < chatPaginationSize) {
                        hasMoreResults = false;
                    } else {
                        paginationCursor = response.pagination[1];
                    }

                    if (spinnerService.isAppReady()) {
                        scrollToRightPosition(firstMessageIdInList);
                    } else {
                        let cancelAppReadyListener = $scope.$on('spinner:appReady', function () {
                            scrollToRightPosition(firstMessageIdInList);
                            cancelAppReadyListener();
                        })
                    }
                }).finally(function () {
                    ongoingLoading = false;
                });
            }

            function scrollToRightPosition(firstMessageIdInList) {
                $timeout(function () {
                    $timeout(function () {
                        if (!$ctrl.initialized) {
                            $ctrl.initialized = true;
                            $element.find('.messages-container').scrollTo('max');
                        } else {
                            $element.find('.messages-container').scrollTo($element.find('#' + firstMessageIdInList), {offset: {top: -10}});
                        }
                    });
                });
            }

            function scrollToBottom() {
                $element.find('.messages-container').scrollTo('max');
            }

            function getMessageHtml(text) {
                return text.replace(/##([\w]+)#([\w-]+)##/g, function (match, category, emojiCode) {
                    return '<img class="emoji" src="sections/manage/session-chat/images/emoji/' + category + '/' + emojiCode + $ctrl.emojiFormat + '">';
                });
            }

            function newMessage(message) {
                $scope.$evalAsync(function () {
                    let messageObj = {
                        text: message.text,
                        html: getMessageHtml(message.text),
                        timestamp: message.timestamp
                    };
                    if ($ctrl.initialized) {
                        appendNewMessage(messageObj);
                        $timeout(function () {
                            $ctrl.showScrollToBottomBtn = computeShowScrollToBottomBtn();
                        });
                    } else {
                        pendingNewMessages.push(messageObj);
                    }
                });
            }

            function isOpen() {
                return $ctrl.chatOpen;
            }

            function appendNewMessage(newMessage) {
                let i;
                if (!$ctrl.messages.length) {
                    $ctrl.messages.push(newMessage);
                } else {
                    for (i = $ctrl.messages.length - 1; i >= 0; i--) {
                        if ($ctrl.messages[i].timestamp < newMessage.timestamp) {
                            $ctrl.messages.splice(i + 1, 0, newMessage);
                            break;
                        }
                    }
                }
            }
        }

    });
