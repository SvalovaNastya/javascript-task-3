'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
var MINUTES_IN_DAY = 1440;
var MINUTES_IN_HOUR = 60;
var WEEKDAYS_MAP = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, '10:00+5'
 * @param {String} workingHours.to – Время закрытия, например, '18:00+5'
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var busyIntervals = [];
    var timeForRobbery = [];
    var bankTimeZone;
    var currentTimeForRobbery = 0;

    function getEndTimeOfRobbery() {
        return 3 * MINUTES_IN_DAY - bankTimeZone * MINUTES_IN_HOUR - 1;
    }

    function getIntTimeFromMonday(timeString) {
        var timeRegex = /([А-Яа-я]{2}) (\d{2}):(\d{2})\+(\d+)/;
        var timeGroups = timeRegex.exec(timeString);

        return WEEKDAYS_MAP.indexOf(timeGroups[1]) * MINUTES_IN_DAY +
            parseInt(timeGroups[2]) * MINUTES_IN_HOUR +
            parseInt(timeGroups[3]) - parseInt(timeGroups[4]) * MINUTES_IN_HOUR;
    }

    function getBankTimeZone() {
        var timeZoneRegex = /\+(\d+)/;
        var timeZoneGroups = timeZoneRegex.exec(workingHours.from);
        bankTimeZone = parseInt(timeZoneGroups[1]);
    }

    function addInterval(interval) {
        var timeFrom = getIntTimeFromMonday(interval.from);
        var timeTo = getIntTimeFromMonday(interval.to);
        if (timeTo > timeFrom) {
            busyIntervals.push(
                {
                    from: timeFrom,
                    to: timeTo
                });
        }
    }

    function prepareTimeIntervals() {
        for (var manScheduleKey in schedule) {
            if (!schedule.hasOwnProperty(manScheduleKey)) {
                continue;
            }
            var manSchedule = schedule[manScheduleKey];
            for (var i = 0; i < manSchedule.length; i++) {
                addInterval(manSchedule[i]);
            }
        }

        getBankTimeZone();

        addInterval(
            {
                from: WEEKDAYS_MAP[0] + ' 00:00+' + bankTimeZone,
                to: WEEKDAYS_MAP[0] + ' ' + workingHours.from
            });

        for (var weekday = 0; weekday < WEEKDAYS_MAP.length - 1; weekday++) {
            addInterval(
                {
                    from: WEEKDAYS_MAP[weekday] + ' ' + workingHours.to,
                    to: WEEKDAYS_MAP[weekday + 1] + ' ' + workingHours.from
                });
        }

        busyIntervals.sort(function (a, b) {
            if (a.from > b.from) {
                return 1;
            }
            if (a.from < b.from) {
                return -1;
            }

            return 0;
        });
    }

    prepareTimeIntervals();

    function getTimeForRobbery() {
        var currentTime = - bankTimeZone * MINUTES_IN_HOUR;
        var currentInterval = 0;
        while (currentTime <= getEndTimeOfRobbery() &&
            currentInterval < busyIntervals.length) {
            if (busyIntervals[currentInterval].from - currentTime >= duration) {
                timeForRobbery.push(currentTime);
                currentTime += 30;
            } else {
                currentTime = Math.max(busyIntervals[currentInterval].to, currentTime);
                currentInterval++;
            }
        }
    }

    function toTwoFormatString(time) {
        var formatString = '';
        if (time < 10) {
            formatString += '0';
        }
        formatString += time.toString();

        return formatString;
    }

    function getFormatData(time, template) {
        time += bankTimeZone * MINUTES_IN_HOUR;
        var weekday = Math.floor(time / MINUTES_IN_DAY);
        time -= weekday * MINUTES_IN_DAY;
        var hours = Math.floor(time / MINUTES_IN_HOUR);
        time -= hours * MINUTES_IN_HOUR;
        var minutes = time;
        var formatString = template.replace('%HH', toTwoFormatString(hours.toString()))
            .replace('%MM', toTwoFormatString(minutes.toString()))
            .replace('%DD', WEEKDAYS_MAP[weekday]);

        return formatString;
    }

    getTimeForRobbery();

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            currentTimeForRobbery = 0;

            return timeForRobbery.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   'Начинаем в %HH:%MM (%DD)' -> 'Начинаем в 14:59 (СР)'
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {

            return timeForRobbery.length > 0 && template
                ? getFormatData(timeForRobbery[currentTimeForRobbery], template)
                : '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (currentTimeForRobbery < timeForRobbery.length - 1) {
                currentTimeForRobbery++;

                return true;
            }

            return false;
        }
    };
};
