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
        if (t.v.clone) {
            t.v.clone.style.width = "";
            t.v.clone.style.zIndex = 1;
        }
    }

};

PivotView.prototype.updateSizes = function () {

    this._sizesChanged();

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

PivotView.prototype._backClickHandler = function (event) {

    if (event) {
        event.cancelBubble = true;
        event.stopPropagation();
    }

    this.popTable();
    this.controller.popDataSource();

    if (typeof this.controller.CONFIG.triggers["back"] === "function") {
        this.controller.CONFIG.triggers["back"].call(this.controller, {
            level: this.controller.DRILL_LEVEL
        });
    }

};

PivotView.prototype._drillThroughClickHandler = function (event) {

    this.controller.tryDrillThrough();

    if (event) {
        event.cancelBubble = true;
        event.stopPropagation();
    }

};

/**
 * @param {number} x
 * @param {number} y
 * @param {event} event
 */
PivotView.prototype._cellClickHandler = function (x, y, event) {

    var data = this.controller.dataController.getData(),
        f = [], f1, f2, callbackRes;

    try {
        f1 = data.rawData[y][data.info.leftHeaderColumnsNumber - 1].source.path;
        f2 = data.rawData[data.info.topHeaderRowsNumber - 1][x].source.path;
    } catch (e) {
        console.warn("Unable to get filters for cell (%d, %d)", x, y);
    }

    if (f1) f.push(f1);
    if (f2) f.push(f2);

    if (this.controller.CONFIG["drillDownTarget"]) {
        window.location = location.origin + location.pathname + "?DASHBOARD="
        + encodeURIComponent(this.controller.CONFIG["drillDownTarget"]) + "&SETTINGS=FILTER:"
        + encodeURIComponent(f.join("~")) + ";";
    } else {
        if (typeof this.controller.CONFIG.triggers["cellDrillThrough"] === "function") {
            callbackRes = this.controller.CONFIG.triggers["cellDrillThrough"]({
                event: event,
                filters: f
            });
            if (callbackRes !== false) this.controller.tryDrillThrough(f);
        } else {
            this.controller.tryDrillThrough(f);
        }
    }

};

/**
 * @deprecated
 * @param baseElement
 * @param elementToFix
 * @returns {boolean}
 */
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
 * @deprecated
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
    fhy.style.top = temp.offsetTop + "px";
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
            if (!tableElement.parentNode) return; // toFix
            hHead.style.top = fhx.style.top = tableElement.parentNode.scrollTop + "px";
            hHead.style.left = fhy.style.left = tableElement.parentNode.scrollLeft + "px";
    }, false);

    // append new elements
    tableElement.appendChild(fhx);
    tableElement.appendChild(fhy);
    if ((this.controller.dataController.getData() || { dimensions: [0, 0] }).dimensions[1].length) {
        tableElement.appendChild(hHead);
    }

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
        this.elements.messageElement = null;
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
    this.elements.base.appendChild(d1);

};

PivotView.prototype.removeMessage = function () {

    if (this.elements.messageElement && this.elements.messageElement.parentNode) {
        this.elements.messageElement.parentNode.removeChild(this.elements.messageElement);
    }

    this.elements.messageElement = null;

};

/**
 * Poor function that provides number formatting.
 *
 * @param {string} mask - String like "#'###.##"
 * @param {number} value
 * @returns {string}
 */
PivotView.prototype.formatNumber = function (mask, value) {

    var begin = true,
        fp = mask.match(/#+|[^#]+/g),
        integerPart, fractionalPart,
        last = -1, ip1, fp1;

    ip1 = integerPart = parseInt(value).toString();
    fp1 = fractionalPart = (parseFloat(value) - parseInt(integerPart))
        .toString()
        .concat((new Array(mask.length))
            .join("0"));
    for (var i = fp.length - 1; i > -1; i--) {
        if (fp[i][0] !== "#") continue;
        if (begin) {
            fp[i] = fractionalPart.substr(2, fp[i].length); // flooring
            begin = false;
        } else {
            fp[i] = integerPart
                .substr(Math.max(integerPart.length - fp[i].length, 0), integerPart.length);
            integerPart = integerPart.substr(0, integerPart.length - fp[i].length);
            last = i;
        }
        if (integerPart.length === 0) {
            fp = fp.slice(i, fp.length);
            break;
        }
    }
    if (fp.join("") === "4.0.") {
        console.log(ip1, fp1);
    }
    if (last !== -1 && integerPart.length !== 0) {
        fp[0] = integerPart + fp[0];
    }

    return fp.join("");

};

/**
 * @param {HTMLElement} container
 */
PivotView.prototype.recalculateSizes = function (container) {

    var containerParent = container.parentNode;

    try {

        var header = container.getElementsByClassName("lpt-headerValue")[0],
            headerContainer = container.getElementsByClassName("lpt-header")[0],
            topHeader = container.getElementsByClassName("lpt-topHeader")[0],
            tTableHead = topHeader.getElementsByTagName("thead")[0],
            topTableTr = topHeader.getElementsByTagName("tr")
                [topHeader.getElementsByTagName("tr").length - 1],
            leftHeader = container.getElementsByClassName("lpt-leftHeader")[0],
            lTableHead = leftHeader.getElementsByTagName("thead")[0],
            tableBlock = container.getElementsByClassName("lpt-tableBlock")[0],
            tableTr = tableBlock.getElementsByTagName("tr")[0],
            headerW = leftHeader.offsetWidth,
            headerH = topHeader.offsetHeight,
            containerHeight = container.offsetHeight,
            mainHeaderWidth = headerContainer.offsetWidth,
            addExtraTopHeaderCell = tTableHead.offsetWidth > topHeader.offsetWidth,
            addExtraLeftHeaderCell = lTableHead.offsetHeight > containerHeight - headerH,
            cell, cellWidths = [], i;

        headerContainer.style.width = headerW + "px";
        for (i in topTableTr.childNodes) {
            if (tableTr.childNodes[i].tagName !== "TD") continue;
            cellWidths.push(topTableTr.childNodes[i].offsetWidth);
        }

        container.parentNode.removeChild(container); // detach
        topHeader.style.marginLeft = headerW + "px";
        tableBlock.style.marginLeft = headerW + "px";
        leftHeader.style.height = containerHeight - headerH + "px";
        if (mainHeaderWidth > headerW) leftHeader.style.width = mainHeaderWidth + "px";
        tableBlock.style.height = containerHeight - headerH + "px";
        headerContainer.style.height = headerH + "px";

        if (addExtraTopHeaderCell) {
            tTableHead.childNodes[0].appendChild(cell = document.createElement("th"));
            cell.rowSpan = tTableHead.childNodes.length;
            cell.style.paddingLeft = headerW + "px"; // lucky random
        }

        if (addExtraLeftHeaderCell) {
            lTableHead.appendChild(
                document.createElement("tr").appendChild(cell = document.createElement("th"))
            );
            leftHeader.className = "lpt-leftHeader bordered";
            cell.colSpan = lTableHead.childNodes.length;
            cell.style.paddingTop = headerH + "px"; // lucky random
        }

        for (i in tableTr.childNodes) {
            if (tableTr.childNodes[i].tagName !== "TD") continue;
            tableTr.childNodes[i].style.width = cellWidths[i] + "px";
        }

        containerParent.appendChild(container); // attach

    } catch (e) {
        console.error("Error when fixing sizes. Please, contact the developer.", "ERROR:", e);
    }

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

    if (!data["rawData"] || !data["rawData"][0] || !data["rawData"][0][0]) {
        this.displayMessage("<h1>Unable to render data</h1><p>" + JSON.stringify(data) + "</p>");
        return;
    }

    var _ = this,
        CLICK_EVENT = this.controller.CONFIG["triggerEvent"] || "click",
        renderedGroups = {}, // keys of rendered groups; key = group, value = { x, y, element }
        rawData = data["rawData"],
        info = data["info"],
        container = this.elements.tableContainer,
        pivotTopSection = document.createElement("div"),
        pivotBottomSection = document.createElement("div"),
        pivotHeader = document.createElement("div"),
        topHeader = document.createElement("div"),
        header = document.createElement("div"),
        leftHeader = document.createElement("div"),
        tableBlock = document.createElement("div"),
        THTable = document.createElement("table"),
        THTHead = document.createElement("thead"),
        LHTable = document.createElement("table"),
        LHTHead = document.createElement("thead"),
        mainTable = document.createElement("table"),
        mainTBody = document.createElement("tbody"),
        x, y, tr = null, th, td;

    // clean previous content
    this.removeMessage();
    while (container.firstChild) { container.removeChild(container.firstChild); }

    var renderHeader = function (xFrom, xTo, yFrom, yTo, targetElement) {

        var vertical = targetElement === LHTHead,
            rendered, separatelyGrouped;

        for (y = yFrom; y < yTo; y++) {
            for (x = xFrom; x < xTo; x++) {

                separatelyGrouped = true;

                // setup th
                if (rendered = renderedGroups.hasOwnProperty(rawData[y][x].group)) {
                    //console.log("Already rendered group " + rawData[y][x].group,
                    //    renderedGroups[rawData[y][x].group].element,
                    //    "modifying col/row 'span", "rendered on ("
                    //    + renderedGroups[rawData[y][x].group].x + ";"
                    //    + renderedGroups[rawData[y][x].group].y + "), now on (" +
                    //    + x + "; " + y + ")");
                    // recalculate c/r 'span
                    if (x > 0 && rawData[y][x - 1].group === rawData[y][x].group) {
                        separatelyGrouped = false;
                        renderedGroups[rawData[y][x].group].element.colSpan =
                            x - renderedGroups[rawData[y][x].group].x + 1;
                    }
                    if (y > 0 && rawData[y - 1][x].group === rawData[y][x].group) {
                        separatelyGrouped = false;
                        renderedGroups[rawData[y][x].group].element.rowSpan =
                            y - renderedGroups[rawData[y][x].group].y + 1;
                    }
                    th = renderedGroups[rawData[y][x].group].element;
                }

                if (!rendered || separatelyGrouped) { // create element
                    if (!tr) tr = document.createElement("tr");
                    tr.appendChild(th = document.createElement("th"));
                    th.textContent = rawData[y][x].value;
                    if (rawData[y][x].group) renderedGroups[rawData[y][x].group] = {
                        x: x,
                        y: y,
                        element: th
                    };
                }

                // add listeners
                if (vertical && x === xTo - 1) {
                    th.addEventListener(CLICK_EVENT, (function (index, data) {
                        return function () {
                            _._rowClickHandler.call(_, index, data);
                        };
                    })(y, rawData[y][x]));
                }
                if (!vertical && y === yTo - 1 && !th["_hasSortingListener"]) {
                    th["_hasSortingListener"] = false;
                    th.addEventListener(CLICK_EVENT, (function (i) {
                        return function () {
                            _._columnClickHandler.call(_, i);
                        };
                    })(x - info.leftHeaderColumnsNumber));
                }

            }
            if (tr) targetElement.appendChild(tr);
            tr = null;
        }
    };

    console.log("Data to render: ", data);

    // fill header
    header.textContent = rawData[0][0].value;
    if (this.tablesStack.length > 1 && !this.controller.CONFIG["hideButtons"]) {
        header.className += "back ";
        header.addEventListener(CLICK_EVENT, function (e) {
            _._backClickHandler.call(_, e);
        });
    }

    // render topHeader
    renderHeader(
        info.leftHeaderColumnsNumber,
        rawData[0].length,
        0,
        info.topHeaderRowsNumber,
        THTHead
    );

    // render leftHeader
    renderHeader(
        0,
        info.leftHeaderColumnsNumber,
        info.topHeaderRowsNumber,
        rawData.length,
        LHTHead
    );

    // render table
    for (y = info.topHeaderRowsNumber; y < rawData.length; y++) {
        tr = document.createElement("tr");
        for (x = info.leftHeaderColumnsNumber; x < rawData[0].length; x++) {
            tr.appendChild(td = document.createElement("td"));
            td.textContent = rawData[y][x].value || "";
            if (rawData[y][x].style) td.setAttribute("style", rawData[y][x].style);
        }
        mainTBody.appendChild(tr);
    }

    tableBlock.addEventListener("scroll", function () {
        topHeader.scrollLeft = tableBlock.scrollLeft;
        leftHeader.scrollTop = tableBlock.scrollTop;
    });

    tableBlock.className = "lpt-tableBlock";
    leftHeader.className = "lpt-leftHeader";
    topHeader.className = "lpt-topHeader";
    pivotHeader.className = "lpt-header";
    pivotTopSection.className = "lpt-topSection";
    pivotBottomSection.className = "lpt-bottomSection";
    header.className += "lpt-headerValue";
    mainTable.appendChild(mainTBody);
    tableBlock.appendChild(mainTable);
    LHTable.appendChild(LHTHead);
    leftHeader.appendChild(LHTable);
    THTable.appendChild(THTHead);
    topHeader.appendChild(THTable);
    pivotHeader.appendChild(header);
    pivotTopSection.appendChild(pivotHeader);
    pivotTopSection.appendChild(topHeader);
    pivotBottomSection.appendChild(leftHeader);
    pivotBottomSection.appendChild(tableBlock);
    container.appendChild(pivotTopSection);
    container.appendChild(pivotBottomSection);

    this.recalculateSizes(container);

};

//PivotView.prototype.renderRawData = function (data) {
//
//    var clickEvent = this.controller.CONFIG["triggerEvent"] || "click";
//
//    if (!data || !data[0] || !data[0][0]) {
//        this.elements.tableContainer.innerHTML = "<h1>Unable to render data</h1><p>"
//            + JSON.stringify(data) + "</p>";
//        return;
//    }
//
//    if (this._scrollListener) {
//        this.elements.tableContainer.removeEventListener("scroll", this._scrollListener);
//        this._scrollListener = null;
//    }
//
//    var table = document.createElement("table"),
//        thead = document.createElement("thead"),
//        tbody = document.createElement("tbody"),
//        timeToBreak = false,
//        _ = this,
//        x, y, tr, td,
//        headColsNum = 0, headLeftColsNum = 0,
//        headRowsNum = 0, headLeftRowsNum = 0;
//
//    var addTrigger = function (element, event, trigger) {
//
//        element["triggerFunction"] = {
//            event: event,
//            trigger: trigger
//        };
//
//        element.addEventListener(event, trigger);
//
//    };
//
//    // compute headColsNum & headLeftColsNum
//    for (y = 0; y < data.length; y++) {
//        for (x = 0; x < data[y].length; x++) {
//            if (!data[y][x].isCaption) {
//                timeToBreak = true;
//                break;
//            }
//        }
//        if (timeToBreak) {
//            headLeftColsNum = x;
//            break;
//        } else headColsNum++;
//    }
//
//    // compute headRowsNum & headLeftRowsNum
//    for (y = 0; y < data.length; y++) {
//        if (!data[y][data[y].length - 1].isCaption) {
//            headRowsNum = y;
//            headLeftRowsNum = data.length - y;
//            break;
//        }
//    }
//
//    for (y = 0; y < data.length; y++) {
//        tr = document.createElement("tr");
//        for (x = 0; x < data[y].length; x++) {
//            if (data[y][x].group) {
//                if ((y > 0 && data[y - 1][x].group
//                        && data[y - 1][x].group === data[y][x].group)
//                    || (x > 0 && data[y][x - 1].group
//                        && data[y][x - 1].group === data[y][x].group)) {
//
//                    td = null;
//
//                } else {
//
//                    td = document.createElement(data[y][x].isCaption ? "th" : "td");
//                    td.colSpan = (function (g) {
//                        var i;
//                        for (i = x; i < data[y].length; i++) {
//                            if (data[y][i].group !== g) break;
//                        }
//                        return i - x;
//                    })(data[y][x].group);
//                    td.rowSpan = (function (g) {
//                        var i;
//                        for (i = y; i < data.length; i++) {
//                            if (data[i][x].group !== g) break;
//                        }
//                        return i - y;
//                    })(data[y][x].group);
//
//                    if (!_.controller.CONFIG["hideButtons"] && x === 0 && y === 0
//                            && _.tablesStack.length > 1) {
//                        var elt = document.createElement("div");
//                        elt.className = "backButton";
//                        addTrigger(elt, clickEvent, function (event) {
//                            _._backClickHandler.call(_, event);
//                        });
//                        td.insertBefore(elt, td.childNodes[td.childNodes.length - 1] || null);
//                    }
//
//                }
//            } else {
//                td = document.createElement(data[y][x].isCaption ? "th" : "td");
//            }
//
//            // add _columnClickHandler to last rows of th's
//            if (td && x >= headLeftColsNum && y === headColsNum - 1) {
//                // clickable cells (sort option)
//                (function (x) {
//                    addTrigger(td, clickEvent, function () {
//                        var colNum = x - headLeftColsNum;
//                        _._columnClickHandler.call(_, colNum);
//                    });
//                })(x);
//            }
//
//            // add _rowClickHandler to th's last column
//            if (td && x === headLeftColsNum - 1 && y >= headRowsNum) {
//                (function (y, x) {
//                    addTrigger(td, clickEvent, function () {
//                        var rowNum = y - headRowsNum;
//                        _._rowClickHandler.call(_, rowNum, data[y][x]);
//                    });
//                })(y, x);
//            }
//
//            if (td) {
//                var span = document.createElement("span");
//                if (!isFinite(data[y][x].value)) {
//                    if (!data[y][x].value.toString().match(/[0-9],?[0-9]?%/i))
//                        td.className = "formatLeft";
//                }
//                if (data[y][x].style) {
//                    td.setAttribute("style", data[y][x].style);
//                }
//                td.appendChild(span);
//                tr.appendChild(td);
//                if (x >= headLeftColsNum && y >= headRowsNum) {
//
//                    if (this.controller.CONFIG["formatNumbers"] && data[y][x].value
//                        && isFinite(data[y][x].value)) {
//                        span.textContent = this.formatNumber(
//                            this.controller.CONFIG["formatNumbers"],
//                            data[y][x].value
//                        );
//                    } else {
//                        if (Number(data[y][x].value) === data[y][x].value) { // if number
//                            // perform default formatting
//                            if (data[y][x].value % 1 === 0) { // if integer
//                                span.textContent =
//                                    this.formatNumber("#,###,###.##", data[y][x].value)
//                                        .replace(/\..*/, "");
//                            } else { // if float
//                                span.textContent = this.formatNumber("#,###,###.##", data[y][x].value);
//                            }
//                        } else {
//                            span.textContent = data[y][x].value;
//                        }
//                    }
//
//                    (function (x, y) {addTrigger(td, clickEvent, function (event) {
//                        _._cellClickHandler.call(_, x, y, event);
//                    })})(x, y);
//                } else {
//                    span.textContent = data[y][x].value;
//                }
//            }
//
//            if (!_.controller.CONFIG["hideButtons"] && x === 0 && y === 0
//                    && _.controller.dataController.getData().info.action === "MDX") {
//                var element = document.createElement("div");
//                element.className = "drillDownIcon";
//                addTrigger(element, clickEvent, function (event) {
//                    _._drillThroughClickHandler.call(_, event);
//                });
//                td.insertBefore(element, td.childNodes[td.childNodes.length - 1] || null);
//            }
//
//        }
//        (y < headColsNum ? thead : tbody).appendChild(tr);
//    }
//
//    table.appendChild(thead);
//    table.appendChild(tbody);
//    this.elements.tableContainer.textContent = "";
//    this.elements.tableContainer.appendChild(table);
//    this.fixHeaders(table);
//
//};
