/**
 * Data source.
 * 
 * Must implement methods.
 * 
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
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback(JSON.parse(xhr.responseText));
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
            callback({ error: xhr.responseText
                || "Error while trying to retrieve data from server." });
        }
    };
    xhr.send(JSON.stringify(data));
    
};

/**
 * Converts data from MDX2JSON source to LightPivot representation.
 *
 * @param {object} data
 * @private
 */
DataSource.prototype._convert = function (data) {

    if (typeof data !== "object" || data.error) return { error: data.error || true };

    try {
        return {
            dimensions: [
                (data["Cols"][0]["tuples"][0]["children"] || [])[0],
                (data["Cols"][1]["tuples"][0]["children"] || [])[0]
            ],
            dataArray: data["Data"],
            info: data["Info"]
        }
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
    }, function (data) { console.log(data); callback(_._convert(data)); });

};