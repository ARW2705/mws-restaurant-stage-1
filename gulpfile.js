'use strict';

const gulp = require('gulp');
const rename = require('gulp-rename');
const imageResize = require('gulp-image-resize');

const paths = {
  styles: {
    src: 'css/**/*.css',
    dest: 'assets/styles/'
  },
  images: {
    src: 'img/**/*',
    dest: {
      small: 'assets/images/sm/',
      medium: 'assets/images/md/',
      large: 'assets/images/lg/',
      x2: 'assets/images/x2/'
    }
  }
};

gulp.task('minifyImages', () => {
  console.log('Running gulp-imagemin');
  const imagesToResize = gulp.src(paths.images.src);
  imagesToResize
    .pipe(imageResize({
      percentage: 30,
      imageMagick: true
    }))
    .pipe(rename(function(path) { path.basename += '-sm'; }))
    .pipe(gulp.dest(paths.images.dest.small));

  imagesToResize
    .pipe(imageResize({
      percentage: 40,
      imageMagick: true
    }))
    .pipe(rename(path => path.basename += '-md'))
    .pipe(gulp.dest(paths.images.dest.medium));

  imagesToResize
    .pipe(imageResize({
      percentage: 50,
      imageMagick: true
    }))
    .pipe(rename(path => path.basename += '-lg'))
    .pipe(gulp.dest(paths.images.dest.large));

    imagesToResize
      .pipe(imageResize({
        percentage: 100,
        imageMagick: true
      }))
      .pipe(rename(path => path.basename += '-x2'))
      .pipe(gulp.dest(paths.images.dest.x2));
});

const gulpTaskList = ['minifyImages'];

gulp.task('default', gulpTaskList, () => {
  console.log('Gulp tasks completed');
});
