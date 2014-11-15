var LightPivotTable = function (configuration) {

    var _ = this;

    if (typeof configuration !== "object") configuration = {};

    this._dataSourcesStack = [];

    this.CONFIG = configuration;

    this.mdxParser = new MDXParser();
    this.pivotView = new PivotView(this, configuration.container);
    this.dataSource = this.pushDataSource(configuration.dataSource);

    /**
     * @type {DataController}
     */
    this.dataController = new DataController(this, function () {
        _.dataChangeTrigger.call(_);
    });

    this.init();

};

/**
 * Load data again from actual data source and refresh table.
 */
LightPivotTable.prototype.refresh = function () {

    var _  = this;

    this.dataSource.getCurrentData(function (data) {
        if (_.dataController.isValidData(data)) {
            _.dataController.setData(data);
        } else {
            _.pivotView.displayMessage(data.error || "Invalid data to display.");
        }
    });

};

LightPivotTable.prototype.pushDataSource = function (config) {

    var newDataSource;

    this._dataSourcesStack.push(newDataSource = new DataSource(config));
    this.dataSource = newDataSource;

    return newDataSource;

};

LightPivotTable.prototype.popDataSource = function () {

    if (this._dataSourcesStack.length < 2) return;

    this._dataSourcesStack.pop();
    this.dataController.popData();

    this.dataSource = this._dataSourcesStack[this._dataSourcesStack.length - 1];

};

LightPivotTable.prototype.dataChangeTrigger = function () {

    this.pivotView.renderRawData(this.dataController.getData().rawData);

};

LightPivotTable.prototype.tryDrillDown = function (filter) {

    var _ = this,
        ds = {};

    // clone
    for (var i in _.CONFIG.dataSource) { ds[i] = _.CONFIG.dataSource[i]; }
    ds.basicMDX = this.mdxParser.drillDown(ds.basicMDX, filter) || ds.basicMDX;

    this.pushDataSource(ds);

    this.dataSource.getCurrentData(function (data) {
        if (_.dataController.isValidData(data) && data.dataArray.length > 0) {
            _.pivotView.pushTable();
            _.dataController.pushData();
            _.dataController.setData(data);
        } else {
            _.popDataSource();
        }
    });

};

LightPivotTable.prototype.init = function () {

    this.refresh();

};