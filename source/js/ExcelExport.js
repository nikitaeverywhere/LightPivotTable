var ExcelExport = function () {



};

ExcelExport.prototype.exportTableHTML = (function () {
    var uri = 'data:application/vnd.ms-excel;base64,'
        , template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>'
        , base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) }
        , format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) };
    return function (tableHTML, name) {
        var ctx = { worksheet: name || 'Worksheet', table: tableHTML };
        console.log(uri + base64(format(template, ctx)));
        window.location.href = uri + base64(format(template, ctx))
    }
})();

ExcelExport.prototype.exportXLS = function () {

    var lpt = document.getElementsByClassName("lpt")[0],
        bodyHTML  = lpt.getElementsByClassName("lpt-tableBlock")[0]
            .getElementsByTagName("table")[0].innerHTML,
        topHTML = lpt.getElementsByClassName("lpt-topHeader")[0]
            .getElementsByTagName("table")[0].innerHTML.replace(/<tr>/, "<tr><th colspan='2'></th>"),
        leftHTML = lpt.getElementsByClassName("lpt-leftHeader")[0]
            .getElementsByTagName("thead")[0].innerHTML,
        trs = leftHTML.match("<tr>(.*)</tr>")[1].split("</tr><tr>"),
        i = 0;

    bodyHTML = bodyHTML.replace(/<tr>/g, function () {
        return "<tr>" + trs[i++];
    });

    console.log(topHTML + bodyHTML);

    this.exportTableHTML(topHTML + bodyHTML, "test");

};