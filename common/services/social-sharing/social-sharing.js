'use strict';

angular
    .module('knowhub')
    .factory('socialSharingService', function socialSharingFactory($timeout, $location, $q, userService, facebookAppId, socialConstants) {

        window.fbAsyncInit = function () {
            FB.init({
                appId: facebookAppId,
                status: true,
                xfbml: true,
                version: 'v3.0'
            });
        };

        (function (d, s, id) {
            let js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {
                return;
            }
            js = d.createElement(s);
            js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));

        window.twttr = (function (d, s, id) {
            let js, fjs = d.getElementsByTagName(s)[0],
                t = window.twttr || {};
            if (d.getElementById(id)) return t;
            js = d.createElement(s);
            js.id = id;
            js.src = "https://platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js, fjs);

            t._e = [];
            t.ready = function (f) {
                t._e.push(f);
            };

            return t;
        }(document, "script", "twitter-wjs"));

        function renderTwitterShareButton(btnElement) {
            return twttr.widgets.createShareButton(
                $location.domainUrl(),
                btnElement,
                {
                    text: ' ',
                    size: 'large',
                    lang: userService.language(),
                    hashtags: socialConstants.twitterHashtags,
                    related: socialConstants.twitterPageUsername
                }
            );
        }

        function shareSessionCompleteOnFacebook() {
            let deferred = $q.defer();
            FB.ui({
                    method: 'share',
                    href: $location.domainUrl(),
                    mobile_iframe: true

                },
                function (response) {
                    if (angular.isUndefined(response) || response.error_code) {
                        deferred.reject(response);
                    } else {
                        deferred.resolve();
                    }
                }
            );
            return deferred.promise;
        }

        return {
            shareSessionCompleteOnFacebook: function () {
                return shareSessionCompleteOnFacebook();
            },
            renderTwitterShareButton: function(btnElement) {
                return renderTwitterShareButton(btnElement);
            }
        };

    });
