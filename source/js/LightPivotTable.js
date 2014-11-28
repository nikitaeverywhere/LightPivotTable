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

/**
 * Performs resizing.
 */
LightPivotTable.prototype.updateSizes = function () {

    this.pivotView.updateSizes();

};

/**
 * Ability to set filter. Manual refresh is required.
 * Example: spec = "[DateOfSale].[Actual].[YearSold].&[2009]"; *.refresh();
 *
 * @param {string} spec - an MDX specification of the filter.
 */
LightPivotTable.prototype.setFilter = function (spec) {

    this.dataSource.setFilter(spec);

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

    // clone dataSource config object
    for (var i in _.CONFIG.dataSource) { ds[i] = _.CONFIG.dataSource[i]; }

    if (this.CONFIG.DrillDownExpression && this._dataSourcesStack.length < 2) {
        ds.basicMDX = this.mdxParser.customDrillDown(
            this.dataSource.BASIC_MDX, this.CONFIG.DrillDownExpression, filter
        ) || this.dataSource.BASIC_MDX;
    } else {
        ds.basicMDX = this.mdxParser.drillDown(this.dataSource.BASIC_MDX, filter) || this.dataSource.BASIC_MDX;
    }

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

/**
 * @param {string[]} [filters]
 */
LightPivotTable.prototype.showDrillThrough = function (filters) {

    var _ = this,
        ds = {};

    // clone dataSource config object
    for (var i in _.CONFIG.dataSource) { ds[i] = _.CONFIG.dataSource[i]; }
    ds.action = "MDXDrillthrough";
    if (filters instanceof Array) {
        console.log("BASIC MDX: " + this.dataSource.BASIC_MDX, "\n\nFILTERS: " + filters);
        ds.basicMDX = this.mdxParser.customDrillThrough(this.dataSource.BASIC_MDX, filters)
            || this.dataSource.basicMDX;
    } else {
        ds.basicMDX = this.dataSource.BASIC_MDX;
        ds.basicMDX = this.mdxParser.drillThrough(ds.basicMDX) || ds.basicMDX;
    }

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