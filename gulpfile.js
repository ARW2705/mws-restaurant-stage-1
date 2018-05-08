'use strict';

const gulp = require('gulp');
const concat = require('gulp-concat');

const paths = {
  styles: {
    src: 'css/**/*.css',
    dest: 'assets/styles/'
  },
  scripts: {
    src: 'js/**/*.js',
    dest: 'assets/scripts/'
  }
};

gulp.task('concatScripts', () => {
  console.log('Running gulp-concat');
  gulp
    .src([
      'js/dbhelper.js',
      'js/restaurant_info.js',
      'js/main.js'
    ])
    .pipe(concat('app.js'))
    .pipe(gulp.dest('js'));
});

gulp.task('default', ['concatScripts'], () => {
  console.log('Running gulp default');
});
