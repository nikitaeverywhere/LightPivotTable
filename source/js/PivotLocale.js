/**
 * Light pivot localization.
 *
 * @scope {pivotLocale} - Sets the pivotLocale scope variable.
 * @param {string} [locale] - Two-letter language code.
 * @constructor
 */
var PivotLocale = function (locale) {

    this.LOCALE = "";

    this.setLocale(locale || navigator.language);

};

/**
 * Editable locales.
 *
 * @type {{ru: string, en: string, de: string}[]}
 */
PivotLocale.prototype.LOCALES = [
    { "ru": "Всего", "en": "Total", "de": "Summe" }
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