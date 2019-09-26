'use strict';

angular
    .module('knowhub')
    .factory('browserUtilsService', function browserUtilsFactory() {

        let numberRegex = /^[0-9]$/;

        function getSelection() {
            if (window.getSelection) {
                return window.getSelection().toString();
            } else if (document.selection && document.selection.type != "Control") {
                return document.selection.createRange().text;
            }
        }

        function isMobileDevice() {
            return 'ontouchstart' in document.documentElement;
        }

        function isServiceWorkerSupported() {
            return 'serviceWorker' in navigator;
        }

        function isLiveNotificationsSupported() {
            return firebase.messaging.isSupported();
        }

        function pressedOnEnter(event) {
            return event.charCode === 13 || event.which === 13 || event.keyCode === 13;
        }

        function isValidNumericKey(key) {
            return key === 'Backspace' || key === 'Delete' || numberRegex.test(key);
        }

        return {
            isLiveNotificationsSupported: () => {
                return isLiveNotificationsSupported();
            },
            isMobileDevice: () => {
                return isMobileDevice();
            },
            isServiceWorkerSupported: () => {
                return isServiceWorkerSupported();
            },
            getSelection: () => {
                return getSelection();
            },
            pressedOnEnter: (event) => {
                return pressedOnEnter(event);
            },
            isValidNumericKey: (key) => {
                return isValidNumericKey(key);
            }
        };

    });
