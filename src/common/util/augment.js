'use strict';

String.prototype.replaceAll = function (search, replacement) {
    let target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

String.prototype.startsWith = function (prefix) {
    return this.indexOf(prefix) === 0;
};

String.prototype.endsWith = function (suffix) {
    return this.match(suffix + "$") == suffix;
};

String.prototype.replaceCharAt = function (index, character) {
    return this.substr(0, index) + character + this.substr(index + 1);
};

String.prototype.contains = function (str) {
    return this.indexOf(str) !== -1;
};

Array.prototype.contains = function (obj) {
    return this.indexOf(obj) !== -1;
};

String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.toBoolean = function () {
    return this.toString() === 'true';
};

String.prototype.isCurrencySymbol = function () {
    return /^[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]$/.test(this);
};

String.prototype.hashCode = function() {
    let hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

angular.isDefinedAndNotNull = function (value) {
    return angular.isDefined(value) && value !== null;
};

angular.getObjectKeys = function (object) {
    let keys = [];
    angular.forEach(object, function (value, key) {
        keys.push(key);
    }, keys);
    return keys;
};

angular.getObjectValues = function (object) {
    let values = [];
    angular.forEach(object, function (value) {
        values.push(value);
    }, values);
    return values;
};

// used to make ngRepeat to behave as a for loop with incremental indices
angular.ngRepeatToForArray = function (length) {
    let i;
    let arr = [];
    for (i = 0; i < length; i++) {
        arr[i] = i;
    }
    return arr;
};

angular.isReallyNumber = function (value) {
    return angular.isNumber(value) && !isNaN(value);
};

angular.isUndefinedOrNull = function (value) {
    return angular.isUndefined(value) || value === null;
};

Array.prototype.shuffle = function () {
    let currentIndex = this.length;
    let temporaryValue;
    let randomIndex;

    while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = this[currentIndex];
        this[currentIndex] = this[randomIndex];
        this[randomIndex] = temporaryValue;
    }

    return this;
};

jQuery.fn.outerHTML = function () {
    return jQuery('<div />').append(this.eq(0).clone()).html();
};

// ARRAY.FIND POLYFILL - https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function(predicate) {
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }
            let o = Object(this);
            let len = o.length >>> 0;
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            let thisArg = arguments[1];
            let k = 0;
            while (k < len) {
                let kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                k++;
            }
            return undefined;
        }
    });
}

Date.minDate = new Date(-8640000000000000);
Date.maxDate = new Date(8640000000000000);