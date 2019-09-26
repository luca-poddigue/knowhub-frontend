'use strict';

angular.module('knowhub').controller('sessionReschedulingModal', function (maxDaysInFutureToScheduleSession, $document, spinnerService, userService, $timeout, $uibModalInstance, sharingSessionWorkflowService, liveNotificationType, $q, userType, $scope, session, expertId) {

    let $ctrl = this;

    $ctrl.hasAvailability = null;
    $ctrl.sessionChanged = false;

    let sessionRequestDate = new Date(Number(session.requestedOn));
    let now = moment();
    let minReschedulingTime = getCeiledMoment(moment(now));
    let maxReschedulingTime = getCeiledMoment(moment(sessionRequestDate))
        .subtract(30, 'minutes')
        .add(maxDaysInFutureToScheduleSession, 'days');

    let mostFutureEvent;
    let oldTimeSpan = [new Date(Number(session.timeSpan[0])), new Date(Number(session.timeSpan[1]))];

    $ctrl.userType = userType;
    if (session.seeker) {
        $ctrl.mode = userType.expert;
    } else {
        $ctrl.mode = userType.seeker;
    }

    if ($ctrl.mode === userType.seeker) {
        $ctrl.legendEntries = ['available', 'unavailable', 'available-in-future', 'session', 'current']
    } else {
        $ctrl.legendEntries = ['available', 'unavailable', 'session', 'current']
    }

    $scope.$on('liveNotifications:message', function (event, data) {
        if (session.id === data.sessionId && $ctrl.mode === userType.seeker &&
            [liveNotificationType.sessionUpdate,
                liveNotificationType.sessionCompletion,
                liveNotificationType.sessionRejection,
                liveNotificationType.sessionAccepted,
                liveNotificationType.sessionPlanned,
                liveNotificationType.sessionUnderInquiry].contains(data.type)) {
            $ctrl.sessionChanged = true;
        }
    });

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
                $ctrl.sessionReschedulingForm.timeSpan.$setTouched();
                $ctrl.newTimeSpan = [event.start.toDate(), event.end.toDate()];
            });
        },
        eventDrop: function (event) {
            $scope.$evalAsync(function () {
                $ctrl.sessionReschedulingForm.timeSpan.$setTouched();
                $ctrl.newTimeSpan = [event.start.toDate(), event.end.toDate()];
            });
        },
        select: function (start, end) {
            $ctrl.calendar.fullCalendar('removeEvents', 'current-session-event');
            let newEvent = {
                id: 'current-session-event',
                title: session.topic,
                start: start,
                end: end,
                editable: true,
                className: 'current-session-event'
            };
            $ctrl.calendar.fullCalendar('renderEvent', newEvent, true);
            $ctrl.calendar.fullCalendar('unselect');
            $scope.$evalAsync(function () {
                $ctrl.sessionReschedulingForm.timeSpan.$setTouched();
                $ctrl.newTimeSpan = [start.toDate(), end.toDate()];
            });
        },
        selectAllow: function (selectInfo) {
            selectInfo.start = selectInfo.start.local();
            selectInfo.end = selectInfo.end.local();
            return isEventInAvailabilitySlot(selectInfo);
        },
        eventAllow: function (dropInfo) {
            dropInfo.start = dropInfo.start.local();
            dropInfo.end = dropInfo.end.local();
            return isEventInAvailabilitySlot(dropInfo);
        },
        eventClick: function (event) {
            if (event.id === 'current-session-event') {
                $ctrl.calendar.fullCalendar('removeEvents', event.id);
                $scope.$evalAsync(function () {
                    $ctrl.sessionReschedulingForm.timeSpan.$setTouched();
                    delete $ctrl.newTimeSpan;
                });
            }
        }
    };

    $uibModalInstance.rendered.then(function () {
        spinnerService.show('session-rescheduling-calendar-spinner');
        $ctrl.calendar = $document.find(".session-rescheduling .calendar");
        userService.getExpertAvailability(expertId).then(function (response) {
            if ($ctrl.mode === userType.expert ||
                (response.data && response.data.availability && response.data.availability.length)) {
                $ctrl.hasAvailability = true;
                let eventsData = createEvents(response.data);
                mostFutureEvent = eventsData[1];
                options.events = eventsData[0];
                $ctrl.calendar.fullCalendar(options);
                let sessionStartDate = moment(Number(session.timeSpan[0]));
                if (sessionStartDate.isAfter(moment())) {
                    $ctrl.calendar.fullCalendar('gotoDate', sessionStartDate);
                }
                updateCursors();
                updateNavButtons();
                spinnerService.hide('session-rescheduling-calendar-spinner');
            } else {
                $ctrl.hasAvailability = false;
                spinnerService.hide('session-rescheduling-calendar-spinner');
            }
        }, function () {
            spinnerService.hide('session-rescheduling-calendar-spinner');
        });

    });

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

    function updateNavButtons() {
        $ctrl.prevButtonDisabled = $ctrl.calendar.fullCalendar('getCalendar').view.intervalStart.isSameOrBefore(moment());
        if ($ctrl.mode === userType.expert) {
            $ctrl.nextButtonDisabled = false;
        } else {
            $ctrl.nextButtonDisabled = $ctrl.calendar.fullCalendar('getCalendar').view.intervalEnd.isAfter(mostFutureEvent);
        }
    }

    function isEventInAvailabilitySlot(event) {
        let i;
        if ($ctrl.mode === userType.expert) {
            if (event.start.isBefore(minReschedulingTime) || event.end.isAfter(maxReschedulingTime)) {
                return false;
            }
            let sessionEvents = $ctrl.calendar.fullCalendar('clientEvents', 'session-event');
            for (i = 0; i < sessionEvents.length; i++) {
                if (sessionEvents[i].start.isSameOrAfter(event.start) && sessionEvents[i].end.isSameOrBefore(event.end)) {
                    return false;
                }
            }
            return true;
        } else {
            let availabilityEvents = $ctrl.calendar.fullCalendar('clientEvents', 'availability-event');
            for (i = 0; i < availabilityEvents.length; i++) {
                if (availabilityEvents[i].start.isSameOrBefore(event.start) && availabilityEvents[i].end.isSameOrAfter(event.end)) {
                    return true;
                }
            }
            return false;
        }
    }

    function updateCursors() {
        $ctrl.calendar.find('.fc-event.current-session-event').awesomeCursor('arrows', {
            hotspot: [8, 8]
        });
        $ctrl.calendar.find('.fc-agenda-view .fc-axis + .fc-widget-content').awesomeCursor('pencil', {
            hotspot: 'bottom left'
        });
    }

    function getCeiledMoment(momentObj) {
        let ceiledMoment = momentObj || moment();
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
        let currentSessionStartDate = moment(Number(session.timeSpan[0]));
        let currentSessionEndDate = moment(Number(session.timeSpan[1]));

        if ($ctrl.mode === userType.expert) {
            events.push({
                id: 'availability-event',
                title: '',
                start: minReschedulingTime,
                end: maxReschedulingTime,
                editable: false,
                className: 'availability-event',
                rendering: 'inverse-background'
            });
            mostFutureEvent = maxReschedulingTime.clone();
        } else {
            angular.forEach(data.availability, function (event) {
                let startDate = moment(Number(event[0]));
                let endDate = moment(Number(event[1]));

                if (startDate.isSame(endDate)) {
                    return;
                }

                if (startDate.isSameOrAfter(maxReschedulingTime)) {
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
                } else if (endDate.isSameOrAfter(maxReschedulingTime)) {
                    // split
                    this.push({
                        id: 'availability-event',
                        start: startDate,
                        end: maxReschedulingTime,
                        rendering: 'inverse-background'
                    });
                    this.push({
                        id: 'future-availability-event',
                        title: '',
                        start: maxReschedulingTime,
                        end: endDate,
                        editable: false,
                        className: 'future-availability-event'
                    });
                    if (endDate.isAfter(mostFutureEvent)) {
                        mostFutureEvent = endDate;
                    }
                    return;
                }

                if (endDate.isSameOrBefore(minReschedulingTime)) {
                    return;
                }

                if (startDate.isSameOrBefore(minReschedulingTime)) {
                    startDate = minReschedulingTime.clone();
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
        }
        angular.forEach(data.openSessions, function (event) {
            let startDate = moment(Number(event[0]));
            let endDate = moment(Number(event[1]));
            if (startDate.isSame(currentSessionStartDate) && endDate.isSame(currentSessionEndDate)) {
                return;
            }
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

        events.push({
            id: 'current-session-event',
            title: session.topic,
            start: currentSessionStartDate,
            end: currentSessionEndDate,
            editable: true,
            className: 'current-session-event'
        });
        $ctrl.newTimeSpan = [currentSessionStartDate.toDate(), currentSessionEndDate.toDate()];
        if (currentSessionEndDate.isAfter(mostFutureEvent)) {
            mostFutureEvent = currentSessionEndDate;
        }

        if ($ctrl.mode === userType.seeker) {
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
        }
        return [events, mostFutureEvent];
    }


    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.rescheduleSession = function () {
        if (oldTimeSpan[0].getTime() === $ctrl.newTimeSpan[0].getTime() &&
            oldTimeSpan[1].getTime() === $ctrl.newTimeSpan[1].getTime()) {
            $uibModalInstance.dismiss();
            return $q.resolve();
        } else {
            return sharingSessionWorkflowService.updateSession(session.id, session.price, $ctrl.newTimeSpan).then(function (sessionUpdate) {
                $uibModalInstance.close(sessionUpdate.data);
            }, function (rejection) {
                if (angular.isObject(rejection) && angular.isObject(rejection.data) && rejection.data.errorCode) {
                    /* if user is trying to reschedule the session but can't do it anymore, report unallowed action, that will reload the session to align the UI. */
                    if (['KH_ERR_4'].contains(rejection.data.errorCode)) {
                        $uibModalInstance.dismiss({
                            notAllowedAction: true
                        });
                        return $q.reject(rejection);
                    }
                    /* otherwise leave the modal open and refresh the calendar */
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
                    return $q.reject(rejection);
                }
            });
        }
    };

});