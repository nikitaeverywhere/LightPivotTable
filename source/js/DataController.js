var DataController = function (dataSource, dataChangeTrigger) {

    if (dataChangeTrigger && typeof dataChangeTrigger !== "function") {
        throw new Error("dataChangeTrigger parameter must be a function");
    }

    this.data = null;
    this.SORT_STATE = {
        column: null,
        order: -1
    };
    this.dataChangeTrigger = dataChangeTrigger;

};

DataController.prototype.getData = function () {

    return this.data;

};

DataController.prototype.setData = function (data) {

    this.data = data;
    this.resetRawData();

    this._trigger();
    return this.data;

};

DataController.prototype.resetRawData = function () {

    if (!this.data) {
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

    dim0raw(rd0, this.data.dimensions[0]);
    dim1raw(rd1, this.data.dimensions[1]);

    var xw = rd0[0].length,
        yh = rd1.length,
        xh = rd0.length,
        yw = rd1[0].length;

    for (var y = 0; y < xh + yh; y++) {
        if (!rawData[y]) rawData[y] = [];
        for (var x = 0; x < yw + xw; x++) {
            if (x < yw) {
                if (y < xh) {
                    rawData[y][x] = {
                        group: 1,
                        isCaption: true,
                        value: (this.data["info"] || {})["cubeName"] || ""
                    };
                } else {
                    rawData[y][x] = rd1[y-xh][x];
                }
            } else {
                if (y < xh) {
                    rawData[y][x] = rd0[y][x-yw];
                } else {
                    rawData[y][x] = {
                        value: this.data.dataArray[(xw)*(y - xh) + x - yw] || ""
                    };
                }
            }
        }
    }

    this.data.info.topHeaderRowsNumber = xh;
    this.data.info.leftHeaderColumnsNumber = yw;
    this.data.rawData = this.data._rawDataOrigin = rawData;

    return this.data.rawData;

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

    if (this.SORT_STATE.column !== columnIndex) {
        order = this.SORT_STATE.order = 0;
    }

    var newRawData = this.data._rawDataOrigin.slice(this.data.info.topHeaderRowsNumber),
        xIndex = this.data.info.leftHeaderColumnsNumber + columnIndex,
        order = this.SORT_STATE.order === -1 ? 1 : this.SORT_STATE.order === 1 ? 0 : -1;

    this.SORT_STATE.order = order;
    this.SORT_STATE.column = columnIndex;

    if (order === 0) {
        this.data.rawData = this.data._rawDataOrigin;
        this._trigger();
        return;
    }

    order = -order;

    newRawData.sort(function (a, b) {
        return order*b[xIndex].value - order*a[xIndex].value;
    });

    this.data.rawData = [this.data._rawDataOrigin[0]].concat(newRawData);

    this._trigger();

};