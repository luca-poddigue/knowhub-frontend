'use strict';

angular
    .module('knowhub')
    .factory('filesService', function fileUploadFactory(stripeApiKey, $location, userAuthService, Upload, $http) {

        const STRIPE_FILES_UPLOAD_URL = 'https://files.stripe.com/v1/files';
        const contentTypeToIcon = [{
            types: ['image'],
            class: 'fa-file-image-o'
        },
            {
                types: ['audio'],
                class: 'fa-file-audio-o'
            },
            {
                types: ['video'],
                class: 'fa-file-video-o'
            },
            {
                types: ['word'],
                class: 'fa-file-word-o'
            },
            {
                types: ['excel', 'spreadsheet'],
                class: 'fa-file-excel-o'
            },
            {
                types: ['powerpoint', 'presentation'],
                class: 'fa-file-powerpoint-o'
            },
            {
                types: ['pdf'],
                class: 'fa-file-pdf-o'
            },
            {
                types: ['html', 'javascript', 'java', 'css', 'xml', 'python'],
                class: 'fa-file-code-o'
            },
            {
                types: ['text'],
                class: 'fa-file-text-o'
            },
            {
                types: ['zip'],
                class: 'fa-file-archive-o'
            }
        ];
        const defaultIcon = 'fa-file-o';


        function getIconByContentType(contentType) {
            let i;
            let j;
            for (i = 0; i < contentTypeToIcon.length; i++) {
                let typeGroup = contentTypeToIcon[i];
                for (j = 0; j < typeGroup.types.length; j++) {
                    if (contentType.contains(typeGroup.types[j])) {
                        return typeGroup.class;
                    }
                }
            }
            return defaultIcon;
        }

        function uploadProfileImage(file) {
            return Upload.upload({
                url: $location.domainUrl() + '/files/profileImageFile',
                file: file,
                headers: {
                    'Authorization': userAuthService.getAuthToken()
                },
                khIgnoreErrors: true
            });
        }

        function uploadIdentityDocumentToStripe(stripeAccount, file) {
            return Upload.upload({
                url: STRIPE_FILES_UPLOAD_URL,
                data: {
                    file: file,
                    purpose: 'identity_document',
                },
                headers: {
                    'Stripe-Account': stripeAccount,
                    'Authorization': `Bearer ${stripeApiKey}`
                },
                khIgnoreErrors: true
            });
        }

        function uploadSessionFile(files, sessionId) {
            return Upload.upload({
                url: $location.domainUrl() + '/files/sessionFile',
                params: {
                    sessionId: sessionId
                },
                data: files,
                skipPayloadCleanup: true, //avoids currupting File objects
                headers: {
                    'Authorization': userAuthService.getAuthToken()
                },
                khIgnoreErrors: true
            });
        }

        function deleteSessionFile(sessionId, fileId) {
            return $http({
                method: 'DELETE',
                url: $location.apiBaseUrl() + 'session/' + sessionId + '/file/' + fileId
            }).then(function (response) {
                return response.data;
            });
        }


        return {
            uploadIdentityDocumentToStripe: function (stripeAccount, file) {
                return uploadIdentityDocumentToStripe(stripeAccount, file);
            },
            getIconByContentType: function (contentType) {
                return getIconByContentType(contentType);
            },
            uploadProfileImage: function (file) {
                return uploadProfileImage(file);
            },
            uploadSessionFile: function (file, sessionId) {
                return uploadSessionFile(file, sessionId);
            },
            deleteSessionFile: function (sessionId, fileId) {
                return deleteSessionFile(sessionId, fileId);
            }
        };

    });
