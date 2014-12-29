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
    pkg = require("./package.json");

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
        .pipe(wrap("LightPivotTable = (function(){<%= contents %> return LightPivotTable;}());"))
        .pipe(uglify({
            output: {
                ascii_only: true
            }
        }))
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest("build/js/"));
});

gulp.task("gatherCSS", ["clean"], function () {
    return gulp.src("source/css/*.css")
        .pipe(concat("lightPivotTable.css"))
        .pipe(minifyCSS())
        .pipe(gulp.dest("build/css/"));
});

gulp.task("addExample", ["clean"], function () {
    gulp.src("example/index.html")
        .pipe(htmlReplace({
            "css": "../css/lightPivotTable.css",
            "js": "../js/lightPivotTable.js"
        }))
        .pipe(gulp.dest("build/example/"));
});

gulp.task("exportCacheXML", ["clean", "gatherScripts", "gatherCSS"], function () {
    gulp.src("export/LightPivotTable.xml")
        .pipe(replace(/\{\{replace:css}}/, fs.readFileSync("build/css/lightPivotTable.css")))
        .pipe(replace(/\{\{replace:js}}/, fs.readFileSync("build/js/lightPivotTable.js")))
        .pipe(gulp.dest("build/"));
});

gulp.task("copyLICENSE", ["clean"], function (){
    gulp.src("LICENSE")
        .pipe(gulp.dest("build/"));
});

gulp.task("copyREADME", ["clean"], function (){
    gulp.src("readme.md")
        .pipe(gulp.dest("build/"));
});

gulp.task("default", [
    "clean", "gatherScripts", "gatherCSS", "addExample", "copyLICENSE", "copyREADME",
    "exportCacheXML"
]);