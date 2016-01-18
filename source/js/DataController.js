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

    // add null column to display measures
    if (
        data.dimensions instanceof Array
        && data.dimensions[0] instanceof Array
        && !data.dimensions[0].length
    )
        data.dimensions[0] = [{}];

    return data.dimensions instanceof Array
        && data.dimensions[0] instanceof Array
        //&& data.dimensions[0].length > 0
        //&& data.dimensions[1].length > 0
        //&& data.dimensions[0][0].hasOwnProperty("caption")
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
    this.setLeftHeaderColumnsNumber(data); // required in resetDimensionProps()
    this.pivotDataProcess(data);
    this.resetDimensionProps();
    this.resetConditionalFormatting();
    this.resetRawData();
    this.modifyRawData(data);
    this.postDataProcessing(data);

    if (data.info.mdxType === "drillthrough") {
        this.setDrillThroughHandler(
            this.controller.pivotView.listingClickHandler.bind(this.controller.pivotView)
        );
    }
    //console.log(data);
    this._trigger();
    return data;

};

/**
 * Function that process pivot data.
 * @param [data]
 */
DataController.prototype.pivotDataProcess = function ( data ) {

    var totals = this.controller.getPivotProperty(["columnTotals"]);

    if (typeof totals === "boolean") {
        this.controller.CONFIG["showSummary"] = totals;
    }

};

/**
 * Handle drillThrough on current level.
 * If handler returns boolean false, drillThrough won't be performed.
 *
 * @param {function} handler
 */
DataController.prototype.setDrillThroughHandler = function (handler) {
    this._dataStack[this._dataStack.length - 1].data.info.drillThroughHandler = handler;
};

/**
 * Sets properties of rows/columns.
 */
DataController.prototype.resetDimensionProps = function () {

    var data, columnProps;

    if (!(data = this._dataStack[this._dataStack.length - 1].data)) {
        console.error("Unable to get dimension props for given data set.");
        return;
    }

    columnProps = new Array(data.info.leftHeaderColumnsNumber || 0); // fill left headers as empty
    for (var i = 0; i < columnProps.length; i++) { columnProps[i] = {}; }

    var cloneObj = function (obj) {
        var i, newObj = {};
        for (i in obj) newObj[i] = obj[i];
        return newObj;
    };

    var parse = function (obj, props) {
        var tObj, clonedProps, i;
        if (obj["children"] && obj["children"].length > 0) {
            for (i in obj.children) {
                clonedProps = cloneObj(props);
                tObj = obj.children[i];
                if (tObj["format"]) clonedProps["format"] = tObj["format"];
                if (tObj["style"]) clonedProps["style"] =
                    (clonedProps["style"] || "") + tObj["style"];
                if (tObj["summary"]) clonedProps["summary"] = tObj["summary"];
                // somehow "summary" were changed to "total" - reapplying
                if (tObj["total"]) clonedProps["summary"]
                    = (tObj["total"] || "").toLowerCase().replace(/:.*/, ""); // what is "max:Days"?
                if (tObj["type"]) clonedProps["type"] = tObj["type"];
                parse(tObj, clonedProps);
            }
        } else {
            columnProps.push(cloneObj(props));
        }
    };

    parse({ children: data.dimensions[0] }, {});

    data.columnProps = columnProps;

};

/**
 * Try to recognise type by given value.
 * @param {*} value
 */
DataController.prototype.getTypeByValue = function (value) {

    if (!isNaN(value)) {
        return { type: "number" };
    } else if ((value + "").match(/[0-9]{2}\.[0-9]{2}\.[0-9]{2,4}/)) { // local date (unique case for RU)
        return {
            type: "date",
            comparator: function (value) {
                var arr = value.split(".");
                return new Date(arr[2], arr[1], arr[0]); // day
            }
        };
    } else if (Date.parse(value)) { // standard date recognized by JS
        return {
            type: "date",
            comparator: function (value) {
                return new Date(value);
            }
        }
    } else {
        return { type: "string" };
    }

};

DataController.prototype.postDataProcessing = function (data) {

    var cell, col;

    if (!data || !data.rawData || !data.rawData[data.info.topHeaderRowsNumber]) return;
    if (!data.columnProps) data.columnProps = [];

    // Inserts pseudo-type to cell. If data.columnProps[col]["$FORMAT"].comparator is a function, then this function
    // will be used to sort value of columns. @see DataController.sortByColumn.
    for (col = data.info.leftHeaderColumnsNumber; cell = data.rawData[data.info.topHeaderRowsNumber][col]; col++) {
        if (!data.columnProps[col]) data.columnProps[col] = {};
        data.columnProps[col]["$FORMAT"] = this.getTypeByValue(cell.value);
    }

};

DataController.prototype.resetConditionalFormatting = function () {

    var data, cs, c1, c2, arr, min, max,
        cfArr = {/* "[y],[x]|<null>": Array[{style:"", operator: "", ...}] */},
        ocfArr;

    if (!(data = this._dataStack[this._dataStack.length - 1].data)) {
        console.error("Unable to get conditional formatting for given data set.");
        return;
    }
    if (!(this.controller.CONFIG.pivotProperties)) {
        data.conditionalFormatting = cfArr;
        return;
    }

    if (cs = this.controller.CONFIG.pivotProperties["colorScale"]) {
        if (cs.indexOf("custom:") > -1) {
            arr = cs.split(":")[1].split(",");
            c2 = { r: parseInt(arr[0]), g: parseInt(arr[1]), b: parseInt(arr[2]) };
            arr = cs.split(":")[2].split(",");
            c1 = { r: parseInt(arr[0]), g: parseInt(arr[1]), b: parseInt(arr[2]) };
        } else {
            arr = cs.split("-to-");
            c1 = this.controller.pivotView.colorNameToRGB(arr[0]);
            c2 = this.controller.pivotView.colorNameToRGB(arr[1]);
        }
        cfArr["colorScale"] = {
            from: c2,
            to: c1,
            min: min = Math.min.apply(Math, (data.dataArray || [])),
            max: max = Math.max.apply(Math, (data.dataArray || [])),
            diff: max - min,
            invert: (c2.r + c2.b + c2.g) / 3 < 128
        };
    }

    ocfArr = this.controller.CONFIG.pivotProperties["formatRules"] || [];
    if (ocfArr.length && typeof this.controller.CONFIG.conditionalFormattingOn === "undefined") {
        this.controller.CONFIG.conditionalFormattingOn = true;
    }
    for (var i in ocfArr) {
        // Warn: range ",2-3" is valid for standard pivot as ",2".
        // LPT will parse ",2-3" range as invalid.
        if (!cfArr[ocfArr[i]["range"]]) cfArr[ocfArr[i]["range"]] = [];
        cfArr[ocfArr[i]["range"]].push(ocfArr[i]);
    }
    data.conditionalFormatting = cfArr;

};

/**
 * Total functions definition. When adding new total function, also check getTotalFunction.
 * "this" in context of functions equals to TOTAL_FUNCTIONS object.
 *
 * @see getTotalFunction
 */
DataController.prototype.TOTAL_FUNCTIONS = {

    isNumber: function (a) {
        if (a == "") return false;
        return isFinite(a);
    },
    
    totalSUM: function (array, iStart, iEnd, column) {
        var sum = 0;
        for (var i = iStart; i < iEnd; i++) {
            if (this.isNumber(array[i][column]["value"])) {
                sum += parseFloat(array[i][column]["value"]) || 0;
            }
        }
        return sum;
    },

    totalAVG: function (array, iStart, iEnd, column) {
        var sum = 0;
        for (var i = iStart; i < iEnd; i++) {
            if (!this.isNumber(array[i][column]["value"])) {
                sum = 0;
                break;
            }
            sum += parseFloat(array[i][column]["value"]) || 0;
        }
        return sum/(iEnd - iStart) || "";
    },

    totalCOUNT: function (array, iStart, iEnd) {
        return iEnd - iStart;
    },
    
    totalMIN: function (array, iStart, iEnd, column) {
        var min = Infinity;
        for (var i = iStart; i < iEnd; i++) {
            if (this.isNumber(array[i][column]["value"]) && array[i][column]["value"] < min) {
                min = array[i][column]["value"];
            }
        }
        return min;
    },

    totalMAX: function (array, iStart, iEnd, column) {
        var max = -Infinity;
        for (var i = iStart; i < iEnd; i++) {
            if (this.isNumber(array[i][column]["value"]) && array[i][column]["value"] > max) {
                max = array[i][column]["value"];
            }
        }
        return max;
    },
    
    totalPERCENTAGE: function (array, iStart, iEnd, column, xStart) {
        var averages = [], x, summ;
        for (x = xStart; x < array[0].length; x++) {
            averages.push(this.totalSUM(array, iStart, iEnd, x));
        }
        summ = averages.reduce(function(a, b) { return a + b; });
        return (averages[column - xStart] / summ * 100 || 0).toFixed(2) + "%";
    },
    
    totalNONE: function () {
        return "";
    }
    
};

DataController.prototype.setLeftHeaderColumnsNumber = function (data) {

    function getLev (o, lev) {
        if (!(o.children instanceof Array)) return lev;
        var nextLev = lev + 1;
        for (var i = 0; i < o.children.length; i++) {
            lev = Math.max(getLev(o.children[i], nextLev), lev);
        }
        return lev;
    }

    data.info.leftHeaderColumnsNumber = getLev({ children: data.dimensions[1] || [] }, 0);

};

/**
 * Renders table data (pseudo-table object) from data retrieved from MDX2JSON source.
 *
 * @returns {Object}
 */
DataController.prototype.resetRawData = function () {

    var data, summary, y, x,
        dimCaption,
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

    var getMaxLevel = function (c) {
        var lev = 0;
        for (var i in c) {
            if (c[i].children && c[i].children.length) {
                lev = Math.max(lev, getMaxLevel(c[i].children));
            }
        }
        return lev + 1;
    };

    var dim1raw = function (a, c, arr, hor, level, maxLevel) {

        var cnum, obj, sameGroup;

        if (!arr) {
            arr = [];
        }

        for (var i in c) {
            cnum = groupNum;
            if (level < maxLevel && !(c[i].children && c[i].children.length)) { // maxLevel is not reached, but no child
                c[i].children = [{}];
                sameGroup = true; // let the child cells join parent cell
            }
            if (c[i].children && c[i].children.length) {
                if (!sameGroup) groupNum++; else sameGroup = false;
                obj = {
                    group: cnum,
                    source: c[i],
                    isCaption: true,
                    value: c[i].caption || ""
                };
                applyHeaderStyle(obj, hor);
                dim1raw(a, c[i].children, arr.concat(obj), hor, level?++level:level, maxLevel);
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
            rowLevels = _.controller.getPivotProperty(["rowLevels"]),
            formatColumn = {
                // "<spec>": { style: "<style>" }
            };
        var fillLevels = function (obj) {
            if (typeof obj === "undefined") return;
            for (var i in obj["childLevels"]) {
                if (obj["childLevels"][i] && obj["childLevels"][i]["spec"]) {
                    formatColumn[(obj["childLevels"][i]["spec"] || "").replace(/[^.]*$/, "")] = {
                        style: obj["childLevels"][i]["levelStyle"] || "",
                        headStyle: obj["childLevels"][i]["levelHeaderStyle"] || ""
                    };
                }
                fillLevels(obj["childLevels"][i]);
            }
        };
        for (i in colLevels) {
            fillLevels({ childLevels: [colLevels[i]] });
            fillLevels({ childLevels: [rowLevels[i]] });
        }
        for (y = 0; y < rawData.length; y++) {
            for (x = 0; x < xEnd; x++) {
                if (!rawData[y][x].isCaption) {
                    xEnd = x; break;
                }
                if (rawData[y][x].source && rawData[y][x].source["path"]) {
                    for (i in formatColumn) {
                        if (rawData[y][x].source["path"].indexOf(i) >= 0) {
                            var yy;
                            for (yy = y; yy < rawData.length; yy++) {
                                if (!rawData[yy][x].isCaption) {
                                    if (formatColumn[i].style) rawData[yy][x].style = (rawData[yy][x].style || "")
                                        + formatColumn[i].style || "";
                                } else {
                                    if (formatColumn[i].headStyle) rawData[yy][x].style = (rawData[yy][x].style || "")
                                        + formatColumn[i].headStyle || "";
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

    if (data.dimensions[0].length) {
        dim0raw(rd0, data.dimensions[0]);
    }
    if (data.dimensions[1].length) {
        dim1raw(rd1, data.dimensions[1], undefined, undefined, 1, getMaxLevel(data.dimensions[1]));
    }
    if (rd1[0]) dimCaption = (rd1[0][rd1[0].length - 1] || { source: {} }).source["dimension"];

    var xw = (rd0[0] || []).length,
        yh = rd1.length || data.info.rowCount || 0,
        xh = rd0.length || data.info.colCount || 0,
        yw = (rd1[0] || []).length,
        attachTotals = !!this.controller.CONFIG["attachTotals"];

    // render columns, rows and data
    for (y = 0; y < xh + yh; y++) {
        if (!rawData[y]) rawData[y] = [];
        for (x = 0; x < yw + xw; x++) {
            if (x < yw) {
                if (y < xh) {
                    rawData[y][x] = {
                        group: 1,
                        isCaption: true,
                        value: this.controller.getPivotProperty(["showRowCaption"]) === false ? "" :
                            this.controller.CONFIG["caption"]
                            || dimCaption
                            || (data["info"] || {})["cubeName"]
                            || ""
                    };
                    applyHeaderStyle(rawData[y][x], false);
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
    data.info.SUMMARY_SHOWN = false;
    data.info.leftHeaderColumnsNumber = yw;
    this.SUMMARY_SHOWN = false;
    this._dataStack[this._dataStack.length - 1].SUMMARY_SHOWN = false;

    /**
     * @param {number} columnIndex
     * @returns {Function}
     */
    var getTotalFunction = function (columnIndex) {
        var pivotDefault = _.controller.getPivotProperty(["rowTotalAgg"]);
        if (!data["columnProps"][columnIndex] && !pivotDefault)
            return _.TOTAL_FUNCTIONS.totalSUM;
        switch ((data["columnProps"][columnIndex] || {}).summary || pivotDefault) {
            case "count": return _.TOTAL_FUNCTIONS.totalCOUNT;
            case "avg": return _.TOTAL_FUNCTIONS.totalAVG;
            case "min": return _.TOTAL_FUNCTIONS.totalMIN;
            case "max": return _.TOTAL_FUNCTIONS.totalMAX;
            case "pct": return _.TOTAL_FUNCTIONS.totalPERCENTAGE;
            case "none": return _.TOTAL_FUNCTIONS.totalNONE;
            default: return _.TOTAL_FUNCTIONS.totalSUM;
        }
    };

    if (this.controller.CONFIG["showSummary"] && rawData.length - xh > 1 // xh - see above
        && (rawData[rawData.length - 1][0] || {})["isCaption"]) {
        data.info.SUMMARY_SHOWN = true;
        this.SUMMARY_SHOWN = true;
        this._dataStack[this._dataStack.length - 1].SUMMARY_SHOWN = true;
        summary = [];
        x = rawData.length - 2;
        for (var i in rawData[x]) {
            if (rawData[x][i].isCaption) {
                summary[i] = {
                    group: groupNum,
                    isCaption: true,
                    source: {},
                    noDrillDown: true,
                    value: pivotLocale.get(0)
                };
                applyHeaderStyle(summary[i], false);
            } else {
                summary[i] = {
                    value: getTotalFunction(parseInt(i)).call(
                        this.TOTAL_FUNCTIONS,
                        rawData, xh, rawData.length, i, data.info.leftHeaderColumnsNumber
                    ),
                    style: "font-weight: bold;text-align: right;"
                }
            }
        }
        groupNum++;
        if (attachTotals) {
            rawData.splice(data.info.topHeaderRowsNumber, 0, summary);
            data.info.topHeaderRowsNumber++;
        } else {
            rawData.push(summary);
        }
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

    var data = this._dataStack[this._dataStack.length - 1].data,
        totalsAttached = this.SUMMARY_SHOWN && this.controller.CONFIG["attachTotals"] ? 1 : 0,
        comparator;

    if (this.SORT_STATE.column !== columnIndex) {
        order = this.SORT_STATE.order = 0;
    }

    var newRawData = data._rawDataOrigin.slice(
            data.info.topHeaderRowsNumber,
            data._rawDataOrigin.length - (this.SUMMARY_SHOWN && !totalsAttached ? 1 : 0)
        ),
        xIndex = data.info.leftHeaderColumnsNumber + columnIndex,
        order = this.SORT_STATE.order === -1 ? 1 : this.SORT_STATE.order === 1 ? 0 : -1;

    this.SORT_STATE.order = order;
    this.SORT_STATE.column = columnIndex;

    for (var i in data.rawData[data.info.topHeaderRowsNumber - totalsAttached - 1]) {
        if (data.rawData[data.info.topHeaderRowsNumber - totalsAttached - 1][i].className) {
            delete data.rawData[data.info.topHeaderRowsNumber - totalsAttached - 1][i].className;
        }
    }

    if (order === 0) {
        data.rawData = data._rawDataOrigin;
        this.modifyRawData(data);
        this._trigger();
        return;
    }

    order = -order;

    if (typeof (comparator = ((data.columnProps[columnIndex] || {})["$FORMAT"] || {}).comparator) === "function") {
        newRawData.sort(function (a, b) { // sort using comparator function
            if (comparator(b[xIndex].value) > comparator(a[xIndex].value)) return order;
            if (comparator(b[xIndex].value) < comparator(a[xIndex].value)) return -order;
            return 0;
        });
    } else { // simple sort
        newRawData.sort(function (a, b) {
            if (b[xIndex].value > a[xIndex].value) return order;
            if (b[xIndex].value < a[xIndex].value) return -order;
            return 0;
        });
    }

    data.rawData = data._rawDataOrigin.slice(0, data.info.topHeaderRowsNumber)
        .concat(newRawData)
        .concat(this.SUMMARY_SHOWN && !totalsAttached
            ? [data._rawDataOrigin[data._rawDataOrigin.length - 1]]
            : []
        );
    data.rawData[data.info.topHeaderRowsNumber - totalsAttached - 1]
        [data.info.leftHeaderColumnsNumber + columnIndex]
        .className = order === 0 ? "" : order === 1 ? "lpt-sortDesc" : "lpt-sortAsc";

    this.modifyRawData(data);

    this._trigger();

};

/**
 * Filter raw data by part of value.
 *
 * @param {string} valuePart
 * @param {number} columnIndex
 */
DataController.prototype.filterByValue = function (valuePart, columnIndex) {

    var data = this._dataStack[this._dataStack.length - 1].data,
        totalsAttached = this.SUMMARY_SHOWN && this.controller.CONFIG["attachTotals"] ? 1 : 0,
        newRawData = data._rawDataOrigin.slice(
            data.info.topHeaderRowsNumber,
            data._rawDataOrigin.length - (this.SUMMARY_SHOWN && !totalsAttached ? 1 : 0)
        ),
        re = null;

    try {
        re = new RegExp(valuePart, "i");
    } catch (e) {
        try {
            re = new RegExp(valuePart.replace(/([()[{*+.$^\\|?])/g, "\\$1"), "i");
        } catch (e) {
            return;
        }
    }

    newRawData = newRawData.filter(function (row) {
        return (row[columnIndex].value || "").toString().match(re);
    });

    data.rawData = data._rawDataOrigin.slice(0, data.info.topHeaderRowsNumber)
        .concat(newRawData)
        .concat(this.SUMMARY_SHOWN && !totalsAttached
            ? [data._rawDataOrigin[data._rawDataOrigin.length - 1]]
            : []
    );

    this.modifyRawData(data);

    this._trigger();

};

/**
 * Modifies data if such settings are present.
 */
DataController.prototype.modifyRawData = function (data) {

    // modify data.rawData and original properties (such as width and height) if needed.

    var i = -1;

    if (this.controller.CONFIG.showRowNumbers && !data.info.leftHeaderColumnsNumber) { // listing
        if (data.rawData[0] && data.rawData[0][0].special) { // just update indexes
            data.rawData.forEach(function (row) {
                row[0].value = ++i === 0 ? "#" : i;
                row[0].isCaption = i === 0;
            });
        } else { // re-create indexes
            data.rawData.forEach(function (row) {
                row.unshift({
                    value: ++i === 0 ? "#" : i,
                    isCaption: i === 0,
                    special: true,
                    noClick: true
                });
            });
            if (data.columnProps instanceof Array) {
                data.columnProps.unshift({});
            }
            data.info.colCount++;
        }
    }

};