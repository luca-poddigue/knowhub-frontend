'use strict';

angular.module('knowhub')
    .component('tabAvailability', {
        templateUrl: 'sections/manage/tab-availability/tab-availability.html',
        controller: function tabAvailabilityController($q, spinnerService, $filter, $element, $timeout, userService, alertService, $scope) {

            let $ctrl = this;
            let options;
            let oldEvents;
            let translate;

            $ctrl.$onInit = function () {
                translate = $filter('translate');
                $ctrl.isAppReady = spinnerService.isAppReady;
                $ctrl.status = 'view'; //view, edit, saving
                $ctrl.isDaysTouched = false;
                $ctrl.weekStartDay = userService.weekStartsAtDay();

                let now = moment();
                $ctrl.minAvailabilityTime = getCeiledMoment(now);

                $ctrl.quickInsertData = {
                    days: [],
                    time: {
                        from: getRoundedDate(now.clone().toDate()),
                        to: getRoundedDate(now.clone().add(30, 'minutes').toDate())
                    }
                };

                options = {
                    timezone: 'local',
                    height: 'auto',
                    navLinks: true,
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
                    allDaySlot: false,
                    editable: false,
                    locale: userService.language(),
                    selectable: true,
                    selectHelper: true,
                    select: function (start, end) {
                        let newEvent;
                        newEvent = {
                            title: '',
                            start: start,
                            end: end
                        };
                        removeEvents(findEventsToBeRemoved(newEvent)['toRemove']);
                        $ctrl.calendar.fullCalendar('renderEvent', newEvent, true);
                        $ctrl.calendar.fullCalendar('unselect');
                    },
                    selectAllow: function (selectInfo) {
                        if (!$ctrl.editable()) {
                            return false;
                        }
                        let canSelect = $ctrl.currentView() !== 'month'
                            && selectInfo.start.local().isSameOrAfter(moment());
                        if (!canSelect) {
                            if ($ctrl.currentView() === 'month') {
                                $scope.$evalAsync(() => {
                                    alertService.displayAlert('AVAILABILITY_CALENDAR_CANT_EDIT_MONTH', null, 'WARNING');
                                });
                            }
                        }
                        return canSelect;
                    },
                    eventDrop: function (event) {
                        removeEvents(findEventsToBeRemoved(event)['toRemove']);
                    },
                    eventAllow: function (dropInfo) {
                        if (!$ctrl.editable()) {
                            return false;
                        }
                        return dropInfo.start.local().isSameOrAfter(moment());
                    },
                    eventResize: function (event) {
                        removeEvents(findEventsToBeRemoved(event)['toRemove']);
                    },
                    eventClick: function (event) {
                        if ($ctrl.editable()) {
                            $ctrl.calendar.fullCalendar('removeEvents', event._id);
                        }
                    }
                };

                userService.getExpertAvailability(userService.basicInfo().id).then(function (response) {
                    let availability = [];
                    angular.forEach(response.data.availability, function (event) {
                        this.push({
                            title: '',
                            start: new Date(Number(event[0])),
                            end: new Date(Number(event[1]))
                        });
                    }, availability);
                    availability.push({
                        id: 'past-event',
                        start: moment(0),
                        end: $ctrl.minAvailabilityTime,
                        rendering: 'background'
                    });
                    options.events = availability;
                    $ctrl.calendar.fullCalendar(options);
                    $timeout(function () {
                        $ctrl.editable(false);
                        updateCursors();
                        updateNavButtons();
                    });
                }, angular.noop);

                $ctrl.calendar = $element.find('.calendar');
            };

            $ctrl.edit = function () {
                oldEvents = angular.copy($ctrl.calendar.fullCalendar('clientEvents'));
                $ctrl.editable(true);
            };

            $ctrl.daysTouched = function () {
                $ctrl.isDaysTouched = true;
            };

            $ctrl.timeRangeValid = function () {
                return ($ctrl.quickInsertData.time.from.getHours() < $ctrl.quickInsertData.time.to.getHours()) || ($ctrl.quickInsertData.time.from.getHours() === $ctrl.quickInsertData.time.to.getHours() && $ctrl.quickInsertData.time.from.getMinutes() < $ctrl.quickInsertData.time.to.getMinutes()) || ($ctrl.quickInsertData.time.to.getHours() === 0 && $ctrl.quickInsertData.time.to.getMinutes() === 0);
            };

            $ctrl.cancel = function () {
                $ctrl.editable(false);
                $ctrl.calendar.fullCalendar('removeEvents');
                $ctrl.calendar.fullCalendar('addEventSource', oldEvents);
            };

            $ctrl.clearAll = function () {
                $ctrl.calendar.fullCalendar('removeEvents', function (event) {
                    return event.rendering !== 'background';
                });
            };

            $ctrl.save = function () {
                $ctrl.editable(false);
                $ctrl.status = 'saving';
                let availability = [];
                angular.forEach($ctrl.calendar.fullCalendar('clientEvents'), function (event) {
                    if (event.rendering === 'background') {
                        return;
                    }
                    this.push([
                        event.start.toDate(),
                        event.end.toDate()]);
                }, availability);
                return userService.putExpertAvailability(availability).then(function () {
                    $ctrl.editable(false);
                    alertService.displayAlert('AVAILABILITY_SAVED', null, 'SUCCESS');
                });
            };

            $ctrl.editable = function (editable) {
                if (!isCalendarInitialized())
                    return false;
                if (angular.isDefined(editable)) {
                    $ctrl.calendar.fullCalendar('option', 'editable', editable);
                    $ctrl.status = editable ? 'edit' : 'view';
                    updateCursors();
                    updateNavButtons();
                } else {
                    return !!$ctrl.calendar.fullCalendar('option', 'editable');
                }
            };

            $ctrl.daysSelected = function () {
                for (let day in $ctrl.quickInsertData.days) {
                    if ($ctrl.quickInsertData.days.hasOwnProperty(day)) {
                        if ($ctrl.quickInsertData.days[day]) {
                            return true;
                        }
                    }
                }
                return false;
            };

            $ctrl.quickInsert = function () {
                let events = [];
                let allEventsToBeRemoved = [];
                angular.forEach($ctrl.quickInsertData.days, function (selected, dayNum) {
                    if (selected) {
                        let startDate = new Date($ctrl.quickInsertData.period[0].getTime());
                        startDate.setHours($ctrl.quickInsertData.time.from.getHours());
                        startDate.setMinutes($ctrl.quickInsertData.time.from.getMinutes());
                        startDate.setDate(startDate.getDate() + (7 + dayNum - startDate.getDay()) % 7);

                        let endDate = new Date(startDate.getTime());
                        if ($ctrl.quickInsertData.time.to.getHours() === 0 && $ctrl.quickInsertData.time.to.getMinutes() === 0) {
                            endDate.setDate(startDate.getDate() + 1);
                        }
                        endDate.setHours($ctrl.quickInsertData.time.to.getHours());
                        endDate.setMinutes($ctrl.quickInsertData.time.to.getMinutes());

                        while (endDate < $ctrl.quickInsertData.period[1]) {
                            if (startDate >= $ctrl.minAvailabilityTime) {
                                let newEvent;
                                newEvent = {
                                    title: '',
                                    start: moment(startDate),
                                    end: moment(endDate)
                                };
                                let eventsToBeRemoved = findEventsToBeRemoved(newEvent);
                                allEventsToBeRemoved = allEventsToBeRemoved.concat(eventsToBeRemoved['toRemove']);
                                if (!eventsToBeRemoved['skipNew']) {
                                    events.push(newEvent);
                                }
                            }
                            startDate.setDate(startDate.getDate() + 7);
                            endDate.setDate(endDate.getDate() + 7);
                        }
                    }
                });
                removeEvents(allEventsToBeRemoved);
                $ctrl.calendar.fullCalendar('renderEvents', events, true);

                alertService.displayAlert('AVAILABILITY_BATCH_INSERT_COMPLETED', null, 'SUCCESS');
            };

            $ctrl.changeView = function (viewName) {
                $scope.$evalAsync(() => {
                    $ctrl.calendar.fullCalendar('changeView', viewName);
                    updateCursors();
                    updateNavButtons();
                });

            };

            $ctrl.currentView = function () {
                if (isCalendarInitialized())
                    return $ctrl.calendar.fullCalendar('getView').name;
            };

            $ctrl.$onDestroy = function () {
                $ctrl.calendar.fullCalendar('destroy');
            };

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

            function isCalendarInitialized() {
                return $ctrl.calendar.children().length > 0;
            }

            function updateNavButtons() {
                $ctrl.prevButtonDisabled = $ctrl.calendar.fullCalendar('getView').intervalStart.isSameOrBefore(moment());
            }

            function findEventsToBeRemoved(newEvent) {
                let events = $ctrl.calendar.fullCalendar('clientEvents');
                let eventsToBeRemoved = [];
                let skipNew = false;
                angular.forEach(events, function (event) {
                    if (event.rendering === 'background') {
                        return;
                    }
                    if (newEvent._id && newEvent._id === event._id) {
                        return;
                    }
                    if ((newEvent.start.isSameOrBefore(event.start) && newEvent.end.isSameOrAfter(event.start)) ||
                        (newEvent.end.isSameOrAfter(event.end) && newEvent.start.isSameOrBefore(event.end))) {
                        eventsToBeRemoved.push(event._id);
                        if (event.start.isBefore(newEvent.start)) {
                            newEvent.start = event.start;
                        }
                        if (event.end.isAfter(newEvent.end)) {
                            newEvent.end = event.end;
                        }
                    } else if (newEvent.start.isSameOrAfter(event.start) && newEvent.start.isSameOrBefore(event.end)) {
                        skipNew = true;
                    }
                });
                return {
                    toRemove: eventsToBeRemoved,
                    skipNew: skipNew
                };
            }

            function removeEvents(eventsToBeRemoved) {
                $ctrl.calendar.fullCalendar('removeEvents', function (event) {
                    return eventsToBeRemoved.contains(event._id);
                });
            }

            function updateCursors() {
                if ($ctrl.editable()) {
                    $ctrl.calendar.find('.fc-event').awesomeCursor('arrows', {
                        hotspot: [8, 8]
                    });
                    $ctrl.calendar.find('.fc-agenda-view .fc-axis + .fc-widget-content').awesomeCursor('pencil', {
                        hotspot: 'bottom left'
                    });
                } else {
                    $ctrl.calendar.find('.fc-agenda-view .fc-widget-content').css('cursor', '');
                    $ctrl.calendar.find('fc-event').css('cursor', '');
                }
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

            function getRoundedDate(date) {
                let oneHour = 60 * 60 * 1000;
                let mins = date.getMinutes();
                if (mins <= 15) {
                    date.setMinutes(0);
                } else if (mins > 45) {
                    date.setMinutes(0);
                    date.setTime(date.getTime() + oneHour);
                } else {
                    date.setMinutes(30);
                }
                return date;
            }

        }
    });