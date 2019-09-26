angular.module('knowhub')
    .constant('userRole', {
        standard: {
            level: 0,
            name: 'STANDARD'
        },
        supporter: {
            level: 1,
            name: 'SUPPORTER'
        },
        support: {
            level: 2,
            name: 'SUPPORT'
        },
        admin: {
            level: 3,
            name: 'ADMIN'
        }
    });
