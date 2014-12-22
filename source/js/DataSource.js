/**
 * Data source.
 *
 * Must implement methods.
 *
 * @param {Object} config
 * @param {Object} globalConfig
 * @constructor
 */
var DataSource = function (config, globalConfig) {

    this.SOURCE_URL = config.MDX2JSONSource ||
        location.host + ":" + location.port + "/" + (location.pathname.split("/") || [])[1];
    this.NAMESPACE = config["namespace"];
    this.USERNAME = config["username"];
    this.PASSWORD = config["password"];
    this.BASIC_MDX = config.basicMDX;

    this.GLOBAL_CONFIG = globalConfig;

    /**
     * Name of data source pivot.
     *
     * @type {string}
     */
    this.DATA_SOURCE_PIVOT = config["pivot"] || "";

    this.ACTION = config.action || "MDX";

    this.FILTERS = [];

    this.BASIC_FILTERS = [];

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
            callback({
                error: xhr.responseText || "Error while trying to retrieve data from server."
            });
        }
    };
    if (this.USERNAME && this.PASSWORD) {
        xhr.setRequestHeader("Authorization", "Basic " + btoa(this.USERNAME + ":" + this.PASSWORD));
    }
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

DataSource.prototype.clearFilters = function () {

    this.FILTERS = [];

};

/**
 * @param {function} callback
 */
DataSource.prototype.getCurrentData = function (callback) {

    var _ = this,
        __ = this._convert,
        mdx = this.BASIC_MDX,
        mdxParser = new MDXParser(),
        ready = {
            state: 0,
            data: {},
            pivotData: {}
        };

    var setupPivotOptions = function () {

        var data = ready.pivotData;

        _.GLOBAL_CONFIG["pivotProperties"] = ready.pivotData;

        if (data["rowAxisOptions"]) {
            if (data["rowAxisOptions"]["drilldownSpec"]) {
                _.GLOBAL_CONFIG["DrillDownExpression"] =
                    _.GLOBAL_CONFIG["DrillDownExpression"]
                    || data["rowAxisOptions"]["drilldownSpec"].split("^");
            }
            if (data["rowAxisOptions"]["levelFormat"]
                || data["columnAxisOptions"]
                && data["columnAxisOptions"]["levelFormat"]) {
                _.GLOBAL_CONFIG["formatNumbers"] =
                    _.GLOBAL_CONFIG["formatNumbers"]
                    || data["columnAxisOptions"]["levelFormat"]
                    || data["rowAxisOptions"]["levelFormat"];
            }
        }

        if (data["filters"] && data["filters"].length > 0) {
            for (var i in data["filters"]) {
                if (data["filters"][i]["spec"]) {
                    _.BASIC_FILTERS.push(data["filters"][i]["spec"]);
                }
            }
        }

        // temporary hard workaround (getting last column specs)
        _.GLOBAL_CONFIG["_temp_lastColSpec"] = (function (lev) {
            var tc = lev,
                f = function (lev) {
                    if (lev["childLevels"] && lev["childLevels"].length > 0) {
                        for (var i in lev["childLevels"]) {
                            f(lev["childLevels"][i]);
                        }
                    } else {
                        tc = lev;
                    }
                };
            if (lev) f(lev);
            return tc;
        })(data["columnLevels"][data["columnLevels"].length - 1]);
        // end

    };

    var handleDataReady = function () {

        var data = ready.data;

        console.log("Retrieved data:", ready);

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

    };

    var requestData = function () {

        var filters = _.BASIC_FILTERS.concat(_.FILTERS);

        for (var i in filters) {
            mdx = mdxParser.applyFilter(mdx, filters[i]);
        }

        console.log("Requesting MDX: " + mdx);

        _._post(_.SOURCE_URL + "/" + _.ACTION + (_.NAMESPACE ? "?Namespace=" + _.NAMESPACE : ""), {
            MDX: mdx
        }, function (data) {
            ready.data = data;
            ready.state++;
            handleDataReady();
        });
    };

    if (this.DATA_SOURCE_PIVOT) {
        this._post(this.SOURCE_URL + "/DataSource"
                       + (_.NAMESPACE ? "?Namespace=" + _.NAMESPACE : ""), {
            DataSource: this.DATA_SOURCE_PIVOT
        }, function (data) {
            ready.pivotData = data;
            ready.state++;
            setupPivotOptions();
            requestData();
        });
    } else {
        requestData();
    }

};