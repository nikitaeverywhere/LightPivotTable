var MDXParser = function () {



};

/**
 * Performs DrillDown on MDX query.
 *
 * @param {string} basicMDX
 * @param {string} filter
 * @returns {string} - new query.
 */
MDXParser.prototype.drillDown = function (basicMDX, filter) {

    try {

        var filterParts = filter.split(/(\(?)([^\)]*)(\)?)/),
            clearFilter = filterParts[2],
            parts = basicMDX.split(/(\s+ON\s+0,\s*)(.*)(\s+ON\s+1\s*)/),
            oldPath = parts[2].split(/(\(?)(\[[^\(^\)]*)(\)?)/);

        oldPath[2] = clearFilter + ".children";
        parts[2] = oldPath.join("");

        return parts.join("") + " %FILTER " + filterParts.join("");

    } catch (e) {

        console.error("Unable to get DrillDown statement from", basicMDX, "with filter", filter);
        return "";

    }

};

/**
 * Returns DrillThrough query for given MDX query.
 *
 * @param {string} basicMDX
 * @returns {string}
 */
MDXParser.prototype.drillThrough = function (basicMDX) {

    try {

        var statement = ["DRILLTHROUGH SELECT "]
            .concat(basicMDX.split(/(\s+ON\s+0,\s*)(.*)(\s+ON\s+1\s*)/).slice(2)).join("");

        console.log("DRILLTHROUGH STATEMENT:", statement);

        return statement === "DRILLTHROUGH SELECT " ? "" : statement;

    } catch (e) {

        console.error("Unable to get DrillThrough statement from", basicMDX);
        return "";

    }

};