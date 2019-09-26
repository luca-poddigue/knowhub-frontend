'use strict';

angular.module('knowhub')
    .component('sharingSession', {
        templateUrl: "sections/manage/sharing-session/sharing-session.html",
        bindings: {
            sessionOverview: '<?',
            onShowChat: '&'
        },
        controller: function sharingSessionController($timeout, payoutStatus, userType, sessionStatus, sharingSessionWorkflowService, userService, $uibModal, $filter, sharingSessionReportingService, liveNotificationsService, alertService, userBasicInfoService, liveNotificationType, $scope, $q) {

            let $ctrl = this;
            let translate;
            let modalInstance;
            let missingPriceAlertTimeout;

            $ctrl.$onInit = function () {
                translate = $filter('translate');
                $ctrl.loading = false;
                $ctrl.sessionStatus = sessionStatus;
                $ctrl.userType = userType;
                $ctrl.payoutStatus = payoutStatus;
                $ctrl.currentUserType = $ctrl.sessionOverview.seeker ? userType.expert : userType.seeker;
                $ctrl.showReloadSessionButton = function () {
                    return liveNotificationsService.getNotificationsStatus() !== 'enabled';
                };

                if ($ctrl.sessionOverview.showDetailsRightAway) {
                    toggleFullSession();
                }
                if ($ctrl.sessionOverview.showChatRightAway) {
                    toggleShowChat();
                }

                $scope.$on('liveNotifications:message', function (event, data) {
                    if ($ctrl.sessionOverview.id === data.sessionId &&
                        [liveNotificationType.sessionUpdate,
                            liveNotificationType.sessionCompletion,
                            liveNotificationType.sessionRejection,
                            liveNotificationType.sessionAccepted,
                            liveNotificationType.sessionPlanned,
                            liveNotificationType.sessionUnderInquiry].contains(data.type)) {
                        reloadSession();
                    }
                });
            };

            $ctrl.reloadSession = reloadSession;

            $ctrl.isPriceEditable = () => {
                return $ctrl.currentUserType === $ctrl.userType.expert && $ctrl.sessionOverview.status === $ctrl.sessionStatus.pending;
            };

            $ctrl.isSessionChatActive = isSessionChatActive;

            $ctrl.toggleShowChat = toggleShowChat;

            $ctrl.toggleFullSession = toggleFullSession;

            $ctrl.formatRejectionReasonTitle = function () {
                let rejectedBy;
                if ($ctrl.fullSession.rejectedBy === userType.system) {
                    rejectedBy = 'KNOWHUB';
                } else if ($ctrl.fullSession.rejectedBy === $ctrl.currentUserType) {
                    rejectedBy = 'YOU';
                } else {
                    rejectedBy = $ctrl.fullSession.rejectedBy;

                }
                return translate('SHARING_SESSION_REASON_FOR_REJECTION_PROVIDED_BY_' + rejectedBy);
            };

            $ctrl.formatRejectionReason = function () {
                if ($ctrl.fullSession.rejectedBy === userType.system) {
                    if ($ctrl.fullSession.rejectionReason === 'durationLimit') {
                        return translate('SHARING_SESSION_CLOSED_DUE_TO_DURATION_LIMIT');
                    } else if ($ctrl.fullSession.rejectionReason === 'refundBySupport') {
                        return translate('SHARING_SESSION_CLOSED_DUE_TO_REFUND_BY_SUPPORT_' + $ctrl.currentUserType);
                    }
                } else {
                    return $ctrl.fullSession.rejectionReason;
                }
            };

            $ctrl.formatSessionStatus = function () {
                if ($ctrl.sessionOverview.status === sessionStatus.acceptedByExpert && $ctrl.currentUserType === userType.expert) {
                    return translate('DASHBOARD_SESSION_STATUS_ACCEPTED_BY_YOU');
                } else {
                    return translate('DASHBOARD_SESSION_STATUS_' + $ctrl.sessionOverview.status);
                }

            };

            $ctrl.formatReputationDelta = function (reputationDelta) {
                return (reputationDelta > 0 ? '+' : '') + $filter('number')(reputationDelta, 0);
            };

            $ctrl.showSessionRejectionModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'sections/manage/session-rejection-modal/session-rejection-modal.html',
                    controller: 'sessionRejectionModal',
                    controllerAs: '$ctrl',
                    resolve: {
                        sessionId: function () {
                            return $ctrl.sessionOverview.id;
                        }
                    }
                });

                modalInstance.result.then(function (rejectionDetails) {
                    $ctrl.fullSession.status = sessionStatus.rejected;
                    $ctrl.fullSession.rejectionReason = rejectionDetails.reason;
                    $ctrl.fullSession.rejectedBy = $ctrl.currentUserType;
                    $ctrl.sessionOverview.status = sessionStatus.rejected;
                    $scope.$emit('sharingSession:sessionChange');
                    closeChatIfNeeded();
                }, angular.noop);
            };

            $ctrl.showReportAbuseModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'common/components/abuse-report-modal/abuse-report-modal.html',
                    controller: 'abuseReportModal',
                    controllerAs: '$ctrl',
                    resolve: {
                        expertId: function () {
                            return $ctrl.currentUserType === userType.seeker ? $ctrl.sessionOverview.expert.id : $ctrl.sessionOverview.seeker.id;
                        },
                        sessionId: function () {
                            return $ctrl.sessionOverview.id;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    alertService.displayAlert('ABUSE_REPORT', null, 'SUCCESS');
                }, angular.noop);
            };

            $ctrl.sessionStatusAllowsTimeSpanUpdate = function () {
                return [$ctrl.sessionStatus.pending, $ctrl.sessionStatus.planned, $ctrl.sessionStatus.acceptedByExpert].contains($ctrl.sessionOverview.status);
            };

            $ctrl.getStatusIcon = function () {
                if ($ctrl.fullSession.status === sessionStatus.completed) {
                    return 'trophy';
                } else if ($ctrl.fullSession.status === sessionStatus.inquiry) {
                    return 'user-secret';
                } else if ($ctrl.fullSession.status === sessionStatus.pending) {
                    return 'envelope-open';
                } else if ($ctrl.fullSession.status === sessionStatus.acceptedByExpert) {
                    if ($ctrl.currentUserType === userType.expert) {
                        return 'calendar-check-o';
                    } else {
                        return 'calendar-o';
                    }
                } else if ($ctrl.fullSession.status === sessionStatus.rejected) {
                    return 'ban';
                } else if ($ctrl.fullSession.status === sessionStatus.planned) {
                    return 'calendar';
                }
            };

            $ctrl.onFilesChanged = function () {
                sharingSessionReportingService.getSessionFiles($ctrl.sessionOverview.id).then(function (filesBucket) {
                    $ctrl.fullSession.filesBucket = filesBucket;
                }, angular.noop);
            };

            $ctrl.showChat = showChat;

            $ctrl.showInvoiceBtn = showInvoiceBtn;

            $ctrl.showFlowControl = function () {
                return $ctrl.showChat() || showInvoiceBtn();
            };

            $ctrl.showCompleteSessionModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'sections/manage/complete-session-modal/complete-session-modal.html',
                    controller: 'completeSessionModal',
                    controllerAs: '$ctrl',
                    resolve: {
                        sessionId: function () {
                            return $ctrl.sessionOverview.id;
                        }
                    }
                });
                modalInstance.result.then(function () {
                    $ctrl.sessionOverview.status = sessionStatus.completed;
                    $ctrl.fullSession.status = sessionStatus.completed;
                    $ctrl.fullSession.payoutStatus = $ctrl.payoutStatus.waitingForSeekerFeedback;
                    $scope.$emit('sharingSession:sessionChange');
                    closeChatIfNeeded();
                }, angular.noop);
            };

            $ctrl.showSessionPriceModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'sections/manage/session-price-modal/session-price-modal.html',
                    controller: 'sessionPriceModal',
                    controllerAs: '$ctrl',
                    resolve: {
                        session: function () {
                            return $ctrl.sessionOverview;
                        }
                    }
                });

                modalInstance.result.then(function (sessionUpdate) {
                    $ctrl.sessionOverview.price = sessionUpdate.price;
                    $ctrl.sessionOverview.status = sessionUpdate.status;
                    if ($ctrl.fullSession) {
                        $ctrl.fullSession.price = sessionUpdate.price;
                        $ctrl.fullSession.status = sessionUpdate.status;
                    }
                    $scope.$emit('sharingSession:sessionChange');
                }, function (rejection) {
                    if (angular.isObject(rejection) && rejection.notAllowedAction) {
                        $ctrl.reloadSession();
                    }
                });
            };

            $ctrl.showInvoiceConfigModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'sections/manage/invoice-config-modal/invoice-config-modal.html',
                    controller: 'invoiceConfigModal',
                    controllerAs: '$ctrl',
                    resolve: {
                        session: $ctrl.fullSession
                    }
                });

                modalInstance.result.then(function (result) {
                    if (result && result.reloadFiles) {
                        $ctrl.onFilesChanged();
                    }
                }, function (rejection) {
                    if (rejection && rejection.notAllowedAction) {
                        $ctrl.reloadSession();
                    }
                });
            };

            $ctrl.showSessionReschedulingModal = function () {
                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'sections/manage/session-rescheduling-modal/session-rescheduling-modal.html',
                    controller: 'sessionReschedulingModal',
                    controllerAs: '$ctrl',
                    resolve: {
                        session: function () {
                            return $ctrl.sessionOverview;
                        },
                        expertId: function () {
                            if ($ctrl.sessionOverview.expert) {
                                return $ctrl.sessionOverview.expert.id;
                            } else {
                                return userBasicInfoService.basicInfo().id;
                            }
                        }
                    }
                });
                modalInstance.result.then(function (sessionUpdate) {
                    $ctrl.sessionOverview.timeSpan = sessionUpdate.timeSpan;
                    $ctrl.sessionOverview.status = sessionUpdate.status;
                    if ($ctrl.fullSession) {
                        $ctrl.fullSession.timeSpan = sessionUpdate.timeSpan;
                        $ctrl.fullSession.status = sessionUpdate.status;
                    }
                    $scope.$emit('sharingSession:sessionChange');
                }, function (rejection) {
                    if (rejection && rejection.notAllowedAction) {
                        $ctrl.reloadSession();
                    }
                });
            };

            $ctrl.acceptSession = function () {
                if ($ctrl.currentUserType === $ctrl.userType.expert) {
                    if (!userBasicInfoService.basicInfo().payoutDetailsFilledAtLeastOnce) {
                        alertService.displayAlert("MISSING_PAYOUT_DETAILS", null, 'WARNING');
                        return;
                    }
                    if (!userBasicInfoService.basicInfo().payoutEnabled) {
                        alertService.displayAlert("PAYOUT_DISABLED", null, 'WARNING');
                        return;
                    }
                    if (!$ctrl.sessionOverview.price) {
                        missingPriceAlert();
                        return;
                    }
                }

                let modalTemplateUrl;
                let modalController;
                if ($ctrl.currentUserType === $ctrl.userType.seeker) {
                    modalTemplateUrl = 'sections/manage/session-purchase-modal/session-purchase-modal.html';
                    modalController = 'sessionPurchaseModal';
                } else {
                    modalTemplateUrl = 'sections/manage/accept-session-checklist-modal/accept-session-checklist-modal.html';
                    modalController = 'acceptSessionChecklistModal';
                }

                modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: modalTemplateUrl,
                    controller: modalController,
                    controllerAs: '$ctrl',
                    scope: $scope,
                    backdrop: 'static',
                    resolve: {
                        parentScope: function () {
                            return $scope;
                        },
                        session: function () {
                            return $ctrl.sessionOverview
                        }
                    }
                });
                modalInstance.result.then(_onAcceptSession, _onAcceptSessionError);
            };

            function _onAcceptSession(sessionUpdate) {
                $ctrl.sessionOverview.status = sessionUpdate.status;
                if ($ctrl.fullSession) {
                    $ctrl.fullSession.status = sessionUpdate.status;
                }
                $scope.$emit('sharingSession:sessionChange');
            }

            function _onAcceptSessionError(rejection) {
                /* if user tryed to accept the session but can't do it anymore, reload the session to align the UI. */
                if (angular.isObject(rejection) && angular.isObject(rejection.data) && ['KH_ERR_5'].contains(rejection.data.errorCode)) {
                    $ctrl.reloadSession();
                }
            }

            function missingPriceAlert() {
                if (missingPriceAlertTimeout) {
                    return;
                }
                $ctrl.missingPriceAnimation = true;
                missingPriceAlertTimeout = $timeout(function () {
                    $ctrl.missingPriceAnimation = false;
                    missingPriceAlertTimeout = null;
                }, 1400);
            }

            function reloadSession() {
                $q.all([
                    sharingSessionReportingService.getSingleSession($ctrl.sessionOverview.id),
                    $ctrl.showFullSession ? sharingSessionReportingService.getSessionDetails($ctrl.sessionOverview.id) : $q.when()])
                    .then(function (response) {
                        $ctrl.sessionOverview = response[0].sessions[0];
                        $ctrl.fullSession = response[1];
                        $scope.$emit('sharingSession:sessionChange');
                        closeChatIfNeeded();
                    }, angular.noop);
            }

            function toggleFullSession() {
                if (!$ctrl.showFullSession) {
                    sharingSessionReportingService.getSessionDetails($ctrl.sessionOverview.id).then(function (fullSession) {
                        $ctrl.fullSession = fullSession;
                        $ctrl.showFullSession = true;
                    }, function () {
                        $ctrl.showFullSession = false;
                    }).finally(function () {
                        $ctrl.loading = false;
                    });
                } else {
                    $ctrl.showFullSession = false;
                }
            }

            function showInvoiceBtn() {
                return $ctrl.currentUserType === $ctrl.userType.expert && (
                    $ctrl.fullSession.status === $ctrl.sessionStatus.acceptedByExpert
                    || $ctrl.fullSession.status === $ctrl.sessionStatus.planned
                    || $ctrl.fullSession.status === $ctrl.sessionStatus.completed)
                    && $ctrl.fullSession.filesBucket.filesModifiable;
            }

            function showChat() {
                return $ctrl.sessionOverview.status !== sessionStatus.rejected
                    && $ctrl.sessionOverview.status !== sessionStatus.completed
                    && $ctrl.sessionOverview.status !== sessionStatus.inquiry;
            }

            function isSessionChatActive() {
                return liveNotificationsService.activeChat() && liveNotificationsService.activeChat().sessionId === $ctrl.sessionOverview.id;
            }

            function closeChatIfNeeded() {
                if (isSessionChatActive() && !showChat()) {
                    liveNotificationsService.activeChat(null);
                }
            }

            function toggleShowChat() {
                if (isSessionChatActive()) {
                    liveNotificationsService.activeChat(null);
                } else {
                    let otherUser = $ctrl.sessionOverview.seeker || $ctrl.sessionOverview.expert;
                    liveNotificationsService.activeChat({
                        sessionId: $ctrl.sessionOverview.id,
                        sessionTopic: $ctrl.sessionOverview.topic,
                        withUser: otherUser.fullName
                    });
                }
            }
        }
    })
;