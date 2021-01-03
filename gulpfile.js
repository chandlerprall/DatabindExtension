const path = require('path');
const gulp = require('gulp');
const bro = require('gulp-bro');

gulp.task('browserify', function() {
  return gulp.src(path.join(__dirname, '/src/DatabindExtension.js')).
      pipe(bro({syntax: true, wrap: true, standalone: 'DatabindExtension'})).
      pipe(gulp.dest(path.join(__dirname, '/dist/')));
});