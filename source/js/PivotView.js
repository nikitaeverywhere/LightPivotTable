/**
 * @param {LightPivotTable} controller
 * @param container
 * @constructor
 */
var PivotView = function (controller, container) {

    if (!(container instanceof HTMLElement)) throw new Error("Please, provide HTMLElement " +
        "instance \"container\" into pivot table configuration.");

    this.tablesStack = [];

    numeral.call(this);

    this.elements = {
        container: container,
        base: document.createElement("div"),
        tableContainer: undefined,
        messageElement: undefined,
        searchSelect: undefined,
        searchInput: undefined
    };

    /**
     * Pagination object.
     * @see pushTable
     * @type {{on: boolean, page: number, pages: number, rows: number}}
     */
    this.pagination = null;

    /**
     * Saved scroll positions.
     * @type {{x: number, y: number}}
     */
    this.savedScroll = {
        x: 0,
        y: 0
    };

    /**
     * @type {number[]}
     */
    this.FIXED_COLUMN_SIZES = [];

    this.PAGINATION_BLOCK_HEIGHT = 20;
    this.ANIMATION_TIMEOUT = 500;

    this.SEARCH_ENABLED = false;
    this.SEARCHBOX_LEFT_MARGIN = 191;
    this.savedSearch = {
        restore: false,
        value: "",
        columnIndex: 0
    };

    this.controller = controller;

    this.SCROLLBAR_WIDTH = (function () {
        var outer = document.createElement("div");
        outer.style.visibility = "hidden";
        outer.style.width = "100px";
        outer.style.msOverflowStyle = "scrollbar";

        document.body.appendChild(outer);

        var widthNoScroll = outer.offsetWidth;
        outer.style.overflow = "scroll";

        var inner = document.createElement("div");
        inner.style.width = "100%";
        outer.appendChild(inner);

        var widthWithScroll = inner.offsetWidth;

        outer.parentNode.removeChild(outer);

        return widthNoScroll - widthWithScroll;
    })();

    this.init();

};

PivotView.prototype.init = function () {

    var _ = this,
        els = this.elements;

    els.base.className = "lpt";
    els.container.appendChild(els.base);

    this.pushTable();

    this.displayLoading();

    window.addEventListener("resize", function () {
        _.updateSizes.call(_);
    });

    // easter time!
    this._ = function () {
        _.displayMessage("<a href=\"https://github.com/ZitRos/LightPivotTable\">LIGHT PIVOT TABLE" +
        " v" + _.controller.VERSION +
        "</a><br/>by <a href=\"https://plus.google.com/+NikitaSavchenko\">Nikita Savchenko</a>" +
        "<br/>for dear users of products of <a href=\"http://www.intersystems.com/\">InterSystems" +
        " Corporation</a><br/>Hope you enjoy it!", true);
    };

};

PivotView.prototype.displayLoading = function () {

    this.displayMessage(
        this.controller.CONFIG["loadingMessageHTML"]
        || "<div class=\"lpt-spinner\">" +
        "<div></div><div></div><div></div><div></div><div></div>" +
        "</div>"
    );

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

PivotView.prototype.getCurrentTableData = function () {
    return this.tablesStack[this.tablesStack.length - 1];
};

PivotView.prototype.pushTable = function (opts) {

    var _ = this,
        pg,
        tableElement = document.createElement("div");

    tableElement.className = "tableContainer";
    if (this.tablesStack.length) {
        this.tablesStack[this.tablesStack.length - 1].FIXED_COLUMN_SIZES = this.FIXED_COLUMN_SIZES;
        this.tablesStack[this.tablesStack.length - 1].savedSearch = this.savedSearch;
        this.savedSearch = { restore: false, value: "", columnIndex: 0 };
        tableElement.style.left = "100%";
    }

    this.tablesStack.push({
        element: tableElement,
        opts: opts || {},
        pagination: pg = { // defaults copied to pushTable
            on: false,
            rows: Infinity, // rows by page including (headers + summary + rows from config)
            page: 0, // current page,
            pages: 0 // available pages
        }
    });

    this.FIXED_COLUMN_SIZES = [];
    this.elements.base.appendChild(tableElement);
    this.elements.tableContainer = tableElement;
    this.pagination = pg;

    setTimeout(function () {
        _._updateTablesPosition();
    }, 30);

};

PivotView.prototype.popTable = function () {

    var currentTable;

    if (this.tablesStack.length < 2) return;

    this.FIXED_COLUMN_SIZES = [];
    this._updateTablesPosition(1);
    var garbage = this.tablesStack.pop();

    this.pagination = (currentTable = this.tablesStack[this.tablesStack.length - 1]).pagination;
    if (currentTable.FIXED_COLUMN_SIZES) this.FIXED_COLUMN_SIZES = currentTable.FIXED_COLUMN_SIZES;
    if (currentTable.savedSearch) this.savedSearch = currentTable.savedSearch;

    setTimeout(function () {
        garbage.element.parentNode.removeChild(garbage.element);
    }, this.ANIMATION_TIMEOUT);
    this.elements.tableContainer = this.tablesStack[this.tablesStack.length - 1].element;

};

PivotView.prototype.saveScrollPosition = function () {

    var els;

    if (
        this.elements.tableContainer
        && (els = this.elements.tableContainer.getElementsByClassName("lpt-tableBlock"))
    ) {
        this.savedScroll.x = els[0].scrollLeft;
        this.savedScroll.y = els[0].scrollTop;
    }

};

PivotView.prototype.restoreScrollPosition = function () {

    var els;

    if (
        this.elements.tableContainer
        && (els = this.elements.tableContainer.getElementsByClassName("lpt-tableBlock"))
    ) {
        els[0].scrollLeft = this.savedScroll.x;
        els[0].scrollTop = this.savedScroll.y;
    }

};

/**
 * Data change handler.
 *
 * @param data
 */
PivotView.prototype.dataChanged = function (data) {

    var dataRows =
            data.rawData.length - data.info.topHeaderRowsNumber;// - (data.info.SUMMARY_SHOWN ? 1 : 0);

    if (this.controller.CONFIG.pagination) this.pagination.on = true;
    this.pagination.rows = this.controller.CONFIG.pagination || Infinity;
        //? this.controller.CONFIG.pagination
            //+ data.info.topHeaderRowsNumber + (data.info.SUMMARY_SHOWN ? 1 : 0)
        //: Infinity;
    this.pagination.page = 0;
    this.pagination.pages = Math.ceil(dataRows / this.pagination.rows);
    if (this.pagination.pages < 2) this.pagination.on = false;

    this.renderRawData(data);

};

PivotView.prototype._columnClickHandler = function (columnIndex) {

    this.saveScrollPosition();
    this.controller.dataController.sortByColumn(columnIndex);
    this.restoreScrollPosition();

};

PivotView.prototype._rowClickHandler = function (rowIndex, cellData) {

    this.controller.tryDrillDown(cellData.source.path);

};

PivotView.prototype._pageSwitcherHandler = function (pageIndex) {

    this.pagination.page = pageIndex;
    this.saveScrollPosition();
    this.renderRawData(this.controller.dataController.getData());
    this.restoreScrollPosition();

};

PivotView.prototype._backClickHandler = function (event) {

    if (event) {
        event.cancelBubble = true;
        event.stopPropagation();
    }

    this.removeMessage();
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
 * @param {object} cell
 * @param {number} x
 * @param {number} y
 * @param {event} event
 * @param {function} [drillThroughHandler]
 */
PivotView.prototype._cellClickHandler = function (cell, x, y, event, drillThroughHandler) {

    var data = this.controller.dataController.getData(),
        f = [], f1, f2, callbackRes = true,
        ATTACH_TOTALS = this.controller.CONFIG["showSummary"]
            && this.controller.CONFIG["attachTotals"] ? 1 : 0;

    try {
        f1 = data.rawData[y][data.info.leftHeaderColumnsNumber - 1].source.path;
        f2 = data.rawData[data.info.topHeaderRowsNumber - 1 - ATTACH_TOTALS][x].source.path;
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
                filters: f,
                cellData: cell
            });
        }
        if (typeof drillThroughHandler === "function") {
            callbackRes = !(!(false !== drillThroughHandler({
                event: event,
                filters: f,
                cellData: cell
            })) || !(callbackRes !== false));
        }
        if (callbackRes !== false) this.controller.tryDrillThrough(f);
    }

};

/**
 * Display hovering message.
 *
 * @param {string} text
 * @param {boolean} [removeByClick] - Define whether user be able to remove message by clicking on
 *                                    it.
 */
PivotView.prototype.displayMessage = function (text, removeByClick) {

    this.removeMessage();

    var _ = this,
        d1 = document.createElement("div"),
        d2 = document.createElement("div"),
        d3 = document.createElement("div");

    d1.className = "central lpt-hoverMessage";
    d1.style.opacity = 0;
    d3.innerHTML = text;
    d2.appendChild(d3);
    d1.appendChild(d2);
    this.elements.base.appendChild(d1);
    setTimeout(function () {
        if (d1) d1.style.opacity = 1;
    }, 1);
    if (removeByClick) {
        d1.addEventListener(this.controller.CONFIG["triggerEvent"] || "click", function () {
            _.removeMessage();
        });
    }

};

PivotView.prototype.removeMessage = function () {

    var els, i;

    if ((els = this.elements.base.getElementsByClassName("lpt-hoverMessage")).length) {
        for (i in els) {
            if (els[i].parentNode) els[i].parentNode.removeChild(els[i]);
        }
    }

};

/**
 * @param {*} value1
 * @param {string} operator
 * @param {*} value2 - fixed value
 * @private
 * @return {boolean}
 */
PivotView.prototype._matchCondition = function (value1, operator, value2) {

    switch (operator) {
        case "=": return value1 == value2;
        case "<>": return value1 != value2;
        case ">": return value1 > value2;
        case ">=": return value1 >= value2;
        case "<": return value1 < value2;
        case "<=": return value1 <= value2;
        case "IN": return value2.toString().indexOf(value1) !== -1; // how does it normally work?
        case "BETWEEN": return value1 >= value2.split(",")[0] && value1 <= value2.split(",")[1];
        case "IS NULL": return !value1;
        default: {
            console.error("Formatting error: unknown format operator \"" + operator + "\"");
            return false;
        }
    }

};

/**
 * Applies conditional formatting for element.
 *
 * @param {object} rules - Special object that contain formatting rules.
 * @param {string} key - Position y,x separated by comma or empty string for global.
 * @param {*} value - Original value to format (comparator).
 * @param {HTMLElement} element - element to format.
 */
PivotView.prototype.applyConditionalFormatting = function (rules, key, value, element) {

    var actualRules = rules[""] || [],
        p, i, rule, html, xs, num;
    actualRules = actualRules.concat(rules[key] || []);
    if ((xs = key.split(",")).length === 2) {
        actualRules = actualRules.concat(rules[xs[0] + ","] || [], rules["," + xs[1]] || []);
    }

    for (p in actualRules) {

        rule = actualRules[p];
        if (!this._matchCondition(value, rule["operator"], rule["value"])) continue;

        // apply formatting
        if (rule["style"])
            element.setAttribute("style", (element.getAttribute("style") || "") + rule["style"]);
        if (rule["icon"]) {
            element.textContent = ""; html = "<div style=\"overflow: hidden; height: 16px;\">";
            num = parseInt(rule["iconCount"]) || 1;
            for (i = 0; i < num; i++) {
                html += "<img alt=\"*\" style=\"padding-right:2px; height: 100%;\" " +
                "src=\"" + rule["icon"] + "\"/>";
            }
            // LPT won't change default format (f.e. text-align) for content.
            // element.className = (element.className || "") + " formatLeft";
            element.innerHTML = html + "</div>";
        }
        if (rule["text"]) element.textContent = rule["text"];

    }

};

/**
 * DeepSee-defined colors.
 *
 * @param {string} name - name of color. F.e. "red".
 * @returns {{ r: number, g: number, b: number }}
 */
PivotView.prototype.colorNameToRGB = function (name) {
    var c = function (r, g, b) { return { r: r, g: g, b: b } };
    switch (name) {
        case "red": return c(255, 0, 0);
        case "green": return c(0, 255, 0);
        case "blue": return c(0, 0, 255);
        case "purple": return c(102, 0, 153);
        case "salmon": return c(255, 140, 105);
        case "white": return c(255, 255, 255);
        case "black": return c(0, 0, 0);
        case "gray": return c(128, 128, 128);
        default: return c(255, 255, 255);
    }
};

/**
 * Size updater for LPT.
 * Do not affect scroll positions in this function.
 *
 * @param container
 */
PivotView.prototype.recalculateSizes = function (container) {

    var containerParent = container.parentNode,
        DEFAULT_CELL_HEIGHT = 22;

    try {

        var _ = this,
            CLICK_EVENT = this.controller.CONFIG["triggerEvent"] || "click",
            IE_EXTRA_SIZE = window.navigator.userAgent.indexOf("MSIE ") > -1 ? 1/3 : 0,
            header = container.getElementsByClassName("lpt-headerValue")[0];

        if (!header) { return; } // pivot not ready - nothing to fix

        var headerContainer = container.getElementsByClassName("lpt-header")[0],
            topHeader = container.getElementsByClassName("lpt-topHeader")[0],
            topHeaderTable = container.getElementsByTagName("table")[0],
            topHeaderTableWidth = topHeaderTable.offsetWidth,
            tTableHead = topHeader.getElementsByTagName("thead")[0],
            leftHeader = container.getElementsByClassName("lpt-leftHeader")[0],
            lTableHead = leftHeader.getElementsByTagName("thead")[0],
            tableBlock = container.getElementsByClassName("lpt-tableBlock")[0],
            mainContentTable = tableBlock.getElementsByTagName("table")[0],
            pTableHead = tableBlock.getElementsByTagName("tbody")[0],
            searchInput = container.getElementsByClassName("lpt-searchInput")[0],
            searchInputSize = searchInput ? container.offsetWidth - this.SEARCHBOX_LEFT_MARGIN : 0,
            tableTr = tableBlock.getElementsByTagName("tr")[0];

        if (tTableHead.childNodes[0] && tTableHead.childNodes[0].lastChild["_extraCell"]) {
            tTableHead.childNodes[0].removeChild(tTableHead.childNodes[0].lastChild);
        }
        if (lTableHead.lastChild && lTableHead.lastChild["_extraTr"]) {
            lTableHead.removeChild(lTableHead.lastChild);
        }

        var pagedHeight = (this.pagination.on ? this.PAGINATION_BLOCK_HEIGHT : 0)
                + (this.SEARCH_ENABLED ? this.PAGINATION_BLOCK_HEIGHT : 0),
            headerW = Math.max(leftHeader.offsetWidth, headerContainer.offsetWidth),
            headerH = topHeader.offsetHeight;

        topHeader.style.marginLeft = headerW + "px";

        var containerHeight = container.offsetHeight,
            bodyHeight = containerHeight - headerH - pagedHeight,
            mainHeaderWidth = headerContainer.offsetWidth,
            IS_LISTING = lTableHead.offsetHeight === 0,
            hasVerticalScrollBar =
                Math.max(lTableHead.offsetHeight, pTableHead.offsetHeight) > bodyHeight
                && this.SCROLLBAR_WIDTH > 0,
            hasHorizontalScrollBar =
                tTableHead.offsetWidth >
                    topHeader.offsetWidth - (hasVerticalScrollBar ? this.SCROLLBAR_WIDTH : 0);

        // horizontal scroll bar may change vertical scroll bar, so we need recalculate
        if (!hasVerticalScrollBar && hasHorizontalScrollBar) {
            hasVerticalScrollBar =
                Math.max(lTableHead.offsetHeight, pTableHead.offsetHeight) > bodyHeight - this.SCROLLBAR_WIDTH
                && this.SCROLLBAR_WIDTH > 0;
        }

        var addEggs = hasVerticalScrollBar && !IS_LISTING,
            cell, tr, cellWidths = [], columnHeights = [], i,
            headerCellApplied = false;

        var applyExtraTopHeadCell = function () {
            if (!_.controller.CONFIG.stretchColumns &&
                hasVerticalScrollBar && !hasHorizontalScrollBar) return;
            headerCellApplied = true;
            tr = document.createElement("th");
            tr.className = "lpt-extraCell";
            tr.style.minWidth = _.SCROLLBAR_WIDTH + "px";
            tr.style.width = _.SCROLLBAR_WIDTH + "px";
            tr.rowSpan = tTableHead.childNodes.length;
            tr["_extraCell"] = true;
            tTableHead.childNodes[0].appendChild(tr);
        };

        //return;
        //console.log(lTableHead.offsetHeight, pTableHead.offsetHeight, bodyHeight, this.SCROLLBAR_WIDTH);
        if (hasVerticalScrollBar && tTableHead.childNodes[0]) {
            applyExtraTopHeadCell();
        }

        if (container["_primaryColumns"]) {
            for (i in container["_primaryColumns"]) {
                cellWidths.push(container["_primaryColumns"][i].offsetWidth);
            }
        } else {
            console.warn("No _primaryColumns property in container, cell sizes won't be fixed.");
        }
        if (container["_primaryRows"]) {
            for (i in container["_primaryRows"]) {
                columnHeights.push(container["_primaryRows"][i].offsetHeight);
            }
        } else {
            console.warn("No _primaryRows property in container, cell sizes won't be fixed.");
        }

        container.parentNode.removeChild(container); // detach

        topHeader.style.marginLeft = headerW + "px";
        tableBlock.style.marginLeft = headerW + "px";
        leftHeader.style.height = containerHeight - headerH - pagedHeight + "px";
        leftHeader.style.width = headerW + "px";
        if (mainHeaderWidth > headerW) leftHeader.style.width = mainHeaderWidth + "px";
        tableBlock.style.height = containerHeight - headerH - pagedHeight + "px";
        headerContainer.style.height = headerH + "px";
        headerContainer.style.width = headerW + "px";
        if (!this.controller.CONFIG.stretchColumns) {
            topHeaderTable.style.width = "auto";
            mainContentTable.style.width =
                hasHorizontalScrollBar ? "100%" : topHeaderTableWidth + "px";
        }

        // @TEST beta.13
        //for (i in container["_primaryRows"]) {
        //    container["_primaryRows"][i].style.height = columnHeights[i] + "px";
        //}
        //for (i in container["_primaryColumns"]) {
        //    container["_primaryColumns"][i].style.width = cellWidths[i] + "px";
        //}

        //console.log(cellWidths);
        //containerParent.appendChild(container); // attach
        //return;

        if (addEggs) { // horScroll?
            tr = document.createElement("tr");
            tr.appendChild(cell = document.createElement("th"));
            lTableHead.appendChild(tr);
            cell["__i"] = 0;
            cell.addEventListener(CLICK_EVENT, function() {
                cell["__i"]++;
                cell.style.background = "#"+(Math.max(18-cell["__i"]*3,0)).toString(16)+"FF7D7";
                if (cell["__i"] > 5) _["_"]();
            });
            tr["_extraTr"] = true;
            cell.colSpan = lTableHead.childNodes.length;
            cell.style.height = (this.SCROLLBAR_WIDTH ? this.SCROLLBAR_WIDTH + 1 : 0) + "px";
        }

        if (searchInput) {
            searchInput.style.width = searchInputSize + "px";
        }

        //if (hasVerticalScrollBar) {
        //    leftHeader.className = leftHeader.className.replace(/\sbordered/, "") + " bordered";
        //}

        if (tableTr) for (i in tableTr.childNodes) {
            if (tableTr.childNodes[i].tagName !== "TD") continue;
            tableTr.childNodes[i].style.width = cellWidths[i] + "px";
        }
        for (i in pTableHead.childNodes) {
            if (pTableHead.childNodes[i].tagName !== "TR") continue;
            if (pTableHead.childNodes[i].firstChild) {
                pTableHead.childNodes[i].firstChild.style.height =
                    (columnHeights[i] || columnHeights[i - 1] || DEFAULT_CELL_HEIGHT)
                    + IE_EXTRA_SIZE
                    + "px";
            }
        }

        containerParent.appendChild(container); // attach

        /*
        * View in (listing) may have another size after attaching just because of applying
        * DEFAULT_CELL_HEIGHT to all of the rows. So if it is listing, we will check if
        * extra cell was actually added and if we need to add it now.
        **/
        if (/*IS_LISTING &&*/ Math.max(lTableHead.offsetHeight, pTableHead.offsetHeight) > bodyHeight
                && this.SCROLLBAR_WIDTH > 0 && !headerCellApplied) {
            applyExtraTopHeadCell();
        }

        // TEMPFIX: column sizes
        //var gg = 0;
        //if (tableTr && container["_primaryColumns"])
        //    for (i in tableTr.childNodes) {
        //        if (tableTr.childNodes[i].tagName !== "TD") continue;
        //        container["_primaryColumns"][gg++].style.width = tableTr.childNodes[i].offsetWidth + "px";
        //    }

    } catch (e) {
        console.error("Error when fixing sizes.", "ERROR:", e);
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
        this.displayMessage("<h1>" + pivotLocale.get(1) + "</h1><p>" + JSON.stringify(data) + "</p>");
        return;
    }

    var _ = this,
        rawData = data["rawData"],
        info = data["info"],
        columnProps = data["columnProps"],
        colorScale =
            data["conditionalFormatting"] ? data["conditionalFormatting"]["colorScale"] : undefined,

        CLICK_EVENT = this.controller.CONFIG["triggerEvent"] || "click",
        ATTACH_TOTALS = info.SUMMARY_SHOWN && this.controller.CONFIG["attachTotals"] ? 1 : 0,
        COLUMN_RESIZE_ON = !!this.controller.CONFIG.columnResizing,
        LISTING = info.leftHeaderColumnsNumber === 0,
        SEARCH_ENABLED = LISTING && this.controller.CONFIG["enableSearch"],

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

        pageSwitcher = this.pagination.on ? document.createElement("div") : null,
        pageNumbers = this.pagination.on ? [] : null,
        pageSwitcherContainer = pageSwitcher ? document.createElement("div") : null,

        searchBlock = SEARCH_ENABLED ? document.createElement("div") : null,
        searchIcon = SEARCH_ENABLED ? document.createElement("span") : null,
        searchSelect = SEARCH_ENABLED ? document.createElement("select") : null,
        searchSelectOuter = SEARCH_ENABLED ? document.createElement("span") : null,
        searchInput = SEARCH_ENABLED ? document.createElement("input") : null,
        searchFields = SEARCH_ENABLED ? (function () {
            var arr = [],
                x = info.leftHeaderColumnsNumber,
                y = info.topHeaderRowsNumber - 1 - ATTACH_TOTALS;
            for (var i = x; i < rawData[y].length; i++) {
                arr.push({
                    value: rawData[y][i].value,
                    source: rawData[y][i].source,
                    columnIndex: i
                });
            }
            return arr;
        })() : null,

        _RESIZING = false, _RESIZING_ELEMENT = null, _RESIZING_COLUMN_INDEX = 0,
        _RESIZING_ELEMENT_BASE_WIDTH, _RESIZING_ELEMENT_BASE_X,
        renderedGroups = {}, // keys of rendered groups; key = group, value = { x, y, element }
        i, x, y, tr = null, th, td, primaryColumns = [], primaryRows = [], ratio, cellStyle,
        tempI, tempJ, div;

    this.SEARCH_ENABLED = SEARCH_ENABLED;

    this.numeral.setup(
        info["decimalSeparator"] || ".",
        info["numericGroupSeparator"] || ",",
        info["numericGroupSize"] || 3
    );

    var formatContent = function (value, element, format) {
        if (!isFinite(value)) {
            element.className += " formatLeft";
            element.textContent = value || "";
        } else { // number
            if (format) { // set format
                element.textContent = value ? _.numeral(value).format(format) : "";
            } else if (value && info.defaultFormat) {
                element.textContent = _.numeral(value).format(
                    value % 1 === 0 ? "#,###" : "#,###.##"
                );
            } else {
                element.textContent = value || "";
            }
        }
    };

    var setCaretPosition = function (elem, caretPos) {
        var range;
        if (elem.createTextRange) {
            range = elem.createTextRange();
            range.move("character", caretPos);
            range.select();
        } else {
            elem.setSelectionRange(caretPos, caretPos);
        }
    };

    //var getMouseXY = function (e) {
    //    var element = e.target || e.srcElement, offsetX = 0, offsetY = 0;
    //    if (element.offsetParent) {
    //        do {
    //            offsetX += element.offsetLeft;
    //            offsetY += element.offsetTop;
    //        } while ((element = element.offsetParent));
    //    }
    //    return { x: e.pageX - offsetX, y: e.pageY - offsetY };
    //};

    var bindResize = function (element, column) {

        var el = element,
            colIndex = column;

        var moveListener = function (e) {
            if (!_RESIZING) return;
            e.cancelBubble = true;
            e.preventDefault();
            _RESIZING_ELEMENT.style.width = _RESIZING_ELEMENT.style.minWidth =
                _RESIZING_ELEMENT_BASE_WIDTH - _RESIZING_ELEMENT_BASE_X + e.pageX + "px";
        };

        if (!el._HAS_MOUSE_MOVE_LISTENER) {
            el.parentNode.addEventListener("mousemove", moveListener);
            el._HAS_MOUSE_MOVE_LISTENER = true;
        }

        el.addEventListener("mousedown", function (e) {
            //var cursorX = getMouseXY(e).x;
            //if (cursorX < el.offsetWidth - 5 && cursorX > 5) {
            //    return;
            //}
            if ((e.target || e.srcElement) !== el) return;
            e.cancelBubble = true;
            e.preventDefault();
            _RESIZING = true;
            _RESIZING_ELEMENT = el;
            _RESIZING_ELEMENT_BASE_WIDTH = el.offsetWidth;
            _RESIZING_ELEMENT_BASE_X = e.pageX;
            _RESIZING_COLUMN_INDEX = colIndex;
            //el._CANCEL_CLICK_EVENT = true;
        });

        el.addEventListener("mouseup", function (e) {
            if (!_RESIZING) return;
            e.cancelBubble = true;
            e.preventDefault();
            _RESIZING = false;
            _RESIZING_ELEMENT.style.width = _RESIZING_ELEMENT.style.minWidth =
                (_.FIXED_COLUMN_SIZES[_RESIZING_COLUMN_INDEX] =
                    _RESIZING_ELEMENT_BASE_WIDTH - _RESIZING_ELEMENT_BASE_X + e.pageX
                ) + "px";
            _.saveScrollPosition();
            _.recalculateSizes(container);
            _.restoreScrollPosition();
            setTimeout(function () {
                //_RESIZING_ELEMENT._CANCEL_CLICK_EVENT = false;
                _RESIZING_ELEMENT = null;
            }, 1);
        });

    };

    // clean previous content
    this.removeMessage();
    while (container.firstChild) { container.removeChild(container.firstChild); }

    var renderHeader = function (xFrom, xTo, yFrom, yTo, targetElement) {

        var vertical = targetElement === LHTHead,
            rendered, separatelyGrouped, tr, th, div;

        for (y = yFrom; y < yTo; y++) {
            for (x = xFrom; x < xTo; x++) {

                separatelyGrouped = true;

                // setup th
                if (rendered = renderedGroups.hasOwnProperty(rawData[y][x].group)) {
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
                    tr.appendChild(
                        th = document.createElement(rawData[y][x].isCaption ? "th" : "td")
                    );
                    div = document.createElement("div");
                    //div2 = document.createElement("div");
                    if (rawData[y][x].value) {
                        div.textContent = rawData[y][x].value;
                    } else div.innerHTML = "&nbsp;";
                    //div2.appendChild(div);
                    th.appendChild(div);
                    if (rawData[y][x].style) th.setAttribute("style", rawData[y][x].style);
                    if (info.leftHeaderColumnsNumber === 0
                        && _.controller.CONFIG["listingColumnMinWidth"]) { // if listing
                        th.style.minWidth = _.controller.CONFIG["listingColumnMinWidth"] + "px";
                    }
                    if (info.leftHeaderColumnsNumber > 0
                        && _.controller.CONFIG["maxHeaderWidth"]) {
                        th.style.maxWidth = _.controller.CONFIG["maxHeaderWidth"] + "px";
                        th.style.whiteSpace = "normal";
                        th.style.wordWrap = "normal";
                    }
                    if (rawData[y][x].className) th.className = rawData[y][x].className;
                    if (rawData[y][x].group) renderedGroups[rawData[y][x].group] = {
                        x: x,
                        y: y,
                        element: th
                    };
                    if (!rawData[y][x].isCaption) formatContent(
                        rawData[y][x].value,
                        th,
                        columnProps[x - info.leftHeaderColumnsNumber].format
                    );
                }

                // add listeners
                if (vertical && x === xTo - 1 && !rawData[y][x]["noDrillDown"]) {
                    primaryRows.push(th);
                    th.addEventListener(CLICK_EVENT, (function (index, data) {
                        return function () {
                            _._rowClickHandler.call(_, index, data);
                        };
                    })(y, rawData[y][x]));
                }
                if (!vertical && y === yTo - 1 - ATTACH_TOTALS && !th["_hasSortingListener"]) {
                    th["_hasSortingListener"] = false; // why false?
                    //console.log("Click bind to", th);
                    th.addEventListener(CLICK_EVENT, (function (i) {
                        return function () {
                            //if (th._CANCEL_CLICK_EVENT) return;
                            _._columnClickHandler.call(_, i);
                        };
                    })(x - info.leftHeaderColumnsNumber));
                    th.className = (th.className || "") + " lpt-clickable";
                }
                if (!vertical && y === yTo - 1) {
                    if (_.FIXED_COLUMN_SIZES[x]) {
                        th.style.minWidth = th.style.width = _.FIXED_COLUMN_SIZES[x] + "px";
                    }
                    if (COLUMN_RESIZE_ON) {
                        bindResize(th, x);
                        th.className += " lpt-resizableColumn";
                    }
                    primaryColumns.push(th);
                }

            }
            if (tr) targetElement.appendChild(tr);
            tr = null;
        }
    };

    // top left header setup
    header.textContent = info.leftHeaderColumnsNumber ? rawData[0][0].value : "";
    if (rawData[0][0].style) header.setAttribute("style", rawData[0][0].style);
    if (this.tablesStack.length > 1 && !this.controller.CONFIG["hideButtons"]) {
        header.className += "back ";
        header.addEventListener(CLICK_EVENT, function (e) {
            _._backClickHandler.call(_, e);
        });
    }
    if (info.leftHeaderColumnsNumber > 0
        && _.controller.CONFIG["maxHeaderWidth"]) {
        pivotHeader.style.maxWidth =
            _.controller.CONFIG["maxHeaderWidth"]*info.leftHeaderColumnsNumber + "px";
        pivotHeader.style.whiteSpace = "normal";
        pivotHeader.style.wordWrap = "normal";
    }
    if ( // hide unnecessary column
        (this.controller.CONFIG["hideButtons"] || this.tablesStack.length < 2)
        && info.leftHeaderColumnsNumber === 0
    ) {
        header.style.display = "none";
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
        tempI = info.topHeaderRowsNumber + (this.pagination.page*this.pagination.rows || 0),
        tempJ = this.pagination.on
            ? Math.min(tempI + this.pagination.rows, rawData.length)
            : rawData.length,
        LHTHead
    );

    // render table
    for (y = tempI; y < tempJ; y++) {
        tr = document.createElement("tr");
        for (x = info.leftHeaderColumnsNumber; x < rawData[0].length; x++) {

            cellStyle = this.controller.getPivotProperty(["cellStyle"]) || "";
            tr.appendChild(td = document.createElement("td"));
            td.appendChild(div = document.createElement("div"));
            formatContent(
                rawData[y][x].value,
                div,
                columnProps[x - info.leftHeaderColumnsNumber].format
            );
            if (
                colorScale
                && !(info.SUMMARY_SHOWN && rawData.length - 1 === y) // exclude totals formatting
            ) {
                ratio = (parseFloat(rawData[y][x].value) - colorScale.min) / colorScale.diff;
                cellStyle += "background:rgb(" +
                + Math.round((colorScale.to.r - colorScale.from.r)*ratio + colorScale.from.r)
                + "," + Math.round((colorScale.to.g - colorScale.from.g)*ratio + colorScale.from.g)
                + "," + Math.round((colorScale.to.b - colorScale.from.b)*ratio + colorScale.from.b)
                + ");" + (colorScale.invert ? "color: white;" : "");
            }
            if (columnProps[x - info.leftHeaderColumnsNumber].style) {
                cellStyle += columnProps[x - info.leftHeaderColumnsNumber].style;
            }
            if (rawData[y][x].style) {
                cellStyle += rawData[y][x].style;
            }
            if (
                this.controller.CONFIG.conditionalFormattingOn // totals formatting present
                && !(info.SUMMARY_SHOWN && rawData.length - 1 === y) // exclude totals formatting
                && !this.getCurrentTableData().opts.disableConditionalFormatting
            ) {
                this.applyConditionalFormatting(
                    data["conditionalFormatting"],
                    (y - info.topHeaderRowsNumber + 1) + "," + (x - info.leftHeaderColumnsNumber + 1),
                    rawData[y][x].value,
                    div
                );
            }

            // apply style
            if (cellStyle) td.setAttribute("style", (td.getAttribute("style") || "") + cellStyle);
            // add handlers
            td.addEventListener(CLICK_EVENT, (function (x, y, cell) {
                return function (event) {
                    _._cellClickHandler.call(
                        _, cell, x, y, event, info.drillThroughHandler
                    );
                };
            })(x, y, rawData[y][x]));

        }
        mainTBody.appendChild(tr);
    }

    tableBlock.addEventListener("scroll", function () {
        if (tableBlock._ISE) { tableBlock._ISE = false; return; }
        topHeader.scrollLeft = tableBlock.scrollLeft;
        leftHeader.scrollTop = tableBlock.scrollTop;
        topHeader._ISE = true; leftHeader._ISE = true; // ignore scroll event
    });

    leftHeader.className = "lpt-leftHeader";
    topHeader.className = "lpt-topHeader";
    if (this.controller.CONFIG["enableHeadersScrolling"]) {
        leftHeader.className = leftHeader.className + " lpt-scrollable-y";
        topHeader.className = topHeader.className + " lpt-scrollable-x";
        leftHeader.addEventListener("scroll", function () {
            if (leftHeader._ISE) { leftHeader._ISE = false; return; }
            tableBlock.scrollTop = leftHeader.scrollTop;
            tableBlock._ISE = true;
        });
        topHeader.addEventListener("scroll", function () {
            if (topHeader._ISE) { topHeader._ISE = false; return; }
            tableBlock.scrollLeft = topHeader.scrollLeft;
            tableBlock._ISE = true;
        });
    }
    tableBlock.className = "lpt-tableBlock";
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
    if (!this.controller.CONFIG.stretchColumns) {
        THTable.style.width = "auto"; // required for correct 1st resizing
    }

    if (pageSwitcher) {
        pageSwitcher.className = "lpt-pageSwitcher";
        pageNumbers = (function getPageNumbersArray (currentPage, pages) { // minPage = 1

            var step = 0,
                pagesArr = [currentPage];
            while (currentPage > 1) {
                currentPage = Math.max(1, currentPage - (step || 1));
                pagesArr.unshift(currentPage);
                step = step*step + 1;
            }
            step = 0;
            currentPage = pagesArr[pagesArr.length - 1];
            while (currentPage < pages) {
                currentPage = Math.min(pages, currentPage + (step || 1));
                pagesArr.push(currentPage);
                step = step*step + 1;
            }
            return pagesArr;

        })(this.pagination.page + 1, this.pagination.pages);
        for (i in pageNumbers) {
            i = parseInt(i);
            td = document.createElement("span");
            if (pageNumbers[i] === this.pagination.page + 1) { td.className = "lpt-active"; }
            td.textContent = pageNumbers[i];
            (function (page) {td.addEventListener(CLICK_EVENT, function () { // add handler
                _._pageSwitcherHandler.call(_, page - 1);
            })})(pageNumbers[i]);
            pageSwitcherContainer.appendChild(td);
            if (pageNumbers[i + 1] && pageNumbers[i] + 1 !== pageNumbers[i + 1]) {
                td = document.createElement("span");
                td.className = "lpt-pageSpacer";
                pageSwitcherContainer.appendChild(td);
            }
        }
        pageSwitcher.appendChild(pageSwitcherContainer);
        container.appendChild(pageSwitcher);
    }

    if (SEARCH_ENABLED) {
        searchIcon.className = "lpt-searchIcon";
        searchSelectOuter.className = "lpt-searchSelectOuter";
        searchBlock.className = "lpt-searchBlock";
        searchInput.className = "lpt-searchInput";
        searchSelect.className = "lpt-searchSelect";
        //if (pageSwitcher) {
        //    pageSwitcher.style.borderBottom = "none";
        //    pageSwitcher.style.bottom = "20px";
        //}
        for (i in searchFields) {
            td = document.createElement("option");
            td.setAttribute("value", searchFields[i].columnIndex.toString());
            td.textContent = searchFields[i].value;
            searchSelect.appendChild(td);
        }
        searchInput.addEventListener("input", function () {
            var colIndex = parseInt(searchSelect.options[searchSelect.selectedIndex].value),
                value = searchInput.value;
            _.saveScrollPosition();
            _.savedSearch.value = value;
            _.savedSearch.columnIndex = colIndex;
            _.savedSearch.restore = true;
            _.controller.dataController.filterByValue(value, colIndex);
            _.restoreScrollPosition();
        });
        searchBlock.appendChild(searchIcon);
        searchSelectOuter.appendChild(searchSelect);
        searchBlock.appendChild(searchSelectOuter);
        searchBlock.appendChild(searchInput);
        container.insertBefore(searchBlock, pivotTopSection);
        this.elements.searchInput = searchInput;
        this.elements.searchSelect = searchSelect;
        if (this.savedSearch.restore) {
            this.elements.searchInput.value = this.savedSearch.value;
            this.elements.searchSelect.value = this.savedSearch.columnIndex;
        }
    } else {
        this.elements.searchInput = undefined;
        this.elements.searchSelect = undefined;
    }

    container["_primaryColumns"] = primaryColumns;
    container["_primaryRows"] = primaryRows;

    this.recalculateSizes(container);

    if (this.savedSearch.restore) {
        this.elements.searchInput.focus();
        setCaretPosition(this.elements.searchInput, this.savedSearch.value.length);
    }

};
