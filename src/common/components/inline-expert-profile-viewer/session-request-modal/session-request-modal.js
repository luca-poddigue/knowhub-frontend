'use strict';

angular.module('knowhub').controller('sessionRequestModal', function (maxDaysInFutureToScheduleSession, $uibModalInstance, spinnerService, $document, $scope, expertId, expertName, source, sharingSessionWorkflowService, userService, $filter, $timeout, $q, cacheService, $location) {

    let $ctrl = this;

    let mostFutureEvent;
    let translate = $filter('translate');

    let now = moment();
    let minRequestTime = getCeiledMoment(now);
    let maxRequestTime = getCeiledMoment(now)
        .subtract(30, 'minutes')
        .add(maxDaysInFutureToScheduleSession, 'days');

    $ctrl.expertName = expertName;
    $ctrl.hasAvailability = null;
    $ctrl.source = source;
    $ctrl.request = {
        expertId: expertId
    };

    let options = {
        height: 'auto',
        navLinks: true,
        defaultView: 'agendaWeek',
        longPressDelay: 300,
        navLinkWeekClick: function (date) {
            $scope.$evalAsync(function () {
                $ctrl.changeView('agendaWeek');
                $ctrl.calendar.fullCalendar('gotoDate', date);
                updateCursors();
                updateNavButtons();
            });
        },
        navLinkDayClick: function (date) {
            $scope.$evalAsync(function () {
                $ctrl.changeView('agendaDay');
                $ctrl.calendar.fullCalendar('gotoDate', date);
                updateCursors();
                updateNavButtons();
            });
        },
        header: {
            left: 'title',
            right: ''
        },
        selectOverlap: function (event) {
            return event.id === 'availability-event';
        },
        eventOverlap: function (stillEvent) {
            return stillEvent.id === 'availability-event';
        },
        allDaySlot: false,
        timezone: 'local',
        editable: false,
        locale: userService.language(),
        selectable: true,
        selectHelper: true,
        eventResize: function (event) {
            $scope.$evalAsync(function () {
                $ctrl.sessionRequestForm.timeSpan.$setTouched();
                $ctrl.request.timeSpan = [event.start.toDate(), event.end.toDate()];
            });
        },
        eventDrop: function (event) {
            $scope.$evalAsync(function () {
                $ctrl.sessionRequestForm.timeSpan.$setTouched();
                $ctrl.request.timeSpan = [event.start.toDate(), event.end.toDate()];
            });
        },
        select: function (start, end) {
            $ctrl.calendar.fullCalendar('removeEvents', 'session-request-event');
            let newEvent = {
                id: 'session-request-event',
                title: $ctrl.request.topic || translate('SESSION_REQUEST_YOUR_SHARING_SESSION'),
                start: start,
                end: end,
                editable: true,
                className: 'session-request-event'
            };
            $ctrl.calendar.fullCalendar('renderEvent', newEvent, true);
            $ctrl.calendar.fullCalendar('unselect');
            $scope.$evalAsync(function () {
                $ctrl.sessionRequestForm.timeSpan.$setTouched();
                $ctrl.request.timeSpan = [start.toDate(), end.toDate()];
            });
        },
        selectAllow: function (selectInfo) {
            selectInfo.start = selectInfo.start.local();
            selectInfo.end = selectInfo.end.local();
            if (selectInfo.start.isSameOrBefore(moment())) {
                return false;
            }
            return isEventInAvailabilitySlot(selectInfo);
        },
        eventAllow: function (dropInfo) {
            dropInfo.start = dropInfo.start.local();
            dropInfo.end = dropInfo.end.local();
            return isEventInAvailabilitySlot(dropInfo);
        },
        eventClick: function (event) {
            if (event.id === 'session-request-event') {
                $ctrl.calendar.fullCalendar('removeEvents', event.id);
                $scope.$evalAsync(function () {
                    $ctrl.sessionRequestForm.timeSpan.$setTouched();
                    delete $ctrl.request.timeSpan;
                });
            }
        }
    };

    $uibModalInstance.rendered.then(function () {
        spinnerService.show('session-request-calendar-spinner');
        $ctrl.calendar = $document.find(".session-request-modal .calendar");
        userService.getExpertAvailability(expertId).then(function (response) {
            if (response.data && response.data.availability && response.data.availability.length) {
                $ctrl.hasAvailability = true;
                let eventsData = createEvents(response.data);
                mostFutureEvent = eventsData[1];
                options.events = eventsData[0];
                $ctrl.calendar.fullCalendar(options);
                updateCursors();
                updateNavButtons();
                spinnerService.hide('session-request-calendar-spinner');
            } else {
                $ctrl.hasAvailability = false;
                spinnerService.hide('session-request-calendar-spinner');
            }
        }, function () {
            spinnerService.hide('session-request-calendar-spinner');
        });

    });

    $ctrl.updateSharingSessionEvent = function () {
        if ($ctrl.hasAvailability) {
            let sessionEvent = $ctrl.calendar.fullCalendar('clientEvents', 'session-request-event')[0];
            if (sessionEvent) {
                sessionEvent.title = $ctrl.request.topic || translate('SESSION_REQUEST_YOUR_SHARING_SESSION');
                $ctrl.calendar.fullCalendar('updateEvent', sessionEvent);
            }
        }
    };

    $ctrl.changeView = function (viewName) {
        $ctrl.calendar.fullCalendar('changeView', viewName);
        updateCursors();
        updateNavButtons();
    };

    $ctrl.currentView = function () {
        if (!$ctrl.calendar) {
            return;
        }
        return $ctrl.calendar.fullCalendar('getView').name;
    };

    $scope.$on("$destroy", function () {
        $ctrl.calendar.fullCalendar('destroy');
    });

    $ctrl.next = function () {
        $ctrl.calendar.fullCalendar('next');
        updateCursors();
        updateNavButtons();
    };

    $ctrl.prev = function () {
        $ctrl.calendar.fullCalendar('prev');
        updateCursors();
        updateNavButtons();
    };

    $ctrl.sendRequest = function () {
        return sharingSessionWorkflowService.requestSession($ctrl.request).then(function (sessionId) {
            cacheService.clearCacheResource($location.apiBaseUrl() + 'sessions/filtersData');
            $uibModalInstance.close(sessionId);
        }, function (rejection) {
            if (angular.isObject(rejection) && angular.isObject(rejection.data) && rejection.data.errorCode) {
                return userService.getExpertAvailability(expertId).then(function (response) {
                    $ctrl.calendar.fullCalendar('removeEventSources');
                    if (response.data && response.data.availability && response.data.availability.length) {
                        $ctrl.hasAvailability = true;
                        let eventsData = createEvents(response.data);
                        mostFutureEvent = eventsData[1];
                        $ctrl.calendar.fullCalendar('addEventSource', eventsData[0]);
                    } else {
                        $ctrl.hasAvailability = false;
                    }
                });
            } else {
                return $q.reject('rejection');
            }
        });
    };

    $ctrl.cancel = function () {
        $uibModalInstance.dismiss();
    };

    function updateNavButtons() {
        $ctrl.prevButtonDisabled = $ctrl.calendar.fullCalendar('getCalendar').view.intervalStart.isSameOrBefore(moment());
        $ctrl.nextButtonDisabled = $ctrl.calendar.fullCalendar('getCalendar').view.intervalEnd.isAfter(mostFutureEvent);
    }

    function isEventInAvailabilitySlot(event) {
        let i;
        let availabilityEvents = $ctrl.calendar.fullCalendar('clientEvents', 'availability-event');
        for (i = 0; i < availabilityEvents.length; i++) {
            if (availabilityEvents[i].start.isSameOrBefore(event.start) && availabilityEvents[i].end.isSameOrAfter(event.end)) {
                return true;
            }
        }
        return false;
    }

    function updateCursors() {
        $ctrl.calendar.find('.fc-event.session-request-event').awesomeCursor('arrows', {
            hotspot: [8, 8]
        });
        $ctrl.calendar.find('.fc-agenda-view .fc-axis + .fc-widget-content').awesomeCursor('pencil', {
            hotspot: 'bottom left'
        });
    }

    function getCeiledMoment(momentObj) {
        let ceiledMoment = momentObj ? momentObj.clone() : moment();
        if (ceiledMoment.minutes() < 30) {
            ceiledMoment.minutes(30);
        } else {
            ceiledMoment.add(1, 'hour');
            ceiledMoment.minutes(0);
        }
        ceiledMoment.startOf('minute');
        return ceiledMoment;
    }

    function createEvents(data) {
        let events = [];
        let mostFutureEvent = moment();
        angular.forEach(data.availability, function (event) {
            let startDate = moment(Number(event[0]));
            let endDate = moment(Number(event[1]));

            if (startDate.isSame(endDate)) {
                return;
            }

            if (startDate.isSameOrAfter(maxRequestTime)) {
                this.push({
                    id: 'future-availability-event',
                    title: '',
                    start: startDate,
                    end: endDate,
                    editable: false,
                    className: 'future-availability-event'
                });
                if (endDate.isAfter(mostFutureEvent)) {
                    mostFutureEvent = endDate;
                }
                return;
            } else if (endDate.isSameOrAfter(maxRequestTime)) {
                // split
                this.push({
                    id: 'availability-event',
                    start: startDate,
                    end: maxRequestTime,
                    rendering: 'inverse-background'
                });
                this.push({
                    id: 'future-availability-event',
                    title: '',
                    start: maxRequestTime,
                    end: endDate,
                    editable: false,
                    className: 'future-availability-event'
                });
                if (endDate.isAfter(mostFutureEvent)) {
                    mostFutureEvent = endDate;
                }
                return;
            }

            if (endDate.isSameOrBefore(minRequestTime)) {
                return;
            }

            if (startDate.isSameOrBefore(minRequestTime)) {
                startDate = minRequestTime.clone();
            }

            this.push({
                id: 'availability-event',
                start: startDate,
                end: endDate,
                rendering: 'inverse-background'
            });
            if (endDate.isAfter(mostFutureEvent)) {
                mostFutureEvent = endDate;
            }
        }, events);
        angular.forEach(data.openSessions, function (event) {
            let startDate = moment(Number(event[0]));
            let endDate = moment(Number(event[1]));
            if (endDate.isSameOrBefore(now)) {
                return;
            }
            if (startDate.isSameOrBefore(now)) {
                startDate = getCeiledMoment(moment());
            }
            this.push({
                id: 'session-event',
                title: '',
                start: startDate,
                end: endDate,
                editable: false,
                className: 'session-event'
            });
            if (endDate.isAfter(mostFutureEvent)) {
                mostFutureEvent = endDate;
            }
        }, events);

        // workaround to get the gray background on views when there are no events.
        let currentDay = moment().startOf('day');
        let endDay = moment(mostFutureEvent).add(2, 'weeks'); // just to be sure
        while (currentDay.isBefore(endDay) || currentDay.isSame(endDay)) {
            events.push({
                id: 'availability-event',
                title: '',
                start: moment(currentDay),
                end: moment(currentDay).add(1, 'milliseconds'),
                editable: false,
                className: 'availability-event',
                rendering: 'inverse-background'
            });
            currentDay.add(1, 'days');
        }
        delete $ctrl.request.timeSpan;
        return [events, mostFutureEvent];
    }

});