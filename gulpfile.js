const path = require('path');
const gulp = require('gulp');
const bro = require('gulp-bro');
const babelify = require('babelify');

gulp.task('browserify', function() {
  return gulp.src(path.join(__dirname, '/src/DatabindExtension.js')).
      pipe(bro({
        syntax: true, wrap: true, standalone: 'DatabindExtension', transform: [
          babelify.configure({'presets': [['@babel/preset-env', {'targets': '> 0.25%, not dead'}]]}),
        ],
      })).
      pipe(gulp.dest(path.join(__dirname, '/dist/')));
});