angular
    .module('knowhub')
    .factory('stripeService', function stripeFactory(stripeApiKey) {

        let stripe = Stripe(stripeApiKey);

        function getStripeApi() {
            return stripe;
        }

        return {
            getStripeApi: function () {
                return getStripeApi();
            }
        };

    });