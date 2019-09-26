'use strict';

angular
    .module('knowhub')
    .factory('routingService', function routingFactory(userAuthService, localStorageService, $location, alertService, userStatus, userType, $timeout) {

        let accessiblePages = {
            '/': true,
            '/home': true,
            '/guide': true,
            '/privacy': true,
            '/blockedUser': true,
            '/termsOfService': true,
            '/contactUs': true,
            '/forgottenPassword': true
        };

        let targetByStatus = _buildTargetByStatusMap();

        _addTargetsToAccessiblePages(targetByStatus);

        function _buildTargetByStatusMap() {
            let targetByStatus = {};
            targetByStatus[userStatus.unverifiedEmail] = '/verifyPendingAction';
            targetByStatus[userStatus.blocked] = '/blockedUser';
            targetByStatus[userStatus.unregistered] = '/registration';
            targetByStatus[userStatus.pendingTOSQuestionnaire] = '/guide?mode=' + userType.seeker + "&questionnaire";
            targetByStatus[userStatus.unverifiedEmailChange] = '/verifyPendingAction';
            targetByStatus[userStatus.unconfirmedPassword] = '/verifyPendingAction';
            targetByStatus[userStatus.unconfirmedUserDeletion] = '/verifyPendingAction';
            return targetByStatus;
        }

        function _addTargetsToAccessiblePages(targetByStatusObj) {
            let keys = Object.keys(targetByStatusObj);
            let targets = {};
            for (let i = 0; i < keys.length; i++) {
                accessiblePages[targetByStatusObj[keys[i]]] = true;
            }
            return targets;
        }

        function redirect(isSignedIn, currUserStatus, targetPath, event) {
            let basePath = targetPath;
            if (basePath && basePath.contains('?')) {
                basePath = basePath.substring(0, basePath.indexOf('?'))
            }
            if (basePath && basePath.contains('#')) {
                basePath = basePath.substring(0, basePath.indexOf('#'))
            }
            if (!isSignedIn) {
                if (accessiblePages[basePath]) {
                    localStorageService.remove('pendingPage');
                    return;
                }
                //  Show login modal and save previous page
                $timeout(function () {
                    localStorageService.set('pendingPage', targetPath);
                });
                if (event) {
                    event.preventDefault();
                } else {
                    // app is still initializing: cannot stay on current page, as it is unaccessible
                    $location.urlWithReplace('/home');
                }
                userAuthService.showAuthModal('login');
            } else {
                let pendingPage = localStorageService.get('pendingPage');
                if (pendingPage) {
                    localStorageService.remove('pendingPage');
                }
                if (basePath === '/contactUs') {
                    // only page that should always be accessible
                    return;
                }
                if (currUserStatus) {
                    let newTarget = targetByStatus[currUserStatus];
                    if (newTarget) {
                        $location.urlWithReplace(newTarget);
                    } else {
                        if (pendingPage) {
                            $location.urlWithReplace(pendingPage);

                        }
                    }
                } else {
                    $location.urlWithReplace('/home');
                    alertService.displayAlert('UNINITIALIZED_APP', null, 'DANGER', false, [{
                        titleKey: "ALERT_VIEWER_REFRESH",
                        target: function () {
                            location.reload();
                        },
                        icon: "refresh"
                    }], false, true);
                }
            }
        }

        function setupPageModes(pageScope, pageId, defaultMode, customInitFn) {
            pageScope.$ctrl.setMode = setMode;
            pageScope.$on('$routeUpdate', function () {
                init();
            });
            if ($location.search().mode) {
                init();
            } else {
                $location.replace();
                if (angular.isFunction(defaultMode)) {
                    defaultMode();
                } else {
                    setMode($location.search().mode || localStorageService.get(pageId + 'Mode') || defaultMode);
                }
            }

            function init() {
                let mode = $location.search().mode;
                pageScope.$ctrl.mode = mode;
                localStorageService.set(pageId + 'Mode', mode);
                if (customInitFn) {
                    customInitFn();
                }
            }
        }

        function setMode(newMode) {
            $location.search('mode', newMode);
            $location.hash(null);
        }

        return {
            redirect: function (isUserLoggedIn, userStatus, target, event) {
                return redirect(isUserLoggedIn, userStatus, target, event);
            },
            setupPageModes: function (pageScope, pageId, defaultMode, customInitFn) {
                return setupPageModes(pageScope, pageId, defaultMode, customInitFn);
            },
            setMode: function (newMode) {
                return setMode(newMode);
            }
        };

    });