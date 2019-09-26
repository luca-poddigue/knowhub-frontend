angular.module('knowhub')
    .constant('emails', [
        {
            id: 0,
            key: 'WELCOME',
            visibility: 'NONE'
        },
        {
            id: 1,
            key: 'PASSWORD_RESET',
            visibility: 'NONE'
        },
        {
            id: 2,
            key: 'EMAIL_CHANGE',
            visibility: 'NONE'
        },
        {
            id: 3,
            key: 'ACCOUNT_CANCELLATION',
            visibility: 'NONE'
        },
        {
            id: 9,
            key: 'SESSION_INQUIRY_SEEKER',
            visibility: 'NONE'
        },
        {
            id: 14,
            key: 'SESSION_INQUIRY_EXPERT',
            visibility: 'NONE'
        },
        {
            id: 19,
            key: 'ACCOUNT_BLOCKED',
            visibility: 'NONE'
        },
        {
            id: 20,
            key: 'EMAIL_CHANGE_NOTIFICATION',
            visibility: 'NONE'
        },
        {
            id: 21,
            key: 'WELCOME_AND_VERIFY_EMAIL',
            visibility: 'NONE'
        },
        {
            id: 22,
            key: 'ACCOUNT_DELETED',
            visibility: 'NONE'
        },
        {
            id: 24,
            key: 'CONTACT_US_CONFIRMATION',
            visibility: 'NONE'
        },
        {
            id: 25,
            key: 'SESSION_PRICE_LIMIT_INCREASE_APPROVED',
            visibility: 'NONE'
        },
        {
            id: 26,
            key: 'SESSION_PRICE_LIMIT_INCREASE_REJECTED',
            visibility: 'NONE'
        },
        {
            id: 29,
            key: 'PAYOUT_DETAILS_REQUIRED',
            visibility: 'NONE'
        },
        {
            id: 30,
            key: 'PAYOUT_DETAILS_VERIFICATION_SUCCESS',
            visibility: 'NONE'
        },
        {
            id: 32,
            key: 'SESSION_PAYOUT_INITIATED_AFTER_INQUIRY',
            visibility: 'NONE'
        },
        {
            id: 63, // The max allowed ID for templates
            key: 'PROMO_CAMPAIGN',
            visibility: 'SEEKER'
        },
        {
            id: 4,
            key: 'SESSION_REQUESTED',
            visibility: 'SEEKER'
        },
        {
            id: 5,
            key: 'SESSION_REJECTED_SEEKER',
            visibility: 'SEEKER'
        },
        {
            id: 6,
            key: 'SESSION_UPDATED',
            visibility: 'SEEKER'
        },
        {
            id: 7,
            key: 'SESSION_PLANNED_SEEKER',
            visibility: 'SEEKER'
        },
        {
            id: 10,
            key: 'SESSION_PAYOUT_INITIATED_WITH_NO_FEEDBACK',
            visibility: 'SEEKER'
        },
        {
            id: 17,
            key: 'SESSION_COMPLETED',
            visibility: 'SEEKER'
        },
        {
            id: 18,
            key: 'SESSION_MESSAGE',
            visibility: 'SEEKER'
        },
        {
            id: 23,
            key: 'FILE_DELETION_REMINDER',
            visibility: 'SEEKER'
        },
        {
            id: 31,
            key: 'SESSION_REFUND_ISSUED',
            visibility: 'SEEKER'
        },
        {
            id: 11,
            key: 'INCOMING_SESSION_REQUEST',
            visibility: 'EXPERT'
        },
        {
            id: 12,
            key: 'PAYOUT_ERROR',
            visibility: 'EXPERT'
        },
        {
            id: 13,
            key: 'PAYOUT_EXECUTED',
            visibility: 'EXPERT'
        },
        {
            id: 15,
            key: 'SESSION_FEEDBACK_RECEIVED',
            visibility: 'EXPERT'
        },
        {
            id: 16,
            key: 'SESSION_PLANNED_EXPERT',
            visibility: 'EXPERT'
        },
        {
            id: 8,
            key: 'SESSION_REJECTED_EXPERT',
            visibility: 'EXPERT'
        },
        {
            id: 28,
            key: 'SESSION_TO_BE_REJECTED_BY_SYSTEM',
            visibility: 'EXPERT'
        },
        {
            id: 27,
            key: 'FIRST_SESSION_COMPLETED',
            visibility: 'EXPERT'
        },
    ]);