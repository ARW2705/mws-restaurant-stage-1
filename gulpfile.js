'use strict';

const gulp = require('gulp');
const clean = require('gulp-clean');
const imageResize = require('gulp-image-resize');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const merge = require('merge-stream');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const browserSync = require('browser-sync').create();

/**
 * File paths
 */

const paths = {
  build: {
    dest: 'dist'
  },
  html: {
    src: '*.html'
  },
  css: {
    src: 'css/*.css',
    dest: 'dist/css/'
  },
  image: {
    src: 'img/*.jpg',
    dest: 'dist/img/sizes/'
  },
  icon: {
    src: 'img/icons/*',
    dest: 'dist/img/icons/'
  },
  map: {
    src: 'img/map/*',
    dest: 'dist/img/map/'
  },
  tmp: {
    src: 'tmp',
    base: 'tmp/base/',
    mod: 'tmp/mod/'
  },
  script: {
    src: 'js/*.js',
    dest: 'dist/js/'
  },
  sw: {
    worker: 'sw.js',
    manifest: 'manifest.json'
  }
};


/**
 * Task list
 */

const tasks = [
  'clean-dist',
  'clean-temp',
  'html',
  'styles',
  'process-images',
  'copy-icons',
  'copy-map',
  'scripts',
  'service-worker',
  'manifest'
];


/**
 * Clean up tasks
 */

gulp.task('clean-dist', () => {
  return gulp.src(paths.build.dest)
    .pipe(clean());
});

gulp.task('clean-temp', () => {
  return gulp.src(paths.tmp.src)
    .pipe(clean());
});


/**
 * HTML tasks
 */

gulp.task('html', ['clean-dist'], () => {
  return gulp.src(paths.html.src)
    .pipe(gulp.dest(paths.build.dest));
});

gulp.task('update-html', () => {
  return gulp.src(paths.html.src)
    .pipe(gulp.dest(paths.build.dest));
});


/**
 * CSS tasks
 */

gulp.task('styles', ['clean-dist'], () => {
  return gulp.src(paths.css.src)
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.css.dest))
    .pipe(browserSync.stream());
});


/**
 * Image tasks
 */

const imageResizeTasks = [];
const sizes = [100, 60, 45];
const fileNames = ['lg', 'md', 'sm'];

for (let i=0; i < 3; i++) {
  let imageResizeTask = `image-resize-${fileNames[i]}`;
  gulp.task(imageResizeTask, ['clean-temp'], () => {
    return gulp.src(paths.image.src)
      .pipe(imageResize({
        percentage: sizes[i],
        imageMagick: true
      }))
      .pipe(rename(path => path.basename = `${fileNames[i]}-${path.basename}`))
      .pipe(imagemin({progressive: true}))
      .pipe(gulp.dest(paths.tmp.base));
  });
  imageResizeTasks.push(imageResizeTask);
}

gulp.task('image-resize', imageResizeTasks);

gulp.task('jpg-to-webp', ['image-resize'], () => {
  return gulp.src(`${paths.tmp.base}/*.jpg`)
    .pipe(webp())
    .pipe(gulp.dest(paths.tmp.mod));
});

gulp.task('process-images', ['jpg-to-webp', 'clean-dist'], () => {
  return gulp.src([
      `${paths.tmp.base}*.jpg`,
      `${paths.tmp.mod}*.webp`
    ])
    .pipe(gulp.dest(paths.image.dest));
});

gulp.task('copy-icons', ['clean-dist'], () => {
  return gulp.src(paths.icon.src)
    .pipe(imagemin({progressive: true}))
    .pipe(gulp.dest(paths.icon.dest));
});

gulp.task('copy-map', ['clean-dist'], () => {
  return gulp.src(paths.map.src)
    .pipe(imagemin({progressive: true}))
    .pipe(gulp.dest(paths.map.dest));
});


/**
 * Script tasks
 */

gulp.task('scripts', ['clean-dist'], () => {
  gulp.src(paths.script.src)
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(uglify())
    .pipe(gulp.dest(paths.script.dest));
});

gulp.task('service-worker', ['clean-dist'], () => {
  gulp.src(paths.sw.worker)
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(uglify())
    .pipe(gulp.dest(paths.build.dest));
});

gulp.task('manifest', ['clean-dist'], () => {
  gulp.src(paths.sw.manifest)
    .pipe(gulp.dest(paths.build.dest));
});


/**
 * DEFAULT
 */
gulp.task('default', tasks, () => {
  gulp.watch('*.html', ['update-html']);
  gulp.watch('css/**/*.css', ['styles']);
  gulp.watch('dist/*.html').on('change', browserSync.reload);

  browserSync.init({
    server: 'dist'
  });
});
