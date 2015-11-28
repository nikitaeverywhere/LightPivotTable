var gulp = require("gulp"),
    fs = require("fs"),
    clean = require("gulp-clean"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify"),
    wrap = require("gulp-wrap"),
    minifyCSS = require("gulp-minify-css"),
    htmlReplace = require("gulp-html-replace"),
    header = require("gulp-header"),
    replace = require("gulp-replace"),
    pkg = require("./package.json"),
    zip = require("gulp-zip"),
    rename = require("gulp-rename");

var banner = [
    "/** <%= pkg.name %>",
    " ** <%= pkg.description %>",
    " ** @author <%= pkg.author %>",
    " ** @version <%= pkg.version %>",
    " ** @license Apache 2.0",
    " ** @see https://github.com/ZitRos/LightPivotTable",
    " **/",
    ""
].join("\n");

gulp.task("clean", function () {
    return gulp.src("build", {read: false})
        .pipe(clean());
});

gulp.task("gatherScripts", ["clean"], function () {
    return gulp.src("source/js/*.js")
        .pipe(concat("lightPivotTable.js"))
        .pipe(replace(/\/\*\{\{replace:version}}\*\//, "\"" + pkg["version"] + "\""))
        .pipe(wrap("LightPivotTable = (function(){<%= contents %> return LightPivotTable;}());"))
        .pipe(uglify({
            output: {
                ascii_only: true,
                width: 25000,
                max_line_len: 25000
            }
        }))
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest("build/WEBModule/js/"));
});

gulp.task("gatherCSS", ["clean"], function () {
    return gulp.src("source/css/*.css")
        .pipe(concat("lightPivotTable.css"))
        .pipe(minifyCSS())
        .pipe(gulp.dest("build/WEBModule/css/"));
});

gulp.task("addExample", ["clean"], function () {
    return gulp.src("example/index.html")
        .pipe(htmlReplace({
            "css": "css/lightPivotTable.css",
            "js": "js/lightPivotTable.js"
        }))
        .pipe(gulp.dest("build/WEBModule/"));
});

gulp.task("copyLICENSE", ["clean"], function (){
    return gulp.src("LICENSE")
        .pipe(gulp.dest("build/"));
});

gulp.task("copyREADME", ["clean"], function (){
    return gulp.src("readme.md")
        .pipe(gulp.dest("build/"));
});

gulp.task("exportCacheXML", [
        "clean", "addExample", "gatherScripts", "gatherCSS", "copyLICENSE", "copyREADME"
    ], function () {
        return gulp.src("export/LightPivotTable-DeepSeePortlet.xml")
            .pipe(
                replace(/\{\{replace:css}}/,
                fs.readFileSync("build/WEBModule/css/lightPivotTable.css"))
            )
            .pipe(
                replace(/\{\{replace:js}}/,
                fs.readFileSync("build/WEBModule/js/lightPivotTable.js"))
            )
            .pipe(rename(function (path) { path.basename += "-v" + pkg["version"]; }))
            .pipe(gulp.dest("build/Caché"));
});

gulp.task("zipRelease", ["exportCacheXML"], function () {
    return gulp.src("build/**/*")
        .pipe(zip("LightPivotTable-v" + pkg["version"] + ".zip", {
            comment: "Light pivot table v" + pkg["version"] + " by Nikita Savchenko\n\n" +
            "+ WEBModule folder holds JS and CSS files to integrate Light pivot table to any WEB " +
            "application;\n" +
            "+ Cache folder holds XML file to import to InterSystems Cache.\n\n" +
            "NOTE: MDX2JSON must be installed and configured for InterSystems Cache.\nYou can " +
            "download and install it from here: https://github.com/intersystems-ru/Cache-MDX2JSON\n"
            + "\nFor further information about installation and information, check README.md file."
        }))
        .pipe(gulp.dest("build"));
});

gulp.task("desktop", ["default"], function () {
    return gulp.src("build/Caché/*")
        .pipe(gulp.dest("C:/Users/ZitRo/Desktop"));
});

gulp.task("default", [
    "clean", "gatherScripts", "gatherCSS", "addExample", "copyLICENSE", "copyREADME",
    "exportCacheXML", "zipRelease"
]);