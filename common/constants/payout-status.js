angular.module('knowhub')
    .constant('payoutStatus', {
        paid: 'PAID',
        pending: 'PENDING',
        inTransit: 'IN_TRANSIT',
        canceled: 'CANCELED',
        failed: 'FAILED',
        waitingForSeekerFeedback: 'WAITING_FOR_SEEKER_FEEDBACK',
        unresolvedLitigation: 'UNRESOLVED_LITIGATION'
    });
