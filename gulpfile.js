var gulp = require('gulp');
var uglifycss = require('gulp-uglifycss');
 
gulp.task('css', function () {
  gulp.src('./src/*.css')
    .pipe(uglifycss({
      "maxLineLen": 80,
      "uglyComments": true
    }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['css']);