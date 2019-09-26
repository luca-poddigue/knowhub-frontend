'use strict';

angular.module('knowhub')
    .component('navBar', {
        templateUrl: 'common/components/nav-bar/nav-bar.html',
        controller: function navBarController($scope, $timeout, alertService, $uibModal,
                                              applicationName, $element, $location, userType,
                                              userService, userAuthService, userStatus,
                                              $exceptionHandler, $document, $filter, $log,
                                              localStorageService, liveNotificationsService, userRole) {

            let $ctrl = this;
            let modalInstance;
            let translate;
            let tabProfileUrl = '/account?mode=profile';

            $ctrl.$onInit = function () {

                translate = $filter('translate');
                $ctrl.hasUnreadMessages = false;
                $ctrl.messages = localStorageService.get('messages') || [];

                $ctrl.isCollapsed = true;
                $ctrl.isUserSignedIn = userAuthService.isSignedIn;

                $document.on(
                    "click",
                    function (event) {
                        if (event.target.id !== 'burger-btn' && event.target.parentElement && event.target.parentElement.id !== 'burger-btn' && angular.element(event.target).parents('.account-menu').length === 0 && angular.element(event.target).parents('.messages-menu').length === 0 && !$ctrl.isCollapsed) {
                            $scope.$evalAsync(function () {
                                $ctrl.isCollapsed = true;
                            });
                        }
                    });

                $scope.$on('$routeChangeSuccess', function () {
                    $ctrl.activePath = null;
                    if (!$ctrl.isCollapsed) {
                        $scope.$evalAsync(function () {
                            $ctrl.isCollapsed = true;
                        });
                    }
                });

                $scope.$watch('$ctrl.isCollapsed', function (isCollapsed) {
                    if (isCollapsed) {
                        //$document.find("body").removeClass("no-scroll");
                    } else {
                        //$document.find("body").addClass("no-scroll");
                    }
                });

                $ctrl.location = $location;
                $ctrl.applicationName = applicationName;
                $ctrl.userBasicInfo = userService.basicInfo;
                $ctrl.authInfo = userAuthService.getAuthInfo;
                $ctrl.sections = [
                    {
                        key: 'SECTION_SEARCH_EXPERT',
                        path: '/searchExpert'
                    },
                    {
                        key: 'SECTION_MANAGE',
                        path: '/manage'
                    },
                    {
                        key: 'SECTION_GUIDE',
                        path: '/guide'
                    }
                ];

            };

            $ctrl.showAuthModal = function () {
                userAuthService.showAuthModal('login');
            };

            $ctrl.showSupportSection = function () {
                return userRole[$ctrl.userBasicInfo().role.toLowerCase()].level >= userRole.support.level;
            };

            $ctrl.showBecomeExpertButton = function () {
                return $ctrl.isUserSignedIn() && $ctrl.userBasicInfo().status === userStatus.active && $ctrl.userBasicInfo().type !== userType.expert && !$location.url().startsWith(tabProfileUrl);
            };

            $ctrl.becomeExpert = function () {
                userService.getExpertProfile().then(function (expertProfile) {
                    if (!expertProfile.data.tosQuestionnaire) {
                        modalInstance = $uibModal.open({
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
                        userService.enableDisableExpert(true).then(function () {
                            userService.basicInfo().type = userType.expert;
                            if (expertProfile.data.valid) {
                                $location.urlWithReplace('/home');
                                $timeout(function () {
                                    alertService.displayAlert('NOW_EXPERT', null, 'SUCCESS');
                                });
                            } else {
                                $location.urlWithReplace('/account?mode=profile#expert-profile');
                            }
                        });
                    }
                });
            };

            $ctrl.signOut = function () {
                $ctrl.showAccountPopup = false;
                liveNotificationsService.stopMessaging();
                userAuthService.signOut();
                $location.urlWithReplace("/home");
            };

            $ctrl.showAccountWidget = function () {
                return !$ctrl.isUserSignedIn() || !!userService.basicInfo().status;
            };

            $ctrl.showMenus = function () {
                return $ctrl.isUserSignedIn() && userService.basicInfo().status === userStatus.active;
            };
        }
    });
