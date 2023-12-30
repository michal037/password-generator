/* avoid `console` errors in browsers that lack a console */
(function () {
    var method;
    var noop = function () { };
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        /* only stub undefined methods */
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

/* register service worker */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').then(registration => {
            /* registration was successful */
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            /* registration failed */
            console.error('ServiceWorker registration failed:\n', err);
        });
    });
}

/* application body */
let app = {
    dom: {},
    charSet: {
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        digit:     '0123456789',
        symbol:    '!\"#$%&\'()*+,-.\/:;<=>?@[\\]^_`{|}~'
    },
    passwordLength: {
        min: 1,
        max: 128
    },
    isLowercase(x) {
        let code = x.charCodeAt(0);

        if ((code >= 97) && (code <= 122)) {
            return true;
        }

        return false;
    },
    isUppercase(x) {
        let code = x.charCodeAt(0);

        if ((code >= 65) && (code <= 90)) {
            return true;
        }

        return false;
    },
    isDigit(x) {
        let code = x.charCodeAt(0);

        if ((code >= 48) && (code <= 57)) {
            return true;
        }

        return false;
    },
    isSymbol(x) {
        for (const char of app.charSet.symbol) {
            if (x === char) {
                return true;
            }
        }

        return false;
    },
    isChar(x) {
        let code = x.charCodeAt(0);

        if ((code >= 33) && (code <= 126)) {
            return true;
        }

        return false;
    },
    sortChars(data) {
        let lowercase = '';
        let uppercase = '';
        let digit     = '';
        let symbol    = '';

        for (const char of data) {
            if (app.isLowercase(char)) {
                lowercase += char;
            } else if (app.isUppercase(char)) {
                uppercase += char;
            } else if (app.isDigit(char)) {
                digit += char;
            } else if (app.isSymbol(char)) {
                symbol += char;
            }
        }

        return {
            lowercase: lowercase,
            uppercase: uppercase,
            digit:     digit,
            symbol:    symbol
        };
    },
    charMap(charSet, logic) {
        let tempMap = new Map();
        for (const char of charSet) {
            tempMap.set(char, logic);
        }
        return tempMap;
    },
    charMapToString(charMap) {
        let result = '';
        charMap.forEach((value, key) => {
            if (value) {
                result += key;
            }
        });
        return result;
    },
    getRandomValue(max) {
        const value = window.crypto.getRandomValues(new Uint32Array(1))[0];

        /* <0;max) - max value is excluded */
        if (Number.isInteger(max)) {
            return value % Math.abs(max);
        }

        return value;
    },
    getRandomChar(charSet) {
        return charSet[app.getRandomValue(charSet.length)];
    },
    clearPassword() {
        /* remove content of `password` */
        app.dom.password.innerHTML = '';
    },
    printPassword(password) {
        /* set a different style for each character */
        for (const char of password) {
            /* style for digit */
            if (app.isDigit(char)) {
                let el = document.createElement('span');
                el.setAttribute('class', 'digit');
                el.innerText = char;
                app.dom.password.appendChild(el);
                continue;
            }

            /* style for symbol */
            if (app.isSymbol(char)) {
                let el = document.createElement('span');
                el.setAttribute('class', 'symbol');
                el.innerText = char;
                app.dom.password.appendChild(el);
                continue;
            }

            /* default style for the rest of ASCII characters */
            if (app.isChar(char)) {
                let el = document.createTextNode(char);
                app.dom.password.appendChild(el);
            }
        }
    },
    generate() {
        /* check for bad `length` */
        const length = parseInt(app.dom.length.value, 10);
        if (length === 0) {
            console.error("Unable to generate a password with a length of 0.");
            return;
        }

        /* check for empty character sets */
        const cboxLowercase = app.dom.lowercase.checked;
        const cboxUppercase = app.dom.uppercase.checked;
        const cboxDigit     = app.dom.digit.checked;
        const cboxSymbol    = app.dom.symbol.checked;
        const include       = app.dom.include.value;
        if (!cboxLowercase && !cboxUppercase && !cboxDigit && !cboxSymbol) {
            /* `include` cannot be empty */
            if (include === '') {
                console.error('Unable to generate a password, empty character sets.');
                return;
            }

            /* `include` must contain at least one ASCII character */
            let trigger = true;
            for (const char of include) {
                if (app.isChar(char)) {
                    trigger = false;
                    break;
                }
            }
            if (trigger) {
                console.error('Unable to generate a password, include does not contain at least one ASCII character.');
                return;
            }
        }

        /* create characters maps */
        let mapLowercase = app.charMap(app.charSet.lowercase, cboxLowercase);
        let mapUppercase = app.charMap(app.charSet.uppercase, cboxUppercase);
        let mapDigit     = app.charMap(app.charSet.digit,     cboxDigit);
        let mapSymbol    = app.charMap(app.charSet.symbol,    cboxSymbol);

        /* sort `include` characters */
        const includeSorted = app.sortChars(include);

        /* set true for `include` characters */
        mapLowercase = new Map([...mapLowercase, ...app.charMap(includeSorted.lowercase, true)]);
        mapUppercase = new Map([...mapUppercase, ...app.charMap(includeSorted.uppercase, true)]);
        mapDigit     = new Map([...mapDigit,     ...app.charMap(includeSorted.digit,     true)]);
        mapSymbol    = new Map([...mapSymbol,    ...app.charMap(includeSorted.symbol,    true)]);

        /* sort `exclude` characters */
        const excludeSorted = app.sortChars(app.dom.exclude.value);

        /* set false for `exclude` characters */
        mapLowercase = new Map([...mapLowercase, ...app.charMap(excludeSorted.lowercase, false)]);
        mapUppercase = new Map([...mapUppercase, ...app.charMap(excludeSorted.uppercase, false)]);
        mapDigit     = new Map([...mapDigit,     ...app.charMap(excludeSorted.digit,     false)]);
        mapSymbol    = new Map([...mapSymbol,    ...app.charMap(excludeSorted.symbol,    false)]);

        /* convert from charMap to string */
        const strLowercase = app.charMapToString(mapLowercase);
        const strUppercase = app.charMapToString(mapUppercase);
        const strDigit     = app.charMapToString(mapDigit);
        const strSymbol    = app.charMapToString(mapSymbol);

        /* check for empty character sets */
        if ((strLowercase === '') && (strUppercase === '') && (strDigit === '') && (strSymbol === '')) {
            console.error('Unable to generate a password, empty character sets.');
            return;
        }

        /* simple method for short passwords */
        if (length <= 3) {
            let arr = [];
            for (let i = 0; i < length; i++) {
                arr[i] = app.getRandomChar(strLowercase + strUppercase + strDigit + strSymbol);
            }
            app.clearPassword();
            app.printPassword(arr);
            return;
        }

        /* guarantee at least one character from a non-empty character group */
        /* create order array */
        let orderArray = [];
        for (let i = 0; i < length; i++) {
            orderArray[i] = i;
        }

        /* create exception array */
        let exceptionArray = [];
        if (strLowercase !== '') {
            exceptionArray.push({
                name: 'L', /* Lowercase */
                num: orderArray.splice(app.getRandomValue(orderArray.length), 1)[0]
            });
        }
        if (strUppercase !== '') {
            exceptionArray.push({
                name: 'U', /* Uppercase */
                num: orderArray.splice(app.getRandomValue(orderArray.length), 1)[0]
            });
        }
        if (strDigit !== '') {
            exceptionArray.push({
                name: 'D', /* Digit */
                num: orderArray.splice(app.getRandomValue(orderArray.length), 1)[0]
            });
        }
        if (strSymbol !== '') {
            exceptionArray.push({
                name: 'S', /* Symbol */
                num: orderArray.splice(app.getRandomValue(orderArray.length), 1)[0]
            });
        }

        /* generate new password */
        let trigger = false;
        app.clearPassword();
        for (let i = 0; i < length; i++) {
            /* check if `i` is in `exceptionArray`, if so, write the appropriate character */
            for (let k = 0; k < exceptionArray.length; k++) {
                if (i === exceptionArray[k].num) {
                    switch (exceptionArray[k].name) {
                        case 'L':
                            /* Lowercase */
                            app.printPassword(app.getRandomChar(strLowercase));
                            break;

                        case 'U':
                            /* Uppercase */
                            app.printPassword(app.getRandomChar(strUppercase));
                            break;

                        case 'D':
                            /* Digit */
                            app.printPassword(app.getRandomChar(strDigit));
                            break;

                        case 'S':
                            /* Symbol */
                            app.printPassword(app.getRandomChar(strSymbol));
                            break;
                    }

                    /* remove the printed character from the array, block universal character generation */
                    exceptionArray.splice(k, 1);
                    trigger = true;
                    break;
                }
            }

            /* block universal character generation */
            if (trigger) {
                trigger = false;
                continue;
            }

            /* universal character generation */
            app.printPassword(app.getRandomChar(strLowercase + strUppercase + strDigit + strSymbol));
        }
    }
};

/* starting point */
document.addEventListener('DOMContentLoaded', () => {
    /* get elements from DOM */
    const $id = s => { return document.getElementById(s); };
    app.dom.password  = $id('appPassword');
    app.dom.copy      = $id('appCopy');
    app.dom.generate  = $id('appGenerate');
    app.dom.length    = $id('appLength');
    app.dom.slider    = $id('appSlider');
    app.dom.lowercase = $id('appLowercase');
    app.dom.uppercase = $id('appUppercase');
    app.dom.digit     = $id('appDigit');
    app.dom.symbol    = $id('appSymbol');
    app.dom.include   = $id('appInclude');
    app.dom.exclude   = $id('appExclude');

    /* test for app.dom */
    for (let element in app.dom) {
        if (!app.dom[element]) {
            console.error(`Missing interface element: ${element}`);
            alert(`Missing interface element: ${element}`);
            return;
        }
    }

    /* set default values */
    app.dom.exclude.value = '01iILl\"oO\'|`';
    app.dom.length.value  = 32;
    app.dom.slider.value  = 32;

    /* callback for `length` input */
    app.dom.length.addEventListener('change', () => {
        let value = parseInt(app.dom.length.value, 10);

        /* accept only integer value */
        if (isNaN(value)) {
            app.dom.length.value = app.passwordLength.min;
            value = app.passwordLength.min;
        }

        /* check acceptable range */
        if (value < app.passwordLength.min) {
            app.dom.length.value = app.passwordLength.min;
            value = app.passwordLength.min;
        }
        if (value > app.passwordLength.max) {
            app.dom.length.value = app.passwordLength.max;
            value = app.passwordLength.max;
        }

        /* set the same value for `slider` */
        app.dom.slider.value = value;

        /* generate trigger */
        app.generate();
    });

    /* callback for `slider` input */
    app.dom.slider.addEventListener('change', () => {
        let value = parseInt(app.dom.slider.value, 10);

        /* accept only integer value */
        if (isNaN(value)) {
            app.dom.slider.value = app.passwordLength.min;
            value = app.passwordLength.min;
        }

        /* check acceptable range */
        if (value < app.passwordLength.min) {
            app.dom.slider.value = app.passwordLength.min;
            value = app.passwordLength.min;
        }
        if (value > app.passwordLength.max) {
            app.dom.slider.value = app.passwordLength.max;
            value = app.passwordLength.max;
        }

        /* set the same value for `length` */
        app.dom.length.value = value;

        /* generate trigger */
        app.generate();
    });

    /* callback for copy button */
    app.dom.copy.addEventListener('click', () => {
        if (window.getSelection) {
            let selection = window.getSelection();
            let range = document.createRange();
            range.selectNodeContents(app.dom.password);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand('Copy');
        } else {
            console.error('Unable to copy password, no API: window.getSelection');
        }
    });

    /* callbacks for generate */
    app.dom.lowercase.addEventListener('change', app.generate);
    app.dom.uppercase.addEventListener('change', app.generate);
    app.dom.digit    .addEventListener('change', app.generate);
    app.dom.symbol   .addEventListener('change', app.generate);
    app.dom.include  .addEventListener('change', app.generate);
    app.dom.exclude  .addEventListener('change', app.generate);
    app.dom.generate .addEventListener( 'click', app.generate);

    /* generate trigger */
    app.generate();
});
