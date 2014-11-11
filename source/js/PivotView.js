/**
 * @param {LightPivotTable} controller
 * @param container
 * @constructor
 */
var PivotView = function (controller, container) {

    if (!(container instanceof HTMLElement)) throw new Error("Please, provide HTMLElement " +
        "instance \"container\" into pivot table configuration.");

    this.elements = {
        container: container,
        base: document.createElement("div"),
        tableContainer: document.createElement("div"),
        controlsContainer: document.createElement("div")
    };

    this.controller = controller;

    /**
     * @private
     */
    this._scrollListener = null;

    this.init();

};

PivotView.prototype.init = function () {

    var els = this.elements;

    els.base.className = "lpt";
    els.tableContainer.textContent = "Loading...";
    els.tableContainer.className = "tableContainer";
    els.base.appendChild(els.tableContainer);
    els.container.appendChild(els.base);

};

PivotView.prototype._columnClickHandler = function (columnIndex) {

    this.controller.dataController.sortByColumn(columnIndex);

};

/**
 * Create clones of headers with fixed sizes.
 *
 * @param {HTMLElement} tableElement
 */
PivotView.prototype.fixHeaders = function (tableElement) {

    var fhx, temp, hHead, fhy, c1, c2, d1, d2, st;

    var getChildrenByTagName = function (element, tagName) {
        var cls = [];
        for (var c in element.childNodes) {
            if (element.childNodes[c].tagName === tagName.toUpperCase()) {
                cls.push(element.childNodes[c]);
            }
        }
        return cls;
    };

    var fixSizes = function (baseElement, elementToFix) {

        if (!elementToFix.style) return false;

        for (var i in elementToFix.childNodes) {
            fixSizes(baseElement.childNodes[i], elementToFix.childNodes[i]);
        }

        if (baseElement["triggerFunction"]) {
            elementToFix.addEventListener("click", baseElement["triggerFunction"]);
        }

        var style = window.getComputedStyle(baseElement, null);
        elementToFix.style.width = style.getPropertyValue("width");
        elementToFix.style.height = style.getPropertyValue("height");

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
    fixSizes(temp, fhx);
    fhx.style.width = "";

    // clone top left corner
    hHead = temp.childNodes[0].childNodes[0].cloneNode(true);
    st = window.getComputedStyle(temp.childNodes[0].childNodes[0], null);
    hHead.style.width = st.getPropertyValue("width");
    hHead.style.height = st.getPropertyValue("height");
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
    fixSizes(temp, fhy);
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
        x, y, tr, td, headColsNum = 0, headLeftColsNum = 0;

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

                }
            } else {
                td = document.createElement(data[y][x].isCaption ? "th" : "td");
            }
            if (x >= headLeftColsNum && y === headColsNum - 1) { // clickable cells (sort option)
                if (td) (function (x) {td.addEventListener("click", td["triggerFunction"] = function () {
                    var colNum = x - headLeftColsNum;
                    _._columnClickHandler.call(_, colNum);
                })})(x);
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