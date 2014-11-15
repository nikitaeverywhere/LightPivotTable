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
                    return JSON.parse(xhr.responseText)
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
 * @param {function} callback
 */
DataSource.prototype.getCurrentData = function (callback) {

    var _ = this;

    this._post(this.SOURCE_URL + "/MDX", {
        MDX: this.BASIC_MDX
    }, function (data) {
        callback(_._convert(data));
    });

};