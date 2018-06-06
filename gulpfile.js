/*eslint-env node */

'use strict';

const gulp = require('gulp');
const rename = require('gulp-rename');
const imageResize = require('gulp-image-resize');
const imagemin = require('gulp-imagemin');
const clean = require('gulp-clean');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');

const paths = {
  css: {
    src: 'css/*',
    dest: 'dist/css/'
  },
  images: {
    src: 'img/*.jpg',
    dest: 'dist/img/sizes/'
  },
  icons: {
    src: 'img/icons/*.png',
    dest: 'dist/img/icons/'
  },
  sw: {
    src: './sw.js',
    dest: 'dist/'
  },
  manifest: {
    src: './manifest.json',
    dest: 'dist/'
  },
  js: {
    lintsrc: 'js/**/*.js',
    concatsrc: [
      'js/idb.js',
      'js/dbhelper.js'
    ],
    src: [
      'js/main.js',
      'js/restaurant_info.js',
      'js/register-sw.js'
    ],
    dest: 'dist/js/'
  },
  html: {
    src: './*.html',
    dest: 'dist/'
  }
};

gulp.task('copy-html', () => {
  console.log('Moving HTML to dist directory');
  gulp.src(paths.html.src)
    .pipe(gulp.dest(paths.html.dest));
});

gulp.task('copy-icons', () => {
  console.log('Moving icons to dist directory');
  gulp.src(paths.icons.src)
    .pipe(gulp.dest(paths.icons.dest));
});

gulp.task('styles', () => {
  console.log('Prefixing css');
  gulp.src(paths.css.src)
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.css.dest))
    .pipe(browserSync.stream());
})

gulp.task('clean-images', () => {
  console.log('Cleaning old files');
  gulp.src(paths.images.dest, {read: false})
    .pipe(clean());
});

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

gulp.task('copy-private-scripts', () => {
  gulp.src(paths.js.src)
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(gulp.dest(paths.js.dest));
});

gulp.task('copy-sw', () => {
  gulp.src(paths.sw.src)
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(gulp.dest(paths.sw.dest));
});

gulp.task('copy-manifest', () => {
  gulp.src(paths.manifest.src)
    .pipe(gulp.dest(paths.manifest.dest));
});

gulp.task('concat-common-scripts', () => {
  gulp.src(paths.js.concatsrc)
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(concat('index.js'))
    .pipe(gulp.dest(paths.js.dest));
});

gulp.task('lint', () => {
	gulp.src(paths.js.lintsrc)
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failOnError());
});

const gulpTaskList = [
  'copy-html',
  'copy-icons',
  'styles',
  'resizeImages',
  'concat-common-scripts',
  'copy-private-scripts',
  'copy-sw',
  'copy-manifest'
];

gulp.task('default', gulpTaskList, () => {
  gulp.watch('css/**/*.css', ['styles']);
  gulp.watch('js/**/*.js', ['lint']);
  gulp.watch('/index.html', ['copy-html']);
  gulp.watch('./dist/index.html').on('change', browserSync.reload);

  browserSync.init({
    server: './dist'
  });
});
