/**
 * @param {LightPivotTable} controller
 * @param container
 * @constructor
 */
var PivotView = function (controller, container) {

    if (!(container instanceof HTMLElement)) throw new Error("Please, provide HTMLElement " +
        "instance \"container\" into pivot table configuration.");

    this.tablesStack = [];

    this.elements = {
        container: container,
        base: document.createElement("div"),
        tableContainer: undefined,
        controlsContainer: document.createElement("div"),
        messageElement: undefined
    };

    this.controller = controller;

    /**
     * @private
     */
    this._scrollListener = null;

    /**
     * Fixed headers links.
     *
     * @private
     */
    this._headers = {
        "h": { base: undefined, clone: undefined },
        "v": { base: undefined, clone: undefined },
        "c": { base: undefined, clone: undefined }
    };

    this.init();

};

PivotView.prototype.init = function () {

    var _ = this,
        els = this.elements;

    els.base.className = "lpt";
    els.container.appendChild(els.base);

    this.pushTable();

    this.displayMessage("Loading...");

    window.addEventListener("resize", function () {
        _._sizesChanged.call(_);
    });

};

PivotView.prototype._sizesChanged = function () {

    for (var i in this.tablesStack) {
        var t = this.tablesStack[i]._headers;
        if (t.c.clone) {
            for (var u in t) {
                this.fixSizes(t[u].base, t[u].clone);
            }
        }
        t.v.clone.style.width = "";
        t.v.clone.style.zIndex = 1;
    }

};

PivotView.prototype._updateTablesPosition = function (seek) {

    for (var i = 0; i < this.tablesStack.length; i++) {
        this.tablesStack[i].element.style.left =
            (1 + (seek || 0) + i - this.tablesStack.length)*100 + "%";
    }

};

PivotView.prototype.pushTable = function () {

    var _ = this,
        tableElement = document.createElement("div");

    tableElement.className = "tableContainer";
    if (this.tablesStack.length) tableElement.style.left = "100%";

    this.tablesStack.push({
        element: tableElement,
        _headers: {
            "h": { base: undefined, clone: undefined },
            "v": { base: undefined, clone: undefined },
            "c": { base: undefined, clone: undefined }
        }
    });

    this.elements.base.appendChild(tableElement);
    this.elements.tableContainer = tableElement;

    setTimeout(function () {
        _._updateTablesPosition();
    }, 1);

};

PivotView.prototype.popTable = function () {

    if (this.tablesStack.length < 2) return;

    this._updateTablesPosition(1);
    var garbage = this.tablesStack.pop();

    setTimeout(function () {
        garbage.element.parentNode.removeChild(garbage.element);
    }, 500);
    this.elements.tableContainer = this.tablesStack[this.tablesStack.length - 1].element;

};

PivotView.prototype._columnClickHandler = function (columnIndex) {

    this.controller.dataController.sortByColumn(columnIndex);

};

PivotView.prototype._rowClickHandler = function (rowIndex, cellData) {

    this.controller.tryDrillDown(cellData.source.path);

};

PivotView.prototype._backClickHandler = function () {

    this.popTable();
    this.controller.popDataSource();

};

PivotView.prototype.fixSizes = function (baseElement, elementToFix) {

    if (!elementToFix.style) return false;

    for (var i in elementToFix.childNodes) {
        this.fixSizes(baseElement.childNodes[i], elementToFix.childNodes[i]);
    }

    if (baseElement["triggerFunction"]) {
        elementToFix.addEventListener(
            baseElement["triggerFunction"].event,
            baseElement["triggerFunction"].trigger
        );
    }

    var style = window.getComputedStyle(baseElement, null);
    elementToFix.style.width = style.getPropertyValue("width");
    elementToFix.style.height = style.getPropertyValue("height");

};

/**
 * Create clones of headers with fixed sizes.
 *
 * @param {HTMLElement} tableElement
 */
PivotView.prototype.fixHeaders = function (tableElement) {

    var fhx, temp, hHead, fhy, c1, c2, d1, d2,
        cth = this.tablesStack[this.tablesStack.length - 1]._headers;

    var getChildrenByTagName = function (element, tagName) {
        var cls = [];
        for (var c in element.childNodes) {
            if (element.childNodes[c].tagName === tagName.toUpperCase()) {
                cls.push(element.childNodes[c]);
            }
        }
        return cls;
    };

    if (!tableElement.parentNode) console.warn("Missing fix headers: before function call to " +
        "fixHeaders() table element must be attached to DOM.");

    // clone thead
    temp = fhx = getChildrenByTagName(tableElement, "thead")[0];
    if (!fhx) {
        console.error("Unable to fix headers: no \"thead\" in basic table."); return false;
    }
    fhx = fhx.cloneNode(true);
    fhx.className = "fixedHeader";
    fhx.style.zIndex = 2;
    cth.h.base = temp;
    cth.h.clone = fhx;
    this.fixSizes(temp, fhx);
    fhx.style.width = "";

    // clone top left corner
    hHead = temp.childNodes[0].childNodes[0].cloneNode(true);
    cth.c.base = temp.childNodes[0].childNodes[0];
    cth.c.clone = hHead;
    this.fixSizes(temp.childNodes[0].childNodes[0], hHead);
    temp = document.createElement("thead");
    temp.appendChild(document.createElement("tr")).appendChild(hHead);
    temp.className = "fixedHeader";
    temp.style.zIndex = 3;
    hHead = temp;

    // clone body headers
    temp = fhy = getChildrenByTagName(tableElement, "tbody")[0];
    if (!fhy) {
        console.error("Unable to fix headers: no \"tbody\" in basic table."); return false;
    }
    fhy = fhy.cloneNode(false);
    fhy.className = "fixedHeader";
    fhy.style.top = temp.offsetTop - 2 + "px";
    c1 = getChildrenByTagName(temp, "tr");
    for (var i in c1) {
        fhy.appendChild(d1 = c1[i].cloneNode(false));
        c2 = getChildrenByTagName(c1[i], "th");
        for (var u in c2) {
            d1.appendChild(d2 = c2[u].cloneNode(true));
        }
    }
    cth.v.base = temp;
    cth.v.clone = fhy;
    this.fixSizes(temp, fhy);
    fhy.style.width = "";
    fhy.style.zIndex = 1;

    // add scroll listener
    tableElement.parentNode.addEventListener("scroll", this._scrollListener = function () {
        hHead.style.top = fhx.style.top = tableElement.parentNode.scrollTop + "px";
        hHead.style.left = fhy.style.left = tableElement.parentNode.scrollLeft + "px";
    }, false);

    // append new elements
    tableElement.appendChild(fhx);
    tableElement.appendChild(fhy);
    tableElement.appendChild(hHead);

    // call scroll handler because of render may be performed anytime
    this._scrollListener();

};

/**
 * Displays text which hovers table. Pass empty string to hide message.
 *
 * @param {string} html
 */
PivotView.prototype.displayMessage = function (html) {

    if (this.elements.messageElement && this.elements.messageElement.parentNode) {
        this.elements.messageElement.parentNode.removeChild(this.elements.messageElement);
    }

    if (!html) return;

    var d1 = document.createElement("div"),
        d2 = document.createElement("div"),
        d3 = document.createElement("div");

    d1.className = "central";
    d3.innerHTML = html;
    d2.appendChild(d3);
    d1.appendChild(d2);
    this.elements.messageElement = d1;
    this.elements.tableContainer.appendChild(d1);

};

/**
 * Raw data - plain 2-dimensional array of data to render.
 *
 * group - makes able to group cells together. Cells with same group number will be gathered.
 * source - data source object with it's properties.
 * value - value of cell (will be stringified).
 *
 * @param {{ group: number, source: Object, value: *, isCaption: boolean }[][]} data
 */
PivotView.prototype.renderRawData = function (data) {

    if (!data || !data[0] || !data[0][0]) {
        this.elements.tableContainer.innerHTML = "<h1>Unable to render data</h1><p>"
            + JSON.stringify(data) + "</p>";
        return;
    }

    if (this._scrollListener) {
        this.elements.tableContainer.removeEventListener("scroll", this._scrollListener);
        this._scrollListener = null;
    }

    var table = document.createElement("table"),
        thead = document.createElement("thead"),
        tbody = document.createElement("tbody"),
        timeToBreak = false,
        _ = this,
        x, y, tr, td,
        headColsNum = 0, headLeftColsNum = 0,
        headRowsNum = 0, headLeftRowsNum = 0;

    // compute headColsNum & headLeftColsNum
    for (y = 0; y < data.length; y++) {
        for (x = 0; x < data[y].length; x++) {
            if (!data[y][x].isCaption) {
                timeToBreak = true;
                break;
            }
        }
        if (timeToBreak) {
            headLeftColsNum = x;
            break;
        } else headColsNum++;
    }

    // compute headRowsNum & headLeftRowsNum
    for (y = 0; y < data.length; y++) {
        if (!data[y][data[y].length - 1].isCaption) {
            headRowsNum = y;
            headLeftRowsNum = data.length - y;
            break;
        }
    }

    for (y = 0; y < data.length; y++) {
        tr = document.createElement("tr");
        for (x = 0; x < data[y].length; x++) {
            if (data[y][x].group) {
                if ((y > 0 && data[y - 1][x].group
                        && data[y - 1][x].group === data[y][x].group)
                    || (x > 0 && data[y][x - 1].group
                        && data[y][x - 1].group === data[y][x].group)) {

                    td = null;

                } else {

                    td = document.createElement(data[y][x].isCaption ? "th" : "td");
                    td.colSpan = (function (g) {
                        var i;
                        for (i = x; i < data[y].length; i++) {
                            if (data[y][i].group !== g) break;
                        }
                        return i - x;
                    })(data[y][x].group);
                    td.rowSpan = (function (g) {
                        var i;
                        for (i = y; i < data.length; i++) {
                            if (data[i][x].group !== g) break;
                        }
                        return i - y;
                    })(data[y][x].group);

                    if (x === 0 && y === 0 && _.tablesStack.length > 1) {
                        td.className += " backButton";
                        td.addEventListener("click", (td["triggerFunction"] = {
                            trigger: function () {
                                _._backClickHandler.call(_);
                            },
                            event: "click"
                        }).trigger);
                    }

                }
            } else {
                td = document.createElement(data[y][x].isCaption ? "th" : "td");
            }

            // add _columnClickHandler to last rows of th's
            if (td && x >= headLeftColsNum && y === headColsNum - 1) {
                // clickable cells (sort option)
                (function (x) {
                    td.addEventListener("click", (td["triggerFunction"] = {
                        trigger: function () {
                            var colNum = x - headLeftColsNum;
                            _._columnClickHandler.call(_, colNum);
                        },
                        event: "click"
                    }).trigger);
                })(x);
            }

            // add _rowClickHandler to th's last column
            if (td && x === headLeftColsNum - 1 && y >= headRowsNum) {
                (function (y, x) {
                    td.addEventListener("click", (td["triggerFunction"] = {
                        trigger: function () {
                            var rowNum = y - headRowsNum;
                            _._rowClickHandler.call(_, rowNum, data[y][x]);
                        },
                        event: "click"
                    }).trigger);
                })(y, x);
            }

            if (td) {
                td.textContent = data[y][x].value;
                tr.appendChild(td);
            }

        }
        (y < headColsNum ? thead : tbody).appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    this.elements.tableContainer.textContent = "";
    this.elements.tableContainer.appendChild(table);
    this.fixHeaders(table);

};