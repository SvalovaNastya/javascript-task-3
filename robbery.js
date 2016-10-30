'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var MINUTES_IN_DAY = 1440;
var MINUTES_IN_HOUR = 60;
var DAYS_FOR_ROBBERY = 3;
var WEEKDAYS_MAP = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

function getIntTimeFromMonday(timeString) {
    var timeRegex = /([А-Яа-я]{2}) (\d{2}):(\d{2})\+(\d+)/;
    var timeGroups = timeRegex.exec(timeString);

    return WEEKDAYS_MAP.indexOf(timeGroups[1]) * MINUTES_IN_DAY +
        parseInt(timeGroups[2], 10) * MINUTES_IN_HOUR +
        parseInt(timeGroups[3], 10) - parseInt(timeGroups[4], 10) * MINUTES_IN_HOUR;
}

function sortIntervals(a, b) {
    if (a.from > b.from) {
        return 1;
    }
    if (a.from < b.from) {
        return -1;
    }

    return 0;
}

function getInterval(interval) {
    var timeFrom = getIntTimeFromMonday(interval.from);
    var timeTo = getIntTimeFromMonday(interval.to);

    return { from: timeFrom, to: timeTo };
}

function getTimeIntervalForBank(weekday, workingHours) {
    return {
        from: WEEKDAYS_MAP[weekday] + ' ' + workingHours.to,
        to: WEEKDAYS_MAP[weekday + 1] + ' ' + workingHours.from
    };
}

function getBankTimeZone(workingHours) {
    var timeZoneRegex = /\+(\d+)/;
    var timeZoneGroups = timeZoneRegex.exec(workingHours.from);

    return parseInt(timeZoneGroups[1], 10);
}

function prepareBankTimeIntervals(bankTimeZone, workingHours) {
    var bankBusyIntervals = [];
    var startIntervalForBank = {
        from: WEEKDAYS_MAP[0] + ' 00:00+' + bankTimeZone,
        to: WEEKDAYS_MAP[0] + ' ' + workingHours.from
    };
    bankBusyIntervals.push(getInterval(startIntervalForBank));

    for (var weekday = 0; weekday < DAYS_FOR_ROBBERY; weekday++) {
        bankBusyIntervals.push(getInterval(getTimeIntervalForBank(weekday, workingHours)));
    }

    return bankBusyIntervals;
}

function prepareTimeIntervals(schedule, workingHours, bankTimeZone) {
    var busyIntervals = [];

    Object.keys(schedule).forEach(function (manScheduleKey) {
        var manSchedule = schedule[manScheduleKey];
        for (var i = 0; i < manSchedule.length; i++) {
            busyIntervals.push(getInterval(manSchedule[i]));
        }
    });

    busyIntervals = busyIntervals.concat(prepareBankTimeIntervals(bankTimeZone, workingHours));

    return busyIntervals.sort(sortIntervals);
}

function getTimeParts(intTime, bankTimeZone) {
    intTime += bankTimeZone * MINUTES_IN_HOUR;
    var weekday = Math.floor(intTime / MINUTES_IN_DAY);
    intTime -= weekday * MINUTES_IN_DAY;
    var hours = Math.floor(intTime / MINUTES_IN_HOUR);
    intTime -= hours * MINUTES_IN_HOUR;

    return { weekday: WEEKDAYS_MAP[weekday], hours: hours, minutes: intTime };
}

function getTimeForRobbery(bankTimeZone, busyIntervals, duration) {
    var timeForRobbery = [];
    var currentTime = - bankTimeZone * MINUTES_IN_HOUR;
    var currentIntervalIndex = 0;
    var endTimeOfRobbery = DAYS_FOR_ROBBERY * MINUTES_IN_DAY - bankTimeZone * MINUTES_IN_HOUR - 1;

    while (currentTime <= endTimeOfRobbery && currentIntervalIndex < busyIntervals.length) {
        var currentInterval = busyIntervals[currentIntervalIndex];
        if (currentInterval.from - currentTime >= duration) {
            timeForRobbery.push(currentTime);
            currentTime += 30;
        } else {
            currentTime = Math.max(currentInterval.to, currentTime);
            currentIntervalIndex++;
        }
    }

    return timeForRobbery;
}

function toTimePartFormatString(time) {
    if (time < 10) {
        return '0' + time;
    }

    return time.toString();
}

function getFormatData(time, template, bankTimeZone) {
    var timeObject = getTimeParts(time, bankTimeZone);
    var formatString = template.replace('%HH', toTimePartFormatString(timeObject.hours))
        .replace('%MM', toTimePartFormatString(timeObject.minutes))
        .replace('%DD', timeObject.weekday);

    return formatString;
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, '10:00+5'
 * @param {String} workingHours.to – Время закрытия, например, '18:00+5'
 * @returns {Object}
 */

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var currentTimeIndex = 0;
    var bankTimeZone = getBankTimeZone(workingHours);
    var busyIntervals = prepareTimeIntervals(schedule, workingHours, bankTimeZone);
    var timeForRobbery = getTimeForRobbery(bankTimeZone, busyIntervals, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
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
                ? getFormatData(timeForRobbery[currentTimeIndex], template, bankTimeZone)
                : '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (currentTimeIndex < timeForRobbery.length - 1) {
                currentTimeIndex++;

                return true;
            }

            return false;
        }
    };
};
