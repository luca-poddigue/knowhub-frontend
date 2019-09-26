'use strict';

angular.module('knowhub')
    .component('tabSupportDashboard', {
        templateUrl: 'sections/account/tab-support-dashboard/tab-support-dashboard.html',
        controller: function tabSupportDashboardController($exceptionHandler, spinnerService, alertService, $q, supportService, userRole, userBasicInfoService, $location) {

            let $ctrl = this;
            let promoCampaignTemplates = ['EARLY_ACCESS'];

            $ctrl.$onInit = function () {
                $ctrl.isAppReady = spinnerService.isAppReady;

                $ctrl.promoCampaignTemplates = promoCampaignTemplates;

                $ctrl.promoCampaignTestModeOptions = [{
                    key: 'COMMON_ON',
                    activeClass: 'btn-success',
                    id: true
                },
                    {
                        key: 'COMMON_OFF',
                        activeClass: 'btn-warning',
                        id: false
                    }];

                $ctrl.blockUserOptions = [{
                    key: 'SUPPORT_SERVICE_TERMS_INFRINGEMENT',
                    activeClass: 'btn-primary',
                    id: 'SERVICE_TERMS_INFRINGEMENT'
                }, {
                    key: 'SUPPORT_LOST_LITIGATIONS',
                    activeClass: 'btn-primary',
                    id: 'LOST_LITIGATIONS'
                }];

                $ctrl.inspectionOptions = [{
                    key: 'SUPPORT_EXPERT',
                    activeClass: 'btn-primary',
                    id: 'EXPERT'
                }, {
                    key: 'SUPPORT_SESSION',
                    activeClass: 'btn-primary',
                    id: 'SESSION'
                }];

                $ctrl.litigationResolutionOptions = [{
                    key: 'SUPPORT_REOPEN',
                    activeClass: 'btn-success',
                    id: 'REOPEN'
                },
                    {
                        key: 'SUPPORT_REFUND_SEEKER',
                        activeClass: 'btn-warning',
                        id: 'REFUND'
                    },
                    {
                        key: 'SUPPORT_CLOSE',
                        activeClass: 'btn-warning',
                        id: 'CLOSE'
                    }];

                $ctrl.promoCampaignTargetOptions = [{
                    key: 'SUPPORT_USERS_LIST',
                    activeClass: 'btn-primary',
                    id: 'USERS_LIST'
                },
                    {
                        key: 'SUPPORT_USER_ROLES',
                        activeClass: 'btn-primary',
                        id: 'USER_ROLES'
                    }];

                $ctrl.sessionPriceLimitOptions = [{
                    key: 'SUPPORT_SESSION_PRICE_LIMIT_APPROVE',
                    activeClass: 'btn-success',
                    id: 'APPROVE'
                },
                    {
                        key: 'SUPPORT_SESSION_PRICE_LIMIT_REJECT',
                        activeClass: 'btn-danger',
                        id: 'REJECT'
                    }];

                initPromoCampaignSection();
                initSessionPriceLimitSection();
                initResolveLitigationSection();
                initBlockUserSection();
                $ctrl.inspectionData = {
                    itemType: 'EXPERT'
                };
                $ctrl.retryPayoutData = {};
                $ctrl.activatePromoData = {
                    promoType: 'NO_SERVICE_COSTS_1M'
                };
            };

            $ctrl.inspect = () => {
                if ($ctrl.inspectionData.itemType === 'EXPERT') {
                    $location.urlWithReplace('/searchExpert?mode=search&expert=' + $ctrl.inspectionData.itemId);
                } else if ($ctrl.inspectionData.itemType === 'SESSION') {
                    $location.urlWithReplace('/manage?mode=dashboard&session=' + $ctrl.inspectionData.itemId);
                }
            };

            $ctrl.retryPayout = () => {
                return supportService.retryPayout($ctrl.retryPayoutData.sessionId).then(function () {
                    alertService.displayAlert('SUPPORT_PAYOUT_RETRIED', null, 'SUCCESS');
                })
            };

            $ctrl.processSessionPriceLimitIncreaseRequest = function () {
                return supportService.processSessionPriceLimitIncreaseRequest($ctrl.sessionPriceLimitDetails).then(function () {
                    alertService.displayAlert('SUPPORT_SESSION_PRICE_LIMIT_PROCESSED', null, 'SUCCESS');
                });
            };

            $ctrl.showPromoCampaigns = function () {
                return userRole[userBasicInfoService.basicInfo().role.toLowerCase()].level >= userRole.admin.level;
            };

            $ctrl.blockUser = function () {
                return supportService.blockUser($ctrl.blockUserData.userId, $ctrl.blockUserData.reason).then(function () {
                    alertService.displayAlert('SUPPORT_USER_BLOCKED', null, 'SUCCESS');
                });
            };

            $ctrl.activatePromo = () => {
                return supportService.activatePromo($ctrl.activatePromoData).then(function () {
                    alertService.displayAlert('SUPPORT_PROMO_ACTIVATED', null, 'SUCCESS');
                });
            };

            $ctrl.resolveLitigation = function () {
                return supportService.resolveLitigation($ctrl.litigationResolution.sessionId, $ctrl.litigationResolution.action).then(function () {
                    alertService.displayAlert('SUPPORT_LITIGATION_RESOLVED', null, 'SUCCESS');
                });
            };

            $ctrl.startPromoCampaign = function () {
                let data = angular.copy($ctrl.promoCampaign);
                if ($ctrl.promoCampaign.target === 'USERS_LIST') {
                    try {
                        data.usersList = angular.fromJson($ctrl.promoCampaign.usersList);
                    } catch (e) {
                        alertService.displayAlert('SUPPORT_INVALID_USERS_DEFINITION', null, 'DANGER');
                        return $q.reject("Invalid users definition.");
                    }
                }
                return supportService.startPromoCampaign(data).then(function () {
                    alertService.displayAlert('SUPPORT_PROMO_CAMPAIGN', null, 'SUCCESS');
                })
            };

            function initPromoCampaignSection() {
                $ctrl.promoCampaign = {
                    target: 'USERS_LIST',
                    codeType: 'GLOBAL',
                    testMode: true,
                    userRoles: [],
                    usersList: []
                };
                angular.forEach(userRole, function (role) {
                    $ctrl.promoCampaign.userRoles.push({
                        role: role.name,
                        enabled: false
                    })
                })
            }

            function initSessionPriceLimitSection() {
                $ctrl.sessionPriceLimitDetails = {
                    action: 'APPROVE'
                }
            }

            function initResolveLitigationSection() {
                $ctrl.litigationResolution = {
                    action: 'REOPEN'
                };
            }

            function initBlockUserSection() {
                $ctrl.blockUserData = {
                    reason: 'SERVICE_TERMS_INFRINGEMENT'
                };
            }
        }
    })
;