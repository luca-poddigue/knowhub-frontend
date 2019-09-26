'use strict';

angular
    .module('knowhub')
    .factory('userAuthService', function userFactory(spinnerService, $exceptionHandler, $q, $log,
                                                     localStorageService, $timeout, $location,
                                                     cacheService, $rootScope, userBasicInfoService,
                                                     authDomain, authClientId, authAudience, $filter) {

        let lock;

        let authInfo = null;
        let tokenRenewalTimeout;
        let translate = $filter('translate');

        let initialized = false;
        let pendingShow = null;
        let firstTimeShow = true;

        let providersIdToName = {
            email: 'Email',
            'google-oauth2': "Google",
            facebook: "Facebook",
            linkedin: "LinkedIn",
            twitter: "Twitter"
        };

        /* Large profile pictures for Facebook and LinkedIn are obtained with rules configured in the Auth0 Dashboard. Google pictures are already large. */

        let webAuth = new auth0.WebAuth({
            domain: authDomain,
            clientID: authClientId
        });

        authInfo = localStorageService.get('authInfo');
        scheduleTokenRenewal();

        function renewToken() {
            let deferred = $q.defer();
            if (tokenRenewalTimeout) {
                $timeout.cancel(tokenRenewalTimeout);
            }
            webAuth.checkSession({
                audience: authAudience,
                responseType: 'token id_token',
                scope: 'openid profile email',
                redirectUri: $location.domainUrl(true)
            }, function (err, authResult) {
                if (err) {
                    $log.error("Cannot renew auth token.");
                    deferred.reject(err.error + ": " + err.errorDescription);
                } else if (authResult.error) {
                    $log.error("Cannot renew auth token.");
                    deferred.reject(authResult.error + ": " + authResult.errorDescription);
                } else {
                    let expiresAt = authResult.expiresIn * 1000 + new Date().getTime();
                    if (authInfo) {
                        authInfo.token = authResult.accessToken;
                        authInfo.expiresAt = expiresAt;
                        authInfo.email = authResult.idTokenPayload.email;
                        localStorageService.remove('authInfo');
                        localStorageService.set('authInfo', authInfo, true);
                        scheduleTokenRenewal();
                    }
                    deferred.resolve();
                }
            });
            return deferred.promise;
        }

        function scheduleTokenRenewal() {
            if (!authInfo || !authInfo.expiresAt) {
                return;
            }
            let delay = authInfo.expiresAt - Date.now();
            if (delay > 0) {
                tokenRenewalTimeout = $timeout(function () {
                    renewToken().then(angular.noop, function (rejection) {
                        $exceptionHandler(new Error(rejection));
                    });
                }, delay);
            }
        }

        function getAuthToken() {
            return authInfo && authInfo.token;
        }

        function getAuthInfo() {
            return authInfo;
        }

        function isSignedIn() {
            return !!(authInfo && authInfo.token);
        }

        function initAuthWidget(markCompleted) {
            let options = {
                container: 'authWidget',
                oidcConformant: true,
                allowShowPassword: true,
                mustAcceptTerms: true,
                rememberLastLogin: false,
                leeway: 30,
                avatar: null,
                forgotPasswordLink: '/forgottenPassword',
                theme: {
                    logo: $location.domainUrl(true) + '/common/images/logo.svg',
                    primaryColor: '#ff9800'
                },
                auth: {
                    sso: true,
                    responseType: 'token',
                    redirectUrl: $location.domainUrl(true),
                    audience: authAudience,
                    scope: 'openid profile email'
                },
                languageDictionary: {
                    error: {
                        login: {
                            blocked_user: translate('AUTH_BLOCKED_USER'),
                            invalid_user_password: translate('AUTH_INVALID_CREDENTIALS'),
                            'lock.fallback': translate('AUTH_GENERIC_ERROR'),
                            'lock.invalid_email_password': translate('AUTH_INVALID_CREDENTIALS'),
                            'lock.invalid_username_password': translate('AUTH_INVALID_CREDENTIALS'),
                            'lock.network': translate('AUTH_NETWORK_ERROR'),
                            too_many_attempts: translate('AUTH_TOO_MANY_ATTEMPTS')
                        },
                        signUp: {
                            invalid_password: translate('AUTH_INVALID_PASSWORD'),
                            'lock.fallback': translate('AUTH_GENERIC_ERROR'),
                            password_strength_error: translate('AUTH_PASSWORD_STRENGTH_ERROR'),
                            user_exists: translate('AUTH_USER_EXISTS'),
                            username_exists: translate('AUTH_USER_EXISTS')
                        }
                    },
                    blankErrorHint: translate('VALIDATION_REQUIRED'),
                    databaseEnterpriseAlternativeLoginInstructions: translate('COMMON_OR'),
                    databaseAlternativeSignUpInstructions: translate('COMMON_OR'),
                    emailInputPlaceholder: translate('AUTH_EMAIL_PLACEHOLDER'),
                    forgotPasswordAction: translate('AUTH_FORGOT_PASSWORD'),
                    loginLabel: translate('AUTH_LOGIN'),
                    loginSubmitLabel: translate('AUTH_LOGIN'),
                    passwordInputPlaceholder: translate('AUTH_PASSWORD_PLACEHOLDER'),
                    passwordStrength: {
                        lengthAtLeast: translate('AUTH_PASSWORD_LENGTH')
                    },
                    signUpLabel: translate('AUTH_SIGN_UP'),
                    signUpSubmitLabel: translate('AUTH_SIGN_UP'),
                    signUpTerms: translate('AUTH_TERMS_OF_SERVICE'),
                    unrecoverableError: translate('AUTH_GENERIC_ERROR'),
                    showPassword: translate('AUTH_SHOW_PASSWORD')
                }
            };

            let deferred = $q.defer();
            lock = new Auth0Lock(authClientId, authDomain, options);

            lock.on("authenticated", function (authResult) {
                lock.getUserInfo(authResult.accessToken, function (error, profile) {
                    if (error) {
                        deferred.reject(error);
                    } else {
                        let expiresAt = authResult.expiresIn * 1000 + new Date().getTime();
                        let providerId = localStorageService.get('lastAuthProviderId');
                        if (!providerId) {
                            deferred.reject("Missing provider id");
                            return;
                        }
                        authInfo = {
                            id: providerId,
                            name: providersIdToName[providerId],
                            email: profile.email,
                            token: authResult.accessToken,
                            expiresAt: expiresAt,
                            photoURL: profile.picture
                        };
                        localStorageService.set('authInfo', authInfo, true);
                        scheduleTokenRenewal();
                        hideAuthModal();
                        deferred.resolve();
                    }
                });
            });

            lock.on("hash_parsed", function (result) {
                if (!result) {
                    deferred.resolve();
                }
            });

            lock.on("authorization_error", function (error) {
                if (error.error === 'unauthorized' &&
                    error.errorDescription === 'user is blocked') {
                    // ugly but working (required to apply redirect to Firefox)
                    $timeout(() => $timeout(() => $location.urlWithReplace('/blockedUser')));
                    deferred.resolve();
                } else {
                    deferred.reject(error);
                }
            });

            lock.on("unrecoverable_error", function (error) {
                deferred.reject(error);
            });

            lock.on('signin submit', function () {
                deferred = $q.defer();
                localStorageService.set('lastAuthProviderId', 'email');
            });

            lock.on('signup submit', function () {
                deferred = $q.defer();
                localStorageService.set('lastAuthProviderId', 'email');
            });

            lock.on('federated login', function (connection) {
                deferred = $q.defer();
                localStorageService.set('lastAuthProviderId', connection.name);
            });

            if (markCompleted) {
                initialized = true;
                if (pendingShow) {
                    showAuthModal(pendingShow);
                    pendingShow = null;

                }
            }
            return deferred.promise;
        }

        function signOut() {
            authInfo = null;
            localStorageService.remove('authInfo');
            if (tokenRenewalTimeout) {
                $timeout.cancel(tokenRenewalTimeout);
            }
            cacheService.clearCache();
            if (userBasicInfoService.basicInfo()) {
                userBasicInfoService.basicInfo({
                    locale: userBasicInfoService.basicInfo().locale
                });
            }
        }

        function isSocialProviderAuth() {
            if (authInfo && authInfo.id) {
                return authInfo.id !== 'email';
            }
        }

        function hideAuthModal() {
            $timeout(function () {
                $('#authModal').modal('hide');
            });
        }

        function showAuthModal(mode) {
            if (!initialized) {
                pendingShow = mode;
                return;
            }
            if (!lock) {
                $exceptionHandler(new Error("Lock widget is not initialized."));
                return;
            }
            if (mode !== 'login' && mode !== 'signUp') {
                $exceptionHandler(new Error("Invalid mode: " + mode + "."));
                return;
            }
            if (!firstTimeShow) {
                lock.hide();
            }
            lock.show({
                initialScreen: mode
            });
            $timeout(function () {
                $("#authModal").modal('show');
            });
            firstTimeShow = false;
        }

        return {
            renewToken: function () {
                return renewToken();
            },
            initAuthWidget: function (markCompleted) {
                return initAuthWidget(markCompleted);
            },
            showAuthModal: function (mode) {
                return showAuthModal(mode);
            },
            hideAuthModal: function () {
                return hideAuthModal();
            },
            getAuthInfo: function () {
                return getAuthInfo();
            },
            signOut: function () {
                return signOut();
            },
            isSignedIn: function () {
                return isSignedIn();
            },
            getAuthToken: function () {
                return getAuthToken();
            },
            isSocialProviderAuth: function () {
                return isSocialProviderAuth();
            }
        };

    })
;
