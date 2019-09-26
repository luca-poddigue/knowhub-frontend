angular.module('knowhub')
    .constant('maxEmailTemplates', 64)
    .constant('profilePictureSize', 100)
    .constant('defaultPaginationSize', 10)
    .constant('defaultTimeZone', 'GMT')
    .constant('chatPaginationSize', 20)
    .constant('applicationName', 'KnowHub')
    .constant('appPrefix', 'kh.')
    .constant('supportedLocales', ['it_it', 'en_us'])
    .constant('fallbackLocales', {
        'en': 'en_us',
        'it': 'it_it',
        '*': 'en_us'
    })
    .constant('defaultSessionPrice', 5)
    .constant('defaultCurrency', 'EUR')
    .constant('platformCountry', 'IT')
    .constant('supportedCountries', [
        'AT',
        'BE',
        'DE',
        'ES',
        'FI',
        'FR',
        'IE',
        'IT',
        'LU',
        'NL',
        'PT'])
    .constant('supportedImageFormats', ['image/png', 'image/jpeg', 'image/gif', 'image/bmp'])

    .constant('maxSessionFileSize', 26214400) //25Mb
    .constant('maxNumberOfSessionFiles', 100)
    .constant('sessionBucketSize', 31457280) //30Mb

    .constant('policiesDetails', {
        lastPrivacyPolicyUpdate: {
            value: 1560721620000,
            type: 'date'
        },
        lastTermsOfServiceUpdate: {
            value: 1560721620000,
            type: 'date'
        },
        lastCookiesPolicyUpdate: {
            value: 1560721620000,
            type: 'date'
        },
        websiteUrl: 'https://knowhub.it',
        ownerName: 'Luca Poddigue',
        ownerVatNumber: '02764850182',
        ownerAddress: 'Via Francana 5/P - 27100 Pavia (Italy)'
    })
    .constant('maxDaysInFutureToScheduleSession', 60)
    .constant('socialConstants', {
        twitterHashtags: 'ShareTheKnowledge,KnowHub',
        facebookPageUrl: 'https://www.facebook.com/knowhub.it',
        twitterPageUrl: 'https://twitter.com/KnowHubIT',
        youtubeChannelUrl: 'https://www.youtube.com/channel/UC19OEZAaBWNMWH12dngUQYA',
        twitterPageUsername: 'KnowHubIT',
        instagramProfileUrl: 'https://www.instagram.com/knowhub.it'
        }
    )
    .constant('pIva', '02764850182');
