/**
 * Light pivot localization.
 *
 * @scope {pivotLocale} - Sets the pivotLocale scope variable.
 * @param {string} [locale] - Two-letter language code.
 * @constructor
 */
var PivotLocale = function (locale) {

    this.LOCALE = "";
    this.DEFAULT_LOCALE = "en";

    this.setLocale(locale
                   || (navigator.language || "").substr(0, 2)
                   || (navigator["browserLanguage"]
                   || this.DEFAULT_LOCALE).substring(0, 2));

};

/**
 * Editable locales.
 *
 * @type {{ru: string, en: string, de: string}[]}
 */
PivotLocale.prototype.LOCALES = [
    { "ru": "Всего", "en": "Total", "de": "Summe" },
    {
        "ru": "Невозможно отобразить данные",
        "en": "Unable to render data",
        "de": "Daten können nicht rendern"
    },
    {
        "ru": "Неправильные данные для отображения.",
        "en": "Invalid data to display.",
        "de": "Nicht korrekt Informationen angezeigt werden soll."
    },
    {
        "ru": "Возникла ошибка при получении данных с сервера.",
        "en": "Error while trying to retrieve data from server.",
        "de": "Beim Abrufen der Daten vom Server ist ein Fehler aufgetreten."
    }
];

/**
 * @param {string} locale - Two-letter code locale.
 */
PivotLocale.prototype.setLocale = function (locale) {

    var i, locales = [];

    locale = locale.toLowerCase();

    if (this.LOCALES[0].hasOwnProperty(locale)) {
        this.LOCALE = locale;
    } else {
        for (i in this.LOCALES[0]) { locales.push(i); }
        console.warn(
            "LightPivot: locale " + locale + " is not supported. Currently localized: "
            + locales.join(", ") + "."
        );
        this.LOCALE = "en";
    }

};

/**
 * Get the localized phrase.
 *
 * @param {number} index - Index of phrase.
 * @returns {string} - Localized string.
 */
PivotLocale.prototype.get = function (index) {

    return (this.LOCALES[index] || {})[this.LOCALE] || "{not localized}";

};

var pivotLocale = new PivotLocale();