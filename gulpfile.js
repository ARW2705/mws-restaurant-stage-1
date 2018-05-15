'use strict';

const gulp = require('gulp');
const rename = require('gulp-rename');
const imageResize = require('gulp-image-resize');
const imagemin = require('gulp-imagemin');
const clean = require('gulp-clean');

const paths = {
  images: {
    src: 'img/*',
    dest: 'img/sizes/'
  }
};

gulp.task('clean-images', () => {
  console.log('Cleaning old files');
  return gulp.src(paths.images.dest, {read: false})
    .pipe(clean());
});

// TODO: prevent gulp from adding uneccessary folders
gulp.task('resizeImages', ['clean-images'], () => {
  console.log('Running gulp-image-resize');
  const imagesToResize = gulp.src(paths.images.src);
  imagesToResize
    .pipe(imageResize({
      percentage: 100,
      imageMagick: true
    }))
    .pipe(rename(path => path.basename = 'lg-' + path.basename))
    .pipe(imagemin({progressive: true}))
    .pipe(gulp.dest(paths.images.dest));

  imagesToResize
    .pipe(imageResize({
      percentage: 60,
      imageMagick: true
    }))
    .pipe(rename(path => path.basename = 'md-' + path.basename))
    .pipe(imagemin({progressive: true}))
    .pipe(gulp.dest(paths.images.dest));

  imagesToResize
    .pipe(imageResize({
      percentage: 45,
      imageMagick: true
    }))
    .pipe(rename(path => path.basename = 'sm-' + path.basename))
    .pipe(imagemin({progressive: true}))
    .pipe(gulp.dest(paths.images.dest));
});

const gulpTaskList = ['resizeImages'];

gulp.task('default', gulpTaskList, () => {
  console.log('Gulp tasks completed');
});
