var PivotView = function (container) {

    if (!(container instanceof HTMLElement)) throw new Error("Please, provide HTMLElement " +
        "instance \"container\" into pivot table configuration.");

    this.elements = {
        container: container,
        base: document.createElement("div"),
        tableContainer: document.createElement("div"),
        controlsContainer: document.createElement("div")
    };

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

PivotView.prototype.render = function (data) {

    if (data.error) {
        this.elements.tableContainer.innerHTML = "<h1>Unable to render data</h1><p>"
            + data.error + "</p>";
        return;
    }

    this.elements.tableContainer.textContent = "";

    var vTree, horDimArr = [], tableWidth, td, extraTh, tr, i,
        table = document.createElement("table"),
        thead = document.createElement("thead"),
        tbody = document.createElement("tbody");

    var build = function (tree, barr, dim) {

        var d = [], ch, n, o, nn = 0;

        if (barr) {
            if (!dim) dim = 0;
            if (!horDimArr[dim]) horDimArr[dim] = [];
        }

        for (var i in tree) {
            ch = tree[i].children ? build(tree[i].children, barr, barr ? dim + 1 : dim) : null;
            n = ch ? ch.numOfChildren : 1;
            nn += n;
            d.push(o = {
                caption: tree[i].caption,
                dimension: tree[i].dimension,
                path: tree[i].path,
                children: ch ? ch.children : ch,
                numOfChildren: n
            });
            if (barr) horDimArr[dim].push(o);
        }

        return {
            children: d,
            numOfChildren: nn
        }

    };

    var prepend = function (cont, el) {
        cont.insertBefore(el, cont.firstChild);
    };

    var lastTr,
        trs = [],
        maxLev = 1;

    var verticalTree = function (children, sti, lev) {

        if (!sti) sti = 0;
        if (!lev) lev = 1;
        if (lev > maxLev) maxLev = lev;

        for (var i in children) {

            var ch = children[i],
                td;

            if (ch.children) {
                verticalTree(ch.children, sti, lev + 1);
                td = document.createElement("th");
                td.setAttribute("rowspan", ch.numOfChildren);
                td.textContent = ch.caption || "";
                prepend(trs[sti], td);
                sti += ch.numOfChildren;
            } else {
                trs.push(lastTr = document.createElement("tr"));
                tbody.appendChild(lastTr);
                td = document.createElement("th");
                td.textContent = ch.caption || "";
                prepend(lastTr, td);
            }

        }

    };

    build(data.dimensions[0], 1);
    tableWidth = horDimArr[horDimArr.length - 1].length;
    vTree = build(data.dimensions[1]);

    verticalTree(vTree.children);

    for (var u = 0; u < horDimArr.length; u++) {

        tr = document.createElement("tr");

        if (u == 0) {
            var cornerTd = document.createElement("th");
            //cornerTd.innerHTML = "";
            cornerTd.setAttribute("rowspan", horDimArr.length.toString());
            cornerTd.setAttribute("colspan", maxLev.toString());
            tr.appendChild(cornerTd);
        }

        for (i in horDimArr[u]) {

            var ch = horDimArr[u][i];

            td = document.createElement("th");

            td.textContent = ch.caption || "";
            td.setAttribute("colspan", ch.numOfChildren);
            tr.appendChild(td);
        }

        thead.appendChild(tr);

    }

    for (i = 0; i < data.dataArray.length; i++) {
        td = document.createElement("td");
        td.textContent = data.dataArray[i];
        tr = trs[Math.floor(i / tableWidth)];
        if (!tr) {
            trs[Math.floor(i / tableWidth)] = tr = document.createElement("tr");
            extraTh = document.createElement("th");
            tr.appendChild(extraTh);
            tbody.appendChild(tr);
        }
        tr.appendChild(td);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    this.elements.tableContainer.appendChild(table);

};
