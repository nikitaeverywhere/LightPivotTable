var LightPivot = function (configuration) {

    var _ = this;

    if (typeof configuration !== "object") configuration = {};

    this.pivotView = new PivotView(configuration.container);
    this.dataSource = new DataSource(configuration.dataSource || {});

    this.dataSource.getCurrentData(function (data) {
        console.log(data);
        _.pivotView.render(data);
    });

};