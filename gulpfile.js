'user strict';
var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var concatCss = require('gulp-concat-css');
var minifyCss = require('gulp-minify-css');
var jade = require('gulp-jade');
// var livereload = require('gulp-livereload');
// var connect = require('gulp-connect');
var clean = require('gulp-clean');
var spritesmith = require('gulp.spritesmith');
var merge = require('merge-stream');
var data = require('gulp-data');
var fs = require('fs');
var browserSync = require('browser-sync');
var uglify =require('gulp-uglify');
var usemin = require('gulp-usemin');
var minifyHtml = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var rev = require('gulp-rev');
var path = require('path');

var serverSetting = {
  host: 'localhost',
  port: '8001',
  root: "./build",
  livereload:true
}

var data_src_path = "./src/data/";

var langs=[];

// movie lib from src to build
gulp.task('compile-lib',function(){
  gulp.src('./src/lib/**/*')
  .pipe(gulp.dest('./build/lib'));
});

// movie js
gulp.task('compile-js',function(){
  gulp.src('./src/js/**/*')
  .pipe(gulp.dest('./build/js'));
});
// pre compile sass
gulp.task('compile-sass',function(){
  gulp.src('./src/sass/**/*.scss')
    .pipe(sass.sync().on('error',sass.logError))
    .pipe(autoprefixer({
      browsers:['last 20 versions', 'Firefox ESR', 'Opera 12.1']
    }))
    .pipe(gulp.dest('./build/css'))
    // .pipe(connect.reload());
});

// gulp.task('compile-jade',function(){
//   gulp.src('./src/jade/**/*.jade')
//     // .pipe(data(function(file){
//     //   return require('./src/data/data.json');
//     // }))
//     .pipe(jade(
//       {
//         data: function(){
//           if(fs.readFileSync('./src/data/data.json', { encoding: 'utf8' })){
//             return JSON.parse( fs.readFileSync('./src/data/data.json', { encoding: 'utf8' }) );
//           }else{
//             return {};
//           }
//
//         }
//       }
//     ))
//     .pipe(gulp.dest('./build/'))
//     // .pipe(connect.reload());
// });

gulp.task('compile-jade-by-lang',['clear-tmp'],function(){
  // fs.readdir(data_src_path,function(err, files){
    // if(err){
    //   return false;
    // }else{
    //   langs=[];
    //   for(var index in files){
    //     if(fs.lstatSync(data_src_path+files[index]).isDirectory()){
    //       langs.push(files[index]);
    //     }
    //   }
    //
    //   for(var index in langs){
        gulp.src(['./src/jade/**/*.jade','!./src/jade/layout/**/*.jade'])
          .pipe(data(function(file){
            var paths= file.path.split(path.sep);
            var paths=paths[paths.length-2];
            // return require('./src/data/'+paths+'/data.json');
            return JSON.parse( fs.readFileSync('./src/data/'+paths+'/data.json', { encoding: 'utf8' }) )
          }))
          .pipe(jade(
            {
              pretty: true
              //data: JSON.parse( fs.readFileSync('./src/data/'+langs[index]+'/data.json', { encoding: 'utf8' }) )
            }
          ).on('error', function(err) {
                  console.log(err);
            }))
          .pipe(gulp.dest('./build/'))
      // }
      // connect.reload();

  //   }
  // });
});
// gulp.task('usemin', function () {
//   return gulp.src('./.tmp/**/*.html')
//       .pipe(usemin({
//         css: ['concat'],
//         js: [rev()],
//         assetsDir:"./build"
//       }))
//       .pipe(gulp.dest('./build/'));
// });
// gulp.task('compile-html',['compile-jade-by-lang'], function () {
//     var assets = useref.assets({searchPath:['build']});
//
//     return gulp.src('./tmp/**/*.html')
//         .pipe(htmlreplace({
//             'css': '../css/combined.css',
//             'js': '../js/combined.js'
//         }))
//         .pipe(gulp.dest('./build/'));
// });

gulp.task('create-sprite',function(){
  var spriteData = gulp.src('./src/img/sprite/*.png').pipe(spritesmith({
   imgName: 'sprite.png',
   cssName: '_sprite.scss',
   cssRetinaSpritesheetName: '_sprite@2x.scss',
   //retinaSrcFilter: './src/img/sprite/*2x.png',
   //retinaImgName: 'sprite@2x.png',
   padding: 10,
   imgPath:'../img/sprite.png',
   retinaImgPath:'../img/sprite@2x.png'
  //  cssTemplate: 'handlebarsStr.css.handlebars'
 }));
 var imgStream = spriteData.img
    .pipe(gulp.dest('./src/img/'));

    var retinaImgStream = spriteData.img
       .pipe(gulp.dest('./src/img/'));

  // Pipe CSS stream through CSS optimizer and onto disk
  var cssStream = spriteData.css
    .pipe(gulp.dest('./src/sass/'));

  // Return a merged stream to handle both `end` events
  return merge(imgStream, cssStream,retinaImgStream);
});

gulp.task('move-img',['create-sprite'],function(){
  gulp.src('./src/img/*.{png,jpg}')
    .pipe(gulp.dest('./build/img/'))

});

gulp.task('move-font',function(){
  gulp.src('./src/font/**/*')
  .pipe(gulp.dest('./build/font'))
});

gulp.task('move-css',function(){
  gulp.src('./src/sass/libs/*.css')
  .pipe(gulp.dest('./build/css/libs'))
});


gulp.task('build-sass',['compile-sass'],function(){
  gulp.src('./build/css/**/*.css')
    .pipe(concatCss("index.css"))
    .pipe(minifyCss({compatibility: 'ie8'}))
    .pipe(gulp.dest('./package/css/'))

});

gulp.task('build-jade',['compile-jade-by-lang'],function(){
  gulp.src('./build/**/*.html')
  .pipe(gulp.dest('./package/'))
});
gulp.task('build-lib',function(){
  gulp.src('./build/lib/**/*')
  .pipe(gulp.dest('./package/lib'))

});

gulp.task('build-img',function(){
  gulp.src('./build/img/**/*')
  .pipe(gulp.dest('./package/img'))
});


gulp.task('build-font',function(){
  gulp.src('./build/font/**/*')
  .pipe(gulp.dest('./package/font'))
});

gulp.task('build-js',function(){
  gulp.src('./build/js/**/*.js')
  .pipe(uglify())
  .pipe(gulp.dest('./package/js'))
});

gulp.task('sass:watch', function () {
  gulp.watch(['./src/sass/**/*.scss','!./src/sass/libs/**/*.scss'], ['compile-sass']);
});

gulp.task('jade:watch', function () {

  gulp.watch('./src/jade/**/*.jade', ['compile-jade-by-lang']);
});

gulp.task('lib:watch', function () {

  gulp.watch('./src/lib/**/*', ['compile-lib']);
});
gulp.task('sprite:watch', function () {

  gulp.watch('./src/img/sprite/*', ['create-sprite','move-img']);
});

gulp.task('image:watch', function () {

  gulp.watch('./src/img/*', ['move-img']);
});

gulp.task('data:watch', function () {

  gulp.watch('./src/data/**/data.json', ['compile-jade-by-lang']);
});

gulp.task('js:watch', function () {

  gulp.watch('./src/js/**/*.js', ['compile-js']);
});


// gulp.task('webserver', function() {
//   connect.server(serverSetting);
// });

gulp.task('webserver', function () {
   var files = [
      './build/**/*.{html,htm,css,js,png,jpg,jpeg}',

   ];

   browserSync.init(files, {
      server: {
         baseDir: './build',
         directory: false
      }
   });
});
gulp.task('clear-tmp',function(){
  return gulp.src('./.tmp', {read: false})
    .pipe(clean());
});
gulp.task('clear-compile',function(){
  return gulp.src('./build', {read: false})
    .pipe(clean());
});

gulp.task('clear-build',function(){
  return gulp.src('./package', {read: false})
    .pipe(clean());
});

gulp.task('compile',['compile-lib','move-img','move-font','compile-sass','compile-js','compile-jade-by-lang',"move-css"]);

gulp.task('watch',['compile','sass:watch','jade:watch','lib:watch','sprite:watch','data:watch','image:watch','js:watch']);

gulp.task('server',['compile','webserver','watch']);

gulp.task('clear',['clear-build','clear-compile','clear-tmp']);
gulp.task('build',['build-img','build-jade','build-font','build-lib','build-sass','build-js']);
