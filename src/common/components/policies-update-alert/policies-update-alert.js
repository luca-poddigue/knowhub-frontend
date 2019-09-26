'use strict';

angular.module('knowhub')
    .component('policiesUpdateAlert', {
        bindings: {},
        templateUrl: 'common/components/policies-update-alert/policies-update-alert.html',
        controller: function policiesUpdateAlertController(localStorageService, $filter, $location, policiesDetails) {

            let $ctrl = this;
            let translate;
            let urlsMap;
            let updatedPolicies;

            $ctrl.$onInit = function () {
                translate = $filter('translate');
                updatedPolicies = [];
                urlsMap = {
                    TERMS_OF_SERVICE: '/termsOfService',
                    COOKIES_POLICY: '/privacy?mode=cookies',
                    PRIVACY_POLICY: '/privacy?mode=privacy'
                };

                let policiesAcceptedOn = localStorageService.get('policiesAcceptedOn');
                if (policiesAcceptedOn) {
                    if (policiesDetails.lastTermsOfServiceUpdate.value > policiesAcceptedOn) {
                        updatedPolicies.push('TERMS_OF_SERVICE');
                    }
                    if (policiesDetails.lastCookiesPolicyUpdate.value > policiesAcceptedOn) {
                        updatedPolicies.push('COOKIES_POLICY');
                    }
                    if (policiesDetails.lastPrivacyPolicyUpdate.value > policiesAcceptedOn) {
                        updatedPolicies.push('PRIVACY_POLICY');
                    }
                    $ctrl.showAlert = updatedPolicies.length > 0;
                } else {
                    localStorageService.set('policiesAcceptedOn', mostRecentUpdate(), true);
                    $ctrl.showAlert = false;
                }
            };

            $ctrl.getAlertText = function () {
                let alertText = translate('POLICIES_UPDATE_ALERT_TEXT');
                let updatedPoliciesTranslated = updatedPolicies.map(createLink);
                if (updatedPoliciesTranslated.length === 1) {
                    alertText = alertText.replace('%%updatedPolicies%', ' ' + updatedPoliciesTranslated[0]);
                } else {
                    alertText = alertText.replace('%%updatedPolicies%', translate('POLICIES_UPDATE_ALERT_OUR_P') + ' ' + updatedPoliciesTranslated.slice(0, updatedPoliciesTranslated.length - 1).join(', ') + ' ' + translate('POLICIES_UPDATE_ALERT_AND') + ' ' + updatedPoliciesTranslated[updatedPolicies.length - 1]);
                }
                return alertText;
            };

            $ctrl.setPoliciesAccepted = function () {
                localStorageService.set('policiesAcceptedOn', mostRecentUpdate(), true);
                $ctrl.showAlert = false;
            };

            function createLink(key) {
                return '<a href="' + urlsMap[key] + '">' + translate('POLICIES_UPDATE_ALERT_' + key) + '</a>';
            }

            function mostRecentUpdate() {
                return Math.max(policiesDetails.lastPrivacyPolicyUpdate.value, policiesDetails.lastTermsOfServiceUpdate.value, policiesDetails.lastCookiesPolicyUpdate.value);
            }

        }
    });
