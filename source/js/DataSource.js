/**
 * Data source.
 * 
 * Must implement methods.
 *
 * @param {Object} config
 * @constructor
 */
var DataSource = function (config) {

    this.SOURCE_URL = config.MDX2JSONSource ||
        location.host + ":" + location.port + "/" + (location.pathname.split("/") || [])[1];

    this.BASIC_MDX = config.basicMDX;

    this.ACTION = config.action || "MDX";

    this.FILTERS = [];

};

/**
 * @param {string} url
 * @param {object} data
 * @param {function} callback
 * @private
 */
DataSource.prototype._post = function (url, data, callback) {

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback((function () {
                try {
                    return JSON.parse(xhr.responseText) || {}
                } catch (e) {
                    return {
                        error: "<h1>Unable to parse server response</h1><p>" + xhr.responseText
                            + "</p>"
                    };
                }
            })());
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
            callback({ error: xhr.responseText
                || "Error while trying to retrieve data from server." });
        }
    };
    xhr.send(JSON.stringify(data));
    
};

/**
 * Converts data from MDX2JSON source to LightPivotTable representation.
 *
 * @param {object} data
 * @private
 */
DataSource.prototype._convert = function (data) {

    var o;

    if (typeof data !== "object" || data.error) return { error: data.error || true };

    try {
        o = {
            dimensions: [
                data["Cols"][0]["tuples"],
                data["Cols"][1]["tuples"]
            ],
            dataArray: data["Data"],
            info: data["Info"]
        };
        //console.log(o);
        return o;
    } catch (e) {
        console.error("Error while parsing data:", e);
        return { error: data.error || true };
    }

};

/**
 * @param {string} spec - an MDX specification of the filter.
 */
DataSource.prototype.setFilter = function (spec) {

    this.FILTERS.push(spec);

};

/**
 * @param {function} callback
 */
DataSource.prototype.getCurrentData = function (callback) {

    var _ = this,
        __ = this._convert,
        mdx = this.BASIC_MDX,
        mdxParser = new MDXParser();

    for (var i in this.FILTERS) {
        mdx = mdxParser.applyFilter(mdx, this.FILTERS[i]);
    }

    this._post(this.SOURCE_URL + "/" + this.ACTION, {
        MDX: mdx
    }, function (data) {
        (data.Info || {}).action = _.ACTION;
        if (_.ACTION === "MDXDrillthrough") {
            callback((function (data) {

                var arr = data["children"] || [],
                    headers = [],
                    obj, i, u;

                if (!arr.length) return {
                    error: "No DrillThrough data."
                };

                for (i in arr[0]) {
                    headers.push({ caption: i });
                }

                obj = {
                    Cols: [ { tuples: headers }, { tuples: [] } ],
                    Data: [],
                    Info: {
                        colCount: 8,
                        cubeClass: "No cube class",
                        cubeName: "No cube name",
                        leftHeaderColumnsNumber: 0,
                        rowCount: arr.length,
                        topHeaderRowsNumber: headers.length,
                        action: _.ACTION
                    }
                };

                for (i in arr) {
                    for (u in arr[i]) {
                        obj.Data.push(arr[i][u]);
                    }
                }

                return __(obj);

            })(data));
        } else if (_.ACTION = "MDX") {
            callback(_._convert(data));
        } else {
            console.error("Not implemented URL action: " + _.ACTION);
            callback({ error: "Not implemented URL action: " + data || true });
        }
    });

};