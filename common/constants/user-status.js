angular.module('knowhub')
    .constant('userStatus', {
        blocked: 'BLOCKED',
        deleted: 'DELETED',
        unregistered: 'UNREGISTERED',
        unverifiedEmail: 'UNVERIFIED_EMAIL',
        pendingTOSQuestionnaire: 'PENDING_TOS_QUESTIONNAIRE',
        active: 'ACTIVE',
        unverifiedEmailChange: 'UNVERIFIED_EMAIL_CHANGE',
        unconfirmedPassword: 'UNCONFIRMED_PASSWORD',
        unconfirmedUserDeletion: "UNCONFIRMED_USER_DELETION"
    });