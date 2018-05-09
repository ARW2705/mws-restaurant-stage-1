'use strict';

const gulp = require('gulp');
const rename = require('gulp-rename');
const imageResize = require('gulp-image-resize');
const clean = require('gulp-clean');

const paths = {
  images: {
    src: 'img/*',
    dest: 'img/sizes/'
  }
};

gulp.task('clean-images', () => {
  console.log('Cleaning old files');
  return gulp.src('img/sizes/**/*', {read: false})
    .pipe(clean());
});

// TODO: prevent gulp from adding uneccessary folders
gulp.task('minifyImages', ['clean-images'], () => {
  console.log('Running gulp-imagemin');
  gulp.src(paths.images.src)
    .pipe(imageResize({
      percentage: 60,
      imageMagick: true
    }))
    .pipe(rename(path => path.basename = 'sm-' + path.basename))
    .pipe(gulp.dest(paths.images.dest));
});

const gulpTaskList = ['minifyImages'];

gulp.task('default', gulpTaskList, () => {
  console.log('Gulp tasks completed');
});
