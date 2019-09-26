angular
    .module('knowhub')
    .factory('supportService', function userFactory($http, $location) {

        function sendContactUsEmailToSupport(contactUsData) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'support/contactUs',
                data: contactUsData
            });
        }

        function blockUser(userId, reason) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'user/' + userId + '/block',
                data: {
                    reason: reason
                }
            });
        }

        function retryPayout(sessionId) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'session/' + sessionId + '/retryPayout'
            });
        }

        function resolveLitigation(sessionId, action) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'session/' + sessionId + '/resolveLitigation',
                data: {
                    action: action
                }
            });
        }

        function startPromoCampaign(promoCampaign) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'promoCampaign/start',
                data: promoCampaign
            });
        }

        function activatePromo(activatePromoData) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'support/promo',
                data: activatePromoData
            });
        }

        function processSessionPriceLimitIncreaseRequest(sessionPriceLimitDetails) {
            return $http({
                method: 'POST',
                url: $location.apiBaseUrl() + 'support/sessionPriceLimit/process',
                data: sessionPriceLimitDetails
            });
        }

        return {
            sendContactUsEmailToSupport: contactUsData => sendContactUsEmailToSupport(contactUsData),
            blockUser: (userId, reason) => blockUser(userId, reason),
            retryPayout: (sessionId) => retryPayout(sessionId),
            resolveLitigation: (sessionId, action) => resolveLitigation(sessionId, action),
            startPromoCampaign: promoCampaign => startPromoCampaign(promoCampaign),
            activatePromo: activatePromoData => activatePromo(activatePromoData),
            processSessionPriceLimitIncreaseRequest: sessionPriceLimitDetails => processSessionPriceLimitIncreaseRequest(sessionPriceLimitDetails)
        };

    });