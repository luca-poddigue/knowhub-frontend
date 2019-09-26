'use strict';

angular.module('knowhub')
    .component('tabProfile', {
        templateUrl: 'sections/account/tab-profile/tab-profile.html',
        controller: function tabProfileController($q, userService, userRole, $filter, $timeout, spinnerService, $location, userType, $anchorScroll, $uibModal) {

            let $ctrl = this;
            let translate;

            $ctrl.$onInit = function () {
                translate = $filter('translate');
                $ctrl.isAppReady = spinnerService.isAppReady;
                $ctrl.initializing = true;
                $ctrl.isSeekerProfileEdit = false;
                $ctrl.isExpertProfileEdit = false;
                $ctrl.isPayoutDetailsEdit = false;
                loadUserProfile();
                if (userService.basicInfo().type === userType.expert) {
                    $q.all([
                        userService.getExpertProfile(),
                        userService.getPayoutDetails()
                    ]).then((responses) => {
                        $ctrl.expertProfile = responses[0].data;
                        $ctrl.payoutDetails = responses[1].data;
                        $ctrl.showExpertProfile = true;
                        $ctrl.initializing = false;
                    }, () => {
                        $ctrl.showExpertProfile = false;
                        $ctrl.initializing = false;
                    })
                } else {
                    $ctrl.initializing = false;
                }
            };

            $ctrl.showSupporterBadge = function () {
                return userService.basicInfo().role === userRole.supporter.name;
            };

            $ctrl.onSeekerProfileCancel = function () {
                $ctrl.isSeekerProfileEdit = false;
                $timeout(function () {
                    $anchorScroll('seeker-profile');
                });
            };

            $ctrl.onExpertProfileCancel = function () {
                $ctrl.isExpertProfileEdit = false;
                $timeout(function () {
                    $anchorScroll('expert-profile');
                });
            };

            $ctrl.onPayoutDetailsCancel = function () {
                $ctrl.isPayoutDetailsEdit = false;
                $timeout(function () {
                    $anchorScroll('payout-details-profile');
                });
            };

            $ctrl.onSeekerProfileSave = function (userInfo) {
                $ctrl.isSeekerProfileEdit = false;
                $ctrl.userInfo = userInfo;
                $timeout(function () {
                    $anchorScroll('seeker-profile');
                });
            };

            $ctrl.onExpertProfileSave = function (expertProfile) {
                $ctrl.expertProfile = expertProfile;
                $ctrl.isExpertProfileEdit = false;
                $timeout(function () {
                    $anchorScroll('expert-profile');
                });
            };

            $ctrl.onPayoutDetailsSave = function (payoutDetails) {
                $ctrl.payoutDetails = payoutDetails;
                $ctrl.isPayoutDetailsEdit = false;
                $timeout(function () {
                    $anchorScroll('payout-details-profile');
                });
            };

            $ctrl.becomeExpert = function () {
                return $q.all([
                    userService.getExpertProfile(),
                    userService.getPayoutDetails()
                ]).then(function (response) {
                    let expertProfile = response[0].data;
                    let payoutDetails = response[1].data;
                    if (!expertProfile.tosQuestionnaire) {
                        let modalInstance = $uibModal.open({
                            animation: true,
                            templateUrl: 'common/components/become-expert-modal/become-expert-modal.html',
                            controller: 'becomeExpertModal',
                            controllerAs: '$ctrl',
                            resolve: {}
                        });
                        modalInstance.result.then(function () {
                            $location.urlWithReplace('/guide').search({
                                mode: userType.expert,
                                questionnaire: true
                            });
                        }, angular.noop);
                    } else {
                        return userService.enableDisableExpert(true).then(function () {
                            $ctrl.showExpertProfile = true;
                            $ctrl.expertProfile = expertProfile;
                            $ctrl.payoutDetails = payoutDetails;
                            userService.basicInfo().type = userType.expert;
                        }, angular.noop);
                    }
                });
            };

            $ctrl.becomeSeeker = function () {
                return userService.enableDisableExpert(false).then(function () {
                    $ctrl.showExpertProfile = false;
                    delete $ctrl.expertProfile;
                    delete $ctrl.payoutDetails;
                    userService.basicInfo().type = userType.seeker;
                });
            };

            function loadUserProfile() {
                userService.get().then(function (response) {
                    $ctrl.userInfo = response.data;
                }, angular.noop);
            }
        }
    });