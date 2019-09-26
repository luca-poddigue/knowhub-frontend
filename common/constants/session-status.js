angular.module('knowhub')
    .constant('sessionStatus', {
        pending: 'PENDING',
        acceptedByExpert: 'ACCEPTED_BY_EXPERT',
        planned: 'PLANNED',
        completed: 'COMPLETED',
        rejected: 'REJECTED',
        inquiry: 'INQUIRY'
    });