var LightPivotTable = function (configuration) {

    var _ = this;

    if (typeof configuration !== "object") configuration = {};

    this.pivotView = new PivotView(this, configuration.container);
    this.dataSource = new DataSource(configuration.dataSource || {});

    /**
     * @type {DataController}
     */
    this.dataController = new DataController(this, function () {
        _.dataChangeTrigger.call(_);
    });

    this.init();

};

LightPivotTable.prototype.dataChangeTrigger = function () {

    this.pivotView.renderRawData(this.dataController.getData().rawData);

};

LightPivotTable.prototype.init = function () {

    var _  = this;

    this.dataSource.getCurrentData(function (data) {
        _.dataController.setData(data);
    });

};