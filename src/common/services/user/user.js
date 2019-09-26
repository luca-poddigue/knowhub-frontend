angular
    .module('knowhub')
    .factory('userService', function userFactory($uibModal, $cookies, $exceptionHandler, $location, $http,
                                                 $translate, tmhDynamicLocale, localStorageService, $q, userStatus, userAuthService, liveNotificationsService, defaultPaginationSize, defaultTimeZone, cacheService, userBasicInfoService) {

        let weekStartDayByLocale = {
            en_us: 0,
            it_it: 1
        };

        function loadBasicInfo() {
            if (!userAuthService.isSignedIn()) {
                _loadLocalBasicInfo();
                return $q.when(userBasicInfoService.basicInfo());
            } else {
                return $http({
                    method: 'GET',
                    url: $location.apiBaseUrl() + 'user/basicInfo'
                }).then(function (response) {
                    userBasicInfoService.basicInfo(response.data);
                    userBasicInfoService.basicInfo().locale = userBasicInfoService.basicInfo().locale || localStorageService.get('locale') || $translate.preferredLanguage();
                    _initLocale(userBasicInfoService.basicInfo().locale);
                    return userBasicInfoService.basicInfo();
                }, function () {
                    _loadLocalBasicInfo();
                    return userBasicInfoService.basicInfo();
                });
            }
        }

        function basicInfo(newBasicInfoObj) {
            if (newBasicInfoObj) {
                userBasicInfoService.basicInfo(newBasicInfoObj);
                return;
            }
            return userBasicInfoService.basicInfo();
        }

        function locale(newLocale) {
            if (newLocale) {
                _initLocale(newLocale);
                if (!userBasicInfoService.basicInfo()) {
                    userBasicInfoService.basicInfo({
                        locale: newLocale
                    });
                } else {
                    userBasicInfoService.basicInfo().locale = newLocale;
                }
            } else {
                return userBasicInfoService.basicInfo().locale;
            }
        }

        function weekStartsAtDay() {
            return weekStartDayByLocale[userBasicInfoService.basicInfo().locale] || 0;
        }

        function language() {
            if (angular.isString(userBasicInfoService.basicInfo().locale)) {
                return userBasicInfoService.basicInfo().locale.substr(0, 2);
            }
            return null;
        }

        function _initLocale(locale) {
            localStorageService.set('locale', locale);
            $translate.use(locale);
            tmhDynamicLocale.set(locale);
            moment.locale(locale);

            window.___gcfg = {
                lang: locale,
                parsetags: 'explicit'
            };
        }

        function _loadLocalBasicInfo() {
            let locale = localStorageService.get('locale') || $translate.preferredLanguage();
            userBasicInfoService.basicInfo({
                locale: locale
            });
            _initLocale(locale);
        }

        function evaluateTOSQuestionnaire(answers, mode) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'user/tosQuestionnaire',
                data: {
                    mode: mode,
                    qas: answers
                }
            }).then(function (response) {
                return response.data;
            });
        }

        function register(userInfo) {
            userInfo.timeZone = moment.tz.guess() || defaultTimeZone;
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'user',
                data: userInfo
            });
        }

        function verifyPendingAction(verificationToken, email) {
            let data = {
                token: verificationToken
            };
            if (email) {
                data.email = email;
            }
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'user/pendingAction/verify',
                data: data
            });
        }

        function update(userInfo) {
            let url = $location.apiBaseUrl() + 'user';
            userInfo.timeZone = moment.tz.guess() || defaultTimeZone;
            return $http({
                method: 'PUT',
                url: url,
                data: userInfo
            }).then(function () {
                cacheService.setCache(url + '/' + userBasicInfoService.basicInfo().id, userInfo);
            });
        }

        function get() {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'user/' + userBasicInfoService.basicInfo().id,
                cache: true
            });
        }

        function getEmailPreferences() {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'user/preferences/email',
                cache: true
            });
        }

        function updateEmailPreferences(preferences) {
            let url = $location.apiBaseUrl() + 'user/preferences/email';
            return $http({
                method: 'PUT',
                url: url,
                data: preferences
            }).then(function () {
                cacheService.setCache(url, preferences);
            });
        }

        function updateNotificationsPreferences(preferences, showAlerts, manageMessaging) {
            let url = $location.apiBaseUrl() + 'user/preferences/notifications';
            return $http({
                method: 'PUT',
                url: url,
                data: preferences
            }).then(function () {
                cacheService.setCache(url, preferences);
                userBasicInfoService.basicInfo().notificationsEnabled = preferences.notificationsEnabled;
                userBasicInfoService.basicInfo().playNotificationSound = preferences.playNotificationSound;
                if (manageMessaging) {
                    if (preferences.notificationsEnabled) {
                        liveNotificationsService.initMessaging(true, showAlerts);
                    } else {
                        liveNotificationsService.stopMessaging();
                    }
                }
            });
        }

        function getExpertProfile(expertId) {
            let params = {
                method: 'GET',
                cache: true
            };
            if (angular.isDefined(expertId)) {
                params.url = $location.apiBaseUrl() + 'expert/' + expertId + '/profile';
            } else {
                params.url = $location.apiBaseUrl() + 'expert/' + userBasicInfoService.basicInfo().id + '/profile';
            }
            return $http(params).then(function (response) {
                let profile = response.data;
                if (!profile.education) {
                    profile.education = {};
                    angular.forEach(profile.availableLanguages, function (lang) {
                        if (!profile.education[lang]) {
                            profile.education[lang] = [];
                        }
                    });
                }
                if (!profile.experiences) {
                    profile.experiences = {};
                    angular.forEach(profile.availableLanguages, function (lang) {
                        if (!profile.experiences[lang]) {
                            profile.experiences[lang] = [];
                        }
                    });
                }
                return response;
            });
        }

        function getPayoutDetails() {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'expert/payoutDetails'
            });
        }

        function putPayoutDetails(payoutDetails) {
            return $http({
                method: 'PUT',
                url: $location.apiBaseUrl() + 'expert/payoutDetails',
                data: payoutDetails
            });
        }

        function updateExpertProfile(profile) {
            return $http({
                method: 'PUT',
                url: $location.apiBaseUrl() + 'expert/profile',
                data: profile
            }).then(function () {
                profile.valid = true;
                cacheService.setCache($location.apiBaseUrl() + 'expert/' + userBasicInfoService.basicInfo().id + '/profile', profile);
            });
        }

        function enableDisableExpert(isExpert) {
            return $http({
                method: 'PUT',
                url: $location.apiBaseUrl() + 'expert/enable',
                data: {
                    "expert": isExpert
                }
            });
        }

        function getExpertAvailability(userId) {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'expert/' + userId + '/availability',
                cache: userId === userBasicInfoService.basicInfo().id
            });
        }

        function putExpertAvailability(availability) {
            return $http({
                method: 'PUT',
                url: $location.apiBaseUrl() + 'expert/availability',
                data: {
                    availability: availability
                }
            }).then(function () {
                cacheService.clearCacheResource($location.apiBaseUrl() + 'expert/' + userBasicInfoService.basicInfo().id + '/availability');
            });
        }

        function getUserLogs(logsConfig, paginationCursor, skipPagination) {
            let activeUserTypes = [];
            angular.forEach(logsConfig.userTypes, function (active, userType) {
                if (active) {
                    this.push(userType);
                }
            }, activeUserTypes);

            let pagination;
            if (skipPagination) {
                pagination = null;
            } else {
                pagination = paginationCursor ? [defaultPaginationSize, paginationCursor] : defaultPaginationSize;
            }
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'user/logs',
                params: {
                    pagination: pagination,
                    timeSpan: logsConfig.timeSpan,
                    userTypes: activeUserTypes,
                    eventType: logsConfig.eventType
                }
            });
        }

        function alignDynamicProperties() {
            return $http({
                method: 'PUT',
                url: $location.apiBaseUrl() + 'user/dynamicProperties',
                data: {
                    timeZone: moment.tz.guess() || defaultTimeZone
                }
            });
        }

        function changeEmail(email) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'user/email/change',
                data: {
                    "email": email
                }
            });
        }

        function resetPassword(password, email) {
            let data = {
                "password": password
            };
            if (email) {
                data.email = email;
            }
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'user/password/reset',
                data: data
            });
        }

        function discardPendingAction() {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'user/pendingAction/discard'
            });
        }

        function remove() {
            return $http({
                method: 'DELETE',
                url: $location.apiBaseUrl() + 'user'
            });
        }

        function reportAbuse(expertId, abuseDetails) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'user/' + expertId + '/abuse',
                data: abuseDetails
            });
        }

        function getFeedbackComments(expertId, paginationCursor) {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'user/' + expertId + '/comments',
                cache: true,
                params: {
                    pagination: paginationCursor ? [defaultPaginationSize, paginationCursor] : defaultPaginationSize
                }
            });
        }

        function getPendingFeedbacks() {
            return $http({
                method: 'GET',
                url: $location.apiBaseUrl() + 'user/pendingFeedbacks'
            });
        }

        function postSessionPriceLimitIncreaseRequest(requestDetails) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'user/sessionPriceLimit',
                data: requestDetails
            });
        }

        return {
            loadBasicInfo: function () {
                return loadBasicInfo();
            },
            basicInfo: function (newBasicInfoObj) {
                return basicInfo(newBasicInfoObj);
            },
            locale: function (localeId) {
                return locale(localeId);
            },
            weekStartsAtDay: function () {
                return weekStartsAtDay();
            },
            language: function () {
                return language();
            },
            evaluateTOSQuestionnaire: function (answers, mode) {
                return evaluateTOSQuestionnaire(answers, mode);
            },
            register: function (userInfo) {
                return register(userInfo);
            },
            verifyPendingAction: function (verificationToken, email) {
                return verifyPendingAction(verificationToken, email);
            },
            update: function (userInfo) {
                return update(userInfo);
            },
            get: function () {
                return get();
            },
            getEmailPreferences: function () {
                return getEmailPreferences();
            },
            updateEmailPreferences: function (preferences) {
                return updateEmailPreferences(preferences);
            },
            updateNotificationsPreferences: function (preferences, showAlerts, manageMessaging) {
                return updateNotificationsPreferences(preferences, showAlerts, manageMessaging);
            },
            getExpertProfile: function (expertId) {
                return getExpertProfile(expertId);
            },
            getPayoutDetails: function () {
                return getPayoutDetails();
            },
            updateExpertProfile: function (profile) {
                return updateExpertProfile(profile);
            },
            enableDisableExpert: function (isExpert) {
                return enableDisableExpert(isExpert);
            },
            getExpertAvailability: function (userId) {
                return getExpertAvailability(userId);
            },
            putExpertAvailability: function (availability) {
                return putExpertAvailability(availability);
            },
            putPayoutDetails: function (payoutDetails) {
                return putPayoutDetails(payoutDetails);
            },
            getUserLogs: function (logsConfig, paginationCursor, skipPagination) {
                return getUserLogs(logsConfig, paginationCursor, skipPagination);
            },
            alignDynamicProperties: function () {
                return alignDynamicProperties();
            },
            changeEmail: function (email) {
                return changeEmail(email);
            },
            resetPassword: function (password, email) {
                return resetPassword(password, email);
            },
            discardPendingAction: function () {
                return discardPendingAction();
            },
            remove: function () {
                return remove();
            },
            reportAbuse: function (expertId, abuseDetails) {
                return reportAbuse(expertId, abuseDetails);
            },
            getFeedbackComments: function (expertId, paginationCursor) {
                return getFeedbackComments(expertId, paginationCursor);
            },
            getPendingFeedbacks: function () {
                return getPendingFeedbacks();
            },
            postSessionPriceLimitIncreaseRequest: function (requestDetails) {
                return postSessionPriceLimitIncreaseRequest(requestDetails);
            }
        };

    });