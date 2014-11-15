var DataController = function (dataSource, dataChangeTrigger) {

    if (dataChangeTrigger && typeof dataChangeTrigger !== "function") {
        throw new Error("dataChangeTrigger parameter must be a function");
    }

    this._dataStack = [];

    this.pushData();
    this.dataChangeTrigger = dataChangeTrigger;

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
        && data.dimensions[1].length > 0
        && data.dimensions[0][0].hasOwnProperty("caption")
        && data.dimensions[1][0].hasOwnProperty("caption")
        && data.dataArray instanceof Array
        && typeof data["info"] === "object"
        && data["info"]["cubeName"];

};

DataController.prototype.pushData = function () {

    var d;

    this._dataStack.push(d = {
        data: null,
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

DataController.prototype.resetRawData = function () {

    var data;

    if (!(data = this._dataStack[this._dataStack.length - 1].data)) {
        console.error("Unable to create raw data for given data set.");
        return;
    }

    var rd0 = [], rd1 = [], num = 2, rawData = [];

    var transpose = function (a) {
        return Object.keys(a[0]).map(function (c) {
            return a.map(function (r) {
                return r[c];
            });
        });
    };

    var dim0raw = function (a, c, arr) {

        dim1raw(rd0, c, arr);
        rd0 = transpose(rd0);

    };

    var dim1raw = function (a, c, arr) {

        if (!arr) {
            arr = [];
        }

        var cnum;

        for (var i in c) {
            cnum = num;
            if (c[i].children) {
                num++;
                dim1raw(a, c[i].children, arr.concat({
                    group: cnum,
                    source: c[i],
                    isCaption: true,
                    value: c[i].caption || ""
                }));
            } else {
                a.push(arr.concat({
                    group: num,
                    source: c[i],
                    isCaption: true,
                    value: c[i].caption || ""
                }));
                num++;
            }
        }

    };

    dim0raw(rd0, data.dimensions[0]);
    dim1raw(rd1, data.dimensions[1]);

    var xw = rd0[0].length,
        yh = rd1.length,
        xh = rd0.length,
        yw = rd1[0].length;

    // render columns, rows and data
    for (var y = 0; y < xh + yh; y++) {
        if (!rawData[y]) rawData[y] = [];
        for (var x = 0; x < yw + xw; x++) {
            if (x < yw) {
                if (y < xh) {
                    rawData[y][x] = {
                        group: 1,
                        isCaption: true,
                        value: (data["info"] || {})["cubeName"] || ""
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

    var newRawData = data._rawDataOrigin.slice(data.info.topHeaderRowsNumber),
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
        return order*b[xIndex].value - order*a[xIndex].value;
    });

    data.rawData = data._rawDataOrigin.slice(0, data.info.topHeaderRowsNumber)
        .concat(newRawData);

    this._trigger();

};