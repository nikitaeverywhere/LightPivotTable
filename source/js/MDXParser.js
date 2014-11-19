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
            parts = basicMDX.split(/(\s+ON\s+0,\s*)(.*)(\s+ON\s+1\s*)/i),
            oldPath = parts[2].split(/(\(?)(\[[^\(^\)]*)(\)?)/);

        oldPath[2] = clearFilter + ".children";
        parts[2] = oldPath.join("");

        //console.log("\n\nIN: "+basicMDX+"\n\nFILTER: " + filter + "\n\nCUSTOM: "+  parts.join("")
        //    + " %FILTER " + filterParts.join(""));

        return parts.join("") + " %FILTER " + filterParts.join("");

    } catch (e) {

        console.error("Unable to get DrillDown statement from", basicMDX, "with filter", filter);
        return "";

    }

};

/**
 * Replace dimension [1] with expression.
 *
 * @param {string} basicMDX
 * @param {string} expression
 * @param {string} [filter]
 * @returns {string}
 */
MDXParser.prototype.customDrillDown = function (basicMDX, expression, filter) {

    try {

        var parts = basicMDX.split(/(\s+ON\s+0,\s*)(.*)(\s+ON\s+1\s*)/i);

        parts[2] = expression;

        if (filter) parts.push(" %FILTER " + filter);

        //console.log("\n\nIN: "+basicMDX+"\n\nEXPR: " + expression + "\n\nFILTER: "
        //    + filter + "\n\nCUSTOM: " + parts.join(""));

        return parts.join("");

    } catch (e) {

        console.error("Unable to get DrillDown statement from", basicMDX, "by", expression,
            "with filter", filter);
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
            .concat(basicMDX.split(/(\s+ON\s+0,\s*)(.*)(\s+ON\s+1\s*)/i).slice(2)).join("");

        console.log("DRILLTHROUGH STATEMENT:", statement);

        return statement === "DRILLTHROUGH SELECT " ? "" : statement;

    } catch (e) {

        console.error("Unable to get DrillThrough statement from", basicMDX);
        return "";

    }

};

/**
 * @param {string} basicMDX
 * @param {string[]} filters
 */
MDXParser.prototype.customDrillThrough = function (basicMDX, filters) {

    var cubeAndFilters = basicMDX.split(/(FROM\s*\[[^\]]*].*)/i)[1],
        query = "DRILLTHROUGH SELECT " + cubeAndFilters;

    if (!(filters instanceof Array)) filters = [filters];

    for (var i in filters) {
        query += " %FILTER " + filters[i];
    }

    console.log("CUSTOM DRILLTHROUGH STATEMENT: " + query);

    return query;

};