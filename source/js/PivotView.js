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
        _.updateSizes.call(_);
    });

};

PivotView.prototype.updateSizes = function () {

    for (var i in this.tablesStack) {
        this.recalculateSizes(this.tablesStack[i].element);
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
            tableTr = tableBlock.getElementsByTagName("tr")[0];

        if (tTableHead.childNodes[0] && tTableHead.childNodes[0].lastChild["_extraCell"]) {
            tTableHead.childNodes[0].removeChild(tTableHead.childNodes[0].lastChild);
        }
        if (lTableHead.lastChild && lTableHead.lastChild["_extraTr"]) {
            lTableHead.removeChild(lTableHead.lastChild);
        }

        var headerW = leftHeader.offsetWidth,
            headerH = topHeader.offsetHeight,
            containerHeight = container.offsetHeight,
            mainHeaderWidth = headerContainer.offsetWidth,
            addExtraTopHeaderCell = tTableHead.offsetWidth > topHeader.offsetWidth,
            addExtraLeftHeaderCell = lTableHead.offsetHeight > containerHeight - headerH,
            cell, tr, cellWidths = [], i;

        headerContainer.style.width = headerW + "px";
        for (i in topTableTr.childNodes) {
            if (!tableTr.childNodes[i] || tableTr.childNodes[i].tagName !== "TD") continue;
            cellWidths.push(topTableTr.childNodes[i].offsetWidth);
        }

        container.parentNode.removeChild(container); // detach
        topHeader.style.marginLeft = headerW + "px";
        tableBlock.style.marginLeft = headerW + "px";
        leftHeader.style.height = containerHeight - headerH + "px";
        leftHeader.style.width = headerW + "px";
        if (mainHeaderWidth > headerW) leftHeader.style.width = mainHeaderWidth + "px";
        tableBlock.style.height = containerHeight - headerH + "px";
        headerContainer.style.height = headerH + "px";

        if (addExtraTopHeaderCell) {
            tTableHead.childNodes[0].appendChild(cell = document.createElement("th"));
            cell.rowSpan = tTableHead.childNodes.length;
            cell.style.paddingLeft = headerW + "px"; // lucky random
            cell["_extraCell"] = true;
        }

        if (addExtraLeftHeaderCell) {
            tr = document.createElement("tr");
            tr.appendChild(cell = document.createElement("th"));
            lTableHead.appendChild(tr);
            tr["_extraTr"] = true;
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
        columnProps = data["columnProps"],
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
    header.textContent = info.leftHeaderColumnsNumber ? rawData[0][0].value : "";
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
            if (!isFinite(rawData[y][x].value)) {
                td.className += " formatLeft";
                td.textContent = rawData[y][x].value || "";
            } else { // number
                if (columnProps[x - info.leftHeaderColumnsNumber].format) {
                    td.textContent = this.formatNumber(
                        columnProps[x - info.leftHeaderColumnsNumber].format,
                        rawData[y][x].value || 0
                    ) || "";
                } else {
                    td.textContent = rawData[y][x].value || "";
                }
            }
            if (rawData[y][x].style) td.setAttribute("style", rawData[y][x].style);

            // add handlers
            td.addEventListener("click", (function (x, y) {
                return function (event) {
                    _._cellClickHandler.call(_, x, y, event);
                };
            })(x, y));

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
