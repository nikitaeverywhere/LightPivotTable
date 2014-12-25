/**
 * @param {LightPivotTable} controller
 * @param {function} dataChangeTrigger
 * @constructor
 */
var DataController = function (controller, dataChangeTrigger) {

    if (dataChangeTrigger && typeof dataChangeTrigger !== "function") {
        throw new Error("dataChangeTrigger parameter must be a function");
    }

    this._dataStack = [];

    this.controller = controller;

    this.pushData();
    this.dataChangeTrigger = dataChangeTrigger;

    this.SUMMARY_SHOWN = false;

};

/**
 * Performs check if data is valid.
 *
 * @param {{ dimensions: Object[], dataArray: Array, info: Object }} data
 * @returns boolean
 */
DataController.prototype.isValidData = function (data) {

    return data.dimensions instanceof Array
        && data.dimensions[0] instanceof Array
        && data.dimensions[0].length > 0
        //&& data.dimensions[1].length > 0
        && data.dimensions[0][0].hasOwnProperty("caption")
        //&& data.dimensions[1][0].hasOwnProperty("caption")
        && data.dataArray instanceof Array
        && typeof data["info"] === "object"
        && data["info"]["cubeName"];

};

DataController.prototype.pushData = function () {

    var d;

    this._dataStack.push(d = {
        data: null,
        SUMMARY_SHOWN: this.SUMMARY_SHOWN,
        SORT_STATE: {
            column: null,
            order: -1
        }
    });

    //this.data = d.data;
    this.SORT_STATE = d.SORT_STATE;

};

DataController.prototype.popData = function () {

    if (this._dataStack.length < 2) return;

    var d = this._dataStack[this._dataStack.length - 2];

    this._dataStack.pop();

    //this.data = d.data;
    this.SUMMARY_SHOWN = d.SUMMARY_SHOWN;
    this.SORT_STATE = d.SORT_STATE;

};

DataController.prototype.getData = function () {

    return this._dataStack[this._dataStack.length - 1].data;

};

DataController.prototype.setData = function (data) {

    if (!this.isValidData(data)) {
        console.error("Invalid data to set.", data);
        return;
    }

    this._dataStack[this._dataStack.length - 1].data = data;
    //this.data = data;
    this.resetRawData();

    this._trigger();
    return data;

};

/**
 * Renders table data (pseudo-table object) from data retrieved from MDX2JSON source.
 *
 * @returns {Object}
 */
DataController.prototype.resetRawData = function () {

    var data, summary, y, x,
        _ = this;

    if (!(data = this._dataStack[this._dataStack.length - 1].data)) {
        console.error("Unable to create raw data for given data set.");
        return null;
    }

    var rd0 = [], rd1 = [], groupNum = 2, rawData = [];

    var transpose = function (a) {
        return Object.keys(a[0]).map(function (c) {
            return a.map(function (r) {
                return r[c];
            });
        });
    };

    var dim0raw = function (a, c, arr) {

        dim1raw(rd0, c, arr, true);

        // @hotfix https://github.com/intersystems-ru/Cache-MDX2JSON/issues/29
        var i, maxLen = 0;
        for (i in rd0) { if (rd0[i].length > maxLen) maxLen = rd0[i].length; }
        for (i in rd0) { for (var u = rd0[i].length; u < maxLen; u++) {
            rd0[i].push(rd0[i][rd0[i].length - 1]);
        }}

        rd0 = transpose(rd0);

    };

    var applyHeaderStyle = function (cellObject, isHorizontal) {
        if (!_.controller.CONFIG["pivotProperties"]) return;
        if (_.controller.CONFIG["pivotProperties"]["columnHeaderStyle"] && isHorizontal) {
            cellObject.style = _.controller.CONFIG["pivotProperties"]["columnHeaderStyle"];
        } else if (_.controller.CONFIG["pivotProperties"]["rowHeaderStyle"] && !isHorizontal) {
            cellObject.style = _.controller.CONFIG["pivotProperties"]["rowHeaderStyle"];
        }
    };

    var dim1raw = function (a, c, arr, hor) {

        if (!arr) {
            arr = [];
        }

        var cnum, obj;

        for (var i in c) {
            cnum = groupNum;
            if (c[i].children) {
                groupNum++;
                obj = {
                    group: cnum,
                    source: c[i],
                    isCaption: true,
                    value: c[i].caption || ""
                };
                applyHeaderStyle(obj, hor);
                dim1raw(a, c[i].children, arr.concat(obj), hor);
            } else {
                obj = {
                    group: groupNum,
                    source: c[i],
                    isCaption: true,
                    value: c[i].caption || ""
                };
                applyHeaderStyle(obj, hor);
                a.push(arr.concat(obj));
                groupNum++;
            }
        }

    };

    var parseColumnFormatting = function (rawData) {
        if (!_.controller.CONFIG["pivotProperties"]) return rawData;
        var x, y, i, xEnd = rawData[0].length,
            colLevels = _.controller.getPivotProperty(["columnLevels"]),
            formatColumn = {
                // "<spec>": { style: "<style>" }
            };
        var fillLevels = function (obj) {
            if (typeof obj === "undefined") return;
            for (var i in obj["childLevels"]) {
                if (obj["childLevels"][i]["spec"] && obj["childLevels"][i]["levelStyle"]) {
                    formatColumn[obj["childLevels"][i]["spec"]] =
                        { style: obj["childLevels"][i]["levelStyle"] };
                }
                fillLevels(obj["childLevels"][i]);
            }
        };
        for (i in colLevels) {
            fillLevels(colLevels[i]);
        }
        for (y = 0; y < rawData.length; y++) {
            for (x = 0; x < xEnd; x++) {
                if (!rawData[y][x].isCaption) {
                    xEnd = x; break;
                }
                if (rawData[y][x].source && rawData[y][x].source["path"]) {
                    for (i in formatColumn) {
                        if (rawData[y][x].source["path"].indexOf(i) >= 0) {
                            for (var yy = y + 1; yy < rawData.length; yy++) {
                                if (!rawData[yy][x].isCaption) {
                                    rawData[yy][x].style = (rawData[yy][x].style || "")
                                        + formatColumn[i].style || "";
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }
        return rawData;
    };

    if (data.dimensions[0].length) dim0raw(rd0, data.dimensions[0]);
    if (data.dimensions[1].length) dim1raw(rd1, data.dimensions[1]);

    var xw = (rd0[0] || []).length,
        yh = rd1.length || data.info.rowCount || 0,
        xh = rd0.length || data.info.colCount || 0,
        yw = (rd1[0] || []).length;

    // render columns, rows and data
    for (y = 0; y < xh + yh; y++) {
        if (!rawData[y]) rawData[y] = [];
        for (x = 0; x < yw + xw; x++) {
            if (x < yw) {
                if (y < xh) {
                    rawData[y][x] = {
                        group: 1,
                        isCaption: true,
                        value: this.controller.CONFIG["caption"]
                               || (data["info"] || {})["cubeName"]
                               || ""
                    };
                } else {
                    rawData[y][x] = rd1[y-xh][x];
                }
            } else {
                if (y < xh) {
                    rawData[y][x] = rd0[y][x-yw];
                } else {
                    rawData[y][x] = {
                        value: data.dataArray[(xw)*(y - xh) + x - yw] || ""
                    };
                }
            }
        }
    }

    data.info.topHeaderRowsNumber = xh;
    data.info.leftHeaderColumnsNumber = yw;
    this.SUMMARY_SHOWN = false;
    this._dataStack[this._dataStack.length - 1].SUMMARY_SHOWN = false;

    var countSummaryByColumn = function (array, iStart, iEnd, column) {
        var sum = 0;
        for (var i = iStart; i < iEnd; i++) {
            if (!isFinite(array[i][column]["value"])) {
                sum = 0;
                break;
            }
            sum += parseFloat(array[i][column]["value"]) || 0;
        }
        return sum || "";
    };

    var countAverageByColumn = function (array, iStart, iEnd, column) {
        var sum = 0;
        for (var i = iStart; i < iEnd; i++) {
            if (!isFinite(array[i][column]["value"])) {
                sum = 0;
                break;
            }
            sum += parseFloat(array[i][column]["value"]) || 0;
        }
        return sum/(iEnd - iStart) || "";
    };

    if (this.controller.CONFIG["showSummary"] && rawData.length - xh > 1 // xh - see above
        && (rawData[rawData.length - 1][0] || {})["isCaption"]) {
        this.SUMMARY_SHOWN = true;
        this._dataStack[this._dataStack.length - 1].SUMMARY_SHOWN = true;
        rawData.push(summary = []);
        x = rawData.length - 2;
        for (var i in rawData[x]) {
            if (rawData[x][i].isCaption) {
                summary[i] = {
                    group: groupNum,
                    isCaption: true,
                    source: {},
                    value: navigator.language === "ru" ? "Всего" : "Total"
                }
            } else {
                summary[i] = {
                    // very hard workaround (applying "avg" last column spec)
                    value: ((rawData[x].length - 1 === parseInt(i)
                            && _.controller.CONFIG["_temp_lastColSpec"]
                            && _.controller.CONFIG["_temp_lastColSpec"]["levelSummary"] === "avg")
                                ? countAverageByColumn
                                : countSummaryByColumn)(rawData, xh, rawData.length - 1, i),
                    // end
                    //value: (countSummaryByColumn)(rawData, xh, rawData.length - 1, i),
                    style: "font-weight: 900;"
                }
            }
        }
        groupNum++;
    }

    rawData = parseColumnFormatting(rawData);

    data.rawData = data._rawDataOrigin = rawData;

    return data.rawData;

};

/**
 * Trigger the dataChangeTrigger.
 *
 * @private
 */
DataController.prototype._trigger = function () {

    if (this.dataChangeTrigger) this.dataChangeTrigger();

};

/**
 * Sort raw data by column.
 *
 * @param columnIndex
 */
DataController.prototype.sortByColumn = function (columnIndex) {

    var data = this._dataStack[this._dataStack.length - 1].data;

    if (this.SORT_STATE.column !== columnIndex) {
        order = this.SORT_STATE.order = 0;
    }

    var newRawData = data._rawDataOrigin.slice(
            data.info.topHeaderRowsNumber,
            data._rawDataOrigin.length - (this.SUMMARY_SHOWN ? 1 : 0)
        ),
        xIndex = data.info.leftHeaderColumnsNumber + columnIndex,
        order = this.SORT_STATE.order === -1 ? 1 : this.SORT_STATE.order === 1 ? 0 : -1;

    this.SORT_STATE.order = order;
    this.SORT_STATE.column = columnIndex;

    if (order === 0) {
        data.rawData = data._rawDataOrigin;
        this._trigger();
        return;
    }

    order = -order;

    newRawData.sort(function (a, b) {
        if (b[xIndex].value > a[xIndex].value) return order;
        if (b[xIndex].value < a[xIndex].value) return -order;
        return 0;
    });

    data.rawData = data._rawDataOrigin.slice(0, data.info.topHeaderRowsNumber)
        .concat(newRawData)
        .concat(this.SUMMARY_SHOWN ? [data._rawDataOrigin[data._rawDataOrigin.length - 1]] : []);

    this._trigger();

};