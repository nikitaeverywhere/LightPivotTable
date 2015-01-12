/**
 * @param {LightPivotTable} controller
 * @param container
 * @constructor
 */
var PivotView = function (controller, container) {

    /*! INCLUDES numeral.js LIBRARY FOR NUMBER FORMATTING
     * numeral.js
     * version : 1.5.3
     * author : Adam Draper
     * license : MIT
     * http://adamwdraper.github.com/Numeral-js/
     */
    (function(){function a(a){this._value=a}function b(a,b,c,d){var e,f,g=Math.pow(10,b);return f=(c(a*g)/g).toFixed(b),d&&(e=new RegExp("0{1,"+d+"}$"),f=f.replace(e,"")),f}function c(a,b,c){var d;return d=b.indexOf("$")>-1?e(a,b,c):b.indexOf("%")>-1?f(a,b,c):b.indexOf(":")>-1?g(a,b):i(a._value,b,c)}function d(a,b){var c,d,e,f,g,i=b,j=["KB","MB","GB","TB","PB","EB","ZB","YB"],k=!1;if(b.indexOf(":")>-1)a._value=h(b);else if(b===q)a._value=0;else{for("."!==o[p].delimiters.decimal&&(b=b.replace(/\./g,"").replace(o[p].delimiters.decimal,".")),c=new RegExp("[^a-zA-Z]"+o[p].abbreviations.thousand+"(?:\\)|(\\"+o[p].currency.symbol+")?(?:\\))?)?$"),d=new RegExp("[^a-zA-Z]"+o[p].abbreviations.million+"(?:\\)|(\\"+o[p].currency.symbol+")?(?:\\))?)?$"),e=new RegExp("[^a-zA-Z]"+o[p].abbreviations.billion+"(?:\\)|(\\"+o[p].currency.symbol+")?(?:\\))?)?$"),f=new RegExp("[^a-zA-Z]"+o[p].abbreviations.trillion+"(?:\\)|(\\"+o[p].currency.symbol+")?(?:\\))?)?$"),g=0;g<=j.length&&!(k=b.indexOf(j[g])>-1?Math.pow(1024,g+1):!1);g++);a._value=(k?k:1)*(i.match(c)?Math.pow(10,3):1)*(i.match(d)?Math.pow(10,6):1)*(i.match(e)?Math.pow(10,9):1)*(i.match(f)?Math.pow(10,12):1)*(b.indexOf("%")>-1?.01:1)*((b.split("-").length+Math.min(b.split("(").length-1,b.split(")").length-1))%2?1:-1)*Number(b.replace(/[^0-9\.]+/g,"")),a._value=k?Math.ceil(a._value):a._value}return a._value}function e(a,b,c){var d,e,f=b.indexOf("$"),g=b.indexOf("("),h=b.indexOf("-"),j="";return b.indexOf(" $")>-1?(j=" ",b=b.replace(" $","")):b.indexOf("$ ")>-1?(j=" ",b=b.replace("$ ","")):b=b.replace("$",""),e=i(a._value,b,c),1>=f?e.indexOf("(")>-1||e.indexOf("-")>-1?(e=e.split(""),d=1,(g>f||h>f)&&(d=0),e.splice(d,0,o[p].currency.symbol+j),e=e.join("")):e=o[p].currency.symbol+j+e:e.indexOf(")")>-1?(e=e.split(""),e.splice(-1,0,j+o[p].currency.symbol),e=e.join("")):e=e+j+o[p].currency.symbol,e}function f(a,b,c){var d,e="",f=100*a._value;return b.indexOf(" %")>-1?(e=" ",b=b.replace(" %","")):b=b.replace("%",""),d=i(f,b,c),d.indexOf(")")>-1?(d=d.split(""),d.splice(-1,0,e+"%"),d=d.join("")):d=d+e+"%",d}function g(a){var b=Math.floor(a._value/60/60),c=Math.floor((a._value-60*b*60)/60),d=Math.round(a._value-60*b*60-60*c);return b+":"+(10>c?"0"+c:c)+":"+(10>d?"0"+d:d)}function h(a){var b=a.split(":"),c=0;return 3===b.length?(c+=60*Number(b[0])*60,c+=60*Number(b[1]),c+=Number(b[2])):2===b.length&&(c+=60*Number(b[0]),c+=Number(b[1])),Number(c)}function i(a,c,d){var e,f,g,h,i,j,k=!1,l=!1,m=!1,n="",r=!1,s=!1,t=!1,u=!1,v=!1,w="",x="",y=Math.abs(a),z=["B","KB","MB","GB","TB","PB","EB","ZB","YB"],A="",B=!1;if(0===a&&null!==q)return q;if(c.indexOf("(")>-1?(k=!0,c=c.slice(1,-1)):c.indexOf("+")>-1&&(l=!0,c=c.replace(/\+/g,"")),c.indexOf("a")>-1&&(r=c.indexOf("aK")>=0,s=c.indexOf("aM")>=0,t=c.indexOf("aB")>=0,u=c.indexOf("aT")>=0,v=r||s||t||u,c.indexOf(" a")>-1?(n=" ",c=c.replace(" a","")):c=c.replace("a",""),y>=Math.pow(10,12)&&!v||u?(n+=o[p].abbreviations.trillion,a/=Math.pow(10,12)):y<Math.pow(10,12)&&y>=Math.pow(10,9)&&!v||t?(n+=o[p].abbreviations.billion,a/=Math.pow(10,9)):y<Math.pow(10,9)&&y>=Math.pow(10,6)&&!v||s?(n+=o[p].abbreviations.million,a/=Math.pow(10,6)):(y<Math.pow(10,6)&&y>=Math.pow(10,3)&&!v||r)&&(n+=o[p].abbreviations.thousand,a/=Math.pow(10,3))),c.indexOf("b")>-1)for(c.indexOf(" b")>-1?(w=" ",c=c.replace(" b","")):c=c.replace("b",""),g=0;g<=z.length;g++)if(e=Math.pow(1024,g),f=Math.pow(1024,g+1),a>=e&&f>a){w+=z[g],e>0&&(a/=e);break}return c.indexOf("o")>-1&&(c.indexOf(" o")>-1?(x=" ",c=c.replace(" o","")):c=c.replace("o",""),x+=o[p].ordinal(a)),c.indexOf("[.]")>-1&&(m=!0,c=c.replace("[.]",".")),h=a.toString().split(".")[0],i=c.split(".")[1],j=c.indexOf(","),i?(i.indexOf("[")>-1?(i=i.replace("]",""),i=i.split("["),A=b(a,i[0].length+i[1].length,d,i[1].length)):A=b(a,i.length,d),h=A.split(".")[0],A=A.split(".")[1].length?o[p].delimiters.decimal+A.split(".")[1]:"",m&&0===Number(A.slice(1))&&(A="")):h=b(a,null,d),h.indexOf("-")>-1&&(h=h.slice(1),B=!0),j>-1&&(h=h.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g,"$1"+o[p].delimiters.thousands)),0===c.indexOf(".")&&(h=""),(k&&B?"(":"")+(!k&&B?"-":"")+(!B&&l?"+":"")+h+A+(x?x:"")+(n?n:"")+(w?w:"")+(k&&B?")":"")}function j(a,b){o[a]=b}function k(a){var b=a.toString().split(".");return b.length<2?1:Math.pow(10,b[1].length)}function l(){var a=Array.prototype.slice.call(arguments);return a.reduce(function(a,b){var c=k(a),d=k(b);return c>d?c:d},-1/0)}var m,n="1.5.3",o={},p="en",q=null,r="0,0",s="undefined"!=typeof module&&module.exports;m=function(b){return m.isNumeral(b)?b=b.value():0===b||"undefined"==typeof b?b=0:Number(b)||(b=m.fn.unformat(b)),new a(Number(b))},m.version=n,m.isNumeral=function(b){return b instanceof a},m.language=function(a,b){if(!a)return p;if(a&&!b){if(!o[a])throw new Error("Unknown language : "+a);p=a}return(b||!o[a])&&j(a,b),m},m.languageData=function(a){if(!a)return o[p];if(!o[a])throw new Error("Unknown language : "+a);return o[a]},m.language("en",{delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th"},currency:{symbol:"$"}}),m.zeroFormat=function(a){q="string"==typeof a?a:null},m.defaultFormat=function(a){r="string"==typeof a?a:"0.0"},"function"!=typeof Array.prototype.reduce&&(Array.prototype.reduce=function(a,b){"use strict";if(null===this||"undefined"==typeof this)throw new TypeError("Array.prototype.reduce called on null or undefined");if("function"!=typeof a)throw new TypeError(a+" is not a function");var c,d,e=this.length>>>0,f=!1;for(1<arguments.length&&(d=b,f=!0),c=0;e>c;++c)this.hasOwnProperty(c)&&(f?d=a(d,this[c],c,this):(d=this[c],f=!0));if(!f)throw new TypeError("Reduce of empty array with no initial value");return d}),m.fn=a.prototype={clone:function(){return m(this)},format:function(a,b){return c(this,a?a:r,void 0!==b?b:Math.round)},unformat:function(a){return"[object Number]"===Object.prototype.toString.call(a)?a:d(this,a?a:r)},value:function(){return this._value},valueOf:function(){return this._value},set:function(a){return this._value=Number(a),this},add:function(a){function b(a,b){return a+c*b}var c=l.call(null,this._value,a);return this._value=[this._value,a].reduce(b,0)/c,this},subtract:function(a){function b(a,b){return a-c*b}var c=l.call(null,this._value,a);return this._value=[a].reduce(b,this._value*c)/c,this},multiply:function(a){function b(a,b){var c=l(a,b);return a*c*b*c/(c*c)}return this._value=[this._value,a].reduce(b,1),this},divide:function(a){function b(a,b){var c=l(a,b);return a*c/(b*c)}return this._value=[this._value,a].reduce(b),this},difference:function(a){return Math.abs(m(this._value).subtract(a).value())}},s&&(module.exports=m),"undefined"==typeof ender&&(this.numeral=m)}).call(this);

    if (!(container instanceof HTMLElement)) throw new Error("Please, provide HTMLElement " +
        "instance \"container\" into pivot table configuration.");

    this.tablesStack = [];

    this.elements = {
        container: container,
        base: document.createElement("div"),
        tableContainer: undefined,
        messageElement: undefined
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
        tableElement = document.createElement("div");

    tableElement.className = "tableContainer";
    if (this.tablesStack.length) tableElement.style.left = "100%";

    this.tablesStack.push({
        element: tableElement,
        opts: opts || {}
    });

    this.elements.base.appendChild(tableElement);
    this.elements.tableContainer = tableElement;

    setTimeout(function () {
        _._updateTablesPosition();
    }, 30);

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
        f = [], f1, f2, callbackRes = true;

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
 * @param container
 */
PivotView.prototype.recalculateSizes = function (container) {

    var containerParent = container.parentNode,
        DEFAULT_CELL_HEIGHT = 22;

    try {

        var _ = this,
            CLICK_EVENT = this.controller.CONFIG["triggerEvent"] || "click",
            header = container.getElementsByClassName("lpt-headerValue")[0];

        if (!header) { return; } // pivot not ready - nothing to fix

        var headerContainer = container.getElementsByClassName("lpt-header")[0],
            topHeader = container.getElementsByClassName("lpt-topHeader")[0],
            tTableHead = topHeader.getElementsByTagName("thead")[0],
            leftHeader = container.getElementsByClassName("lpt-leftHeader")[0],
            lTableHead = leftHeader.getElementsByTagName("thead")[0],
            tableBlock = container.getElementsByClassName("lpt-tableBlock")[0],
            pTableHead = tableBlock.getElementsByTagName("tbody")[0],
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
            hasVerticalScrollBar = tableBlock.scrollHeight > containerHeight - headerH,
            addExtraLeftHeaderCell = lTableHead.offsetHeight > containerHeight - headerH
                && this.SCROLLBAR_WIDTH > 0,
            cell, tr, cellWidths = [], columnHeights = [], i;

        headerContainer.style.width = headerW + "px";
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

        if (hasVerticalScrollBar && cellWidths[cellWidths.length - 1]) {
            cellWidths[cellWidths.length - 1] -= this.SCROLLBAR_WIDTH;
        }

        topHeader.style.marginLeft = headerW + "px";
        tableBlock.style.marginLeft = headerW + "px";
        leftHeader.style.height = containerHeight - headerH + "px";
        leftHeader.style.width = headerW + "px";
        if (mainHeaderWidth > headerW) leftHeader.style.width = mainHeaderWidth + "px";
        tableBlock.style.height = containerHeight - headerH + "px";
        headerContainer.style.height = headerH + "px";

        if (addExtraLeftHeaderCell) {
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
            leftHeader.className = leftHeader.className.replace(/\sbordered/, "")
                + " bordered";
            cell.colSpan = lTableHead.childNodes.length;
            cell.style.height = this.SCROLLBAR_WIDTH + "px";
        }

        for (i in tableTr.childNodes) {
            if (tableTr.childNodes[i].tagName !== "TD") continue;
            tableTr.childNodes[i].style.width = cellWidths[i] + "px";
        }
        for (i in pTableHead.childNodes) {
            if (pTableHead.childNodes[i].tagName !== "TR") continue;
            if (pTableHead.childNodes[i].firstChild) {
                pTableHead.childNodes[i].firstChild.style.height =
                    (columnHeights[i] || columnHeights[i - 1] || DEFAULT_CELL_HEIGHT) + "px";
            }
        }

        containerParent.appendChild(container); // attach

    } catch (e) {
        console.error("Error when fixing sizes.", "ERROR:", e);
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
        colorScale =
            data["conditionalFormatting"] ? data["conditionalFormatting"]["colorScale"] : undefined,
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
        x, y, tr = null, th, td, primaryColumns = [], primaryRows = [], ratio, cellStyle;

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
                    if (rawData[y][x].style) th.setAttribute("style", rawData[y][x].style);
                    if (rawData[y][x].group) renderedGroups[rawData[y][x].group] = {
                        x: x,
                        y: y,
                        element: th
                    };
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
                if (!vertical && y === yTo - 1 && !th["_hasSortingListener"]) {
                    th["_hasSortingListener"] = false;
                    primaryColumns.push(th);
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

    //console.log("Data to render: ", data);

    // fill header
    header.textContent = info.leftHeaderColumnsNumber ? rawData[0][0].value : "";
    if (rawData[0][0].style) header.setAttribute("style", rawData[0][0].style);
    if (this.tablesStack.length > 1 && !this.controller.CONFIG["hideButtons"]) {
        header.className += "back ";
        header.addEventListener(CLICK_EVENT, function (e) {
            _._backClickHandler.call(_, e);
        });
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
        info.topHeaderRowsNumber,
        rawData.length,
        LHTHead
    );

    // render table
    for (y = info.topHeaderRowsNumber; y < rawData.length; y++) {
        tr = document.createElement("tr");
        for (x = info.leftHeaderColumnsNumber; x < rawData[0].length; x++) {

            cellStyle = "";
            tr.appendChild(td = document.createElement("td"));
            if (!isFinite(rawData[y][x].value)) {
                td.className += " formatLeft";
                td.textContent = rawData[y][x].value || "";
            } else { // number
                if (columnProps[x - info.leftHeaderColumnsNumber].format) {
                    td.textContent = rawData[y][x].value ? this.numeral(rawData[y][x].value).format(
                        columnProps[x - info.leftHeaderColumnsNumber].format
                    ) : "";
                } else {
                    td.textContent = rawData[y][x].value || "";
                }
            }
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
                    td
                );
            }

            // apply style
            if (cellStyle) td.setAttribute("style", cellStyle);
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
    if (this.controller.CONFIG.enableHeadersScrolling) {
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
    container["_primaryColumns"] = primaryColumns;
    container["_primaryRows"] = primaryRows;

    this.recalculateSizes(container);

};
