//@ts-check
const gulp = require('gulp');
const ts = require('gulp-typescript');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const pump = require('pump');
const rename = require('gulp-rename');

const tsProject = ts.createProject('tsconfig.json');
const buildDir = './dist'

gulp.task('ts', function () {
    
       return gulp.src('./src/**/*.ts')
               .pipe(tsProject())
               .pipe(babel({
                 presets : ['babel-preset-env']
               }))
               .pipe(gulp.dest(buildDir));
});

gulp.task('tsmin', (cb) => {

    pump([
        gulp.src('./src/**/*.ts'),
        tsProject(),
        babel({
            presets : ['babel-preset-env']
          }),
        uglify(),
        rename({
            suffix: '-min'
        }),
        gulp.dest(buildDir)
    ],
    cb
  )

    // )
    // .pipe()
    // .pipe()
    // .pipe(rename({
    //     suffix: "-min"
    // }))
    // .pipe(gulp.dest(buildDir));
})