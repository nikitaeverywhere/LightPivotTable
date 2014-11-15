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

        return "\n\n\n" + parts.join("") + " %FILTER " + filterParts.join("");

    } catch (e) {

        return "";

    }

};
