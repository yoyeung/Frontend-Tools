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

gulp.task('compile-jade-by-lang',function(){
  fs.readdir(data_src_path,function(err, files){
    if(err){
      return false;
    }else{

      for(var index in files){
        if(fs.lstatSync(data_src_path+files[index]).isDirectory()){
          langs.push(files[index]);
        }
      }
      console.log("langs "+langs);
      for(var index in langs){
        gulp.src('./src/jade/**/*.jade')
          // .pipe(data(function(file){
          //   return require('./src/data/data.json');
          // }))
          .pipe(jade(
            {
              data: JSON.parse( fs.readFileSync('./src/data/'+langs[index]+'/data.json', { encoding: 'utf8' }) )
            }
          ))
          .pipe(gulp.dest('./build/'+langs[index]))
      }
      // connect.reload();

    }
  });


});

gulp.task('create-sprite',function(){
  var spriteData = gulp.src('./src/img/sprite/*.png').pipe(spritesmith({
   imgName: 'sprite.png',
   cssName: '_sprite.scss',
   cssRetinaSpritesheetName: '_sprite@2x.scss',
   retinaSrcFilter: './src/img/sprite/*2x.png',
   retinaImgName: 'sprite@2x.png',
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


gulp.task('build-sass',['compile-sass'],function(){
  gulp.src('./build/css/**/*.css')
    .pipe(concatCss("style.css"))
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

gulp.task('sass:watch', function () {
  gulp.watch('./src/sass/**/*.scss', ['compile-sass']);
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

gulp.task('data:watch', function () {

  gulp.watch('./src/data/**/data.json', ['compile-jade-by-lang']);
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
         baseDir: './build'
      }
   });
});

gulp.task('clear-compile',function(){
  return gulp.src('./build', {read: false})
    .pipe(clean());
});

gulp.task('clear-build',function(){
  return gulp.src('./package', {read: false})
    .pipe(clean());
});

gulp.task('compile',['compile-jade-by-lang','compile-lib','move-img','compile-sass']);

gulp.task('watch',['compile','sass:watch','jade:watch','lib:watch','sprite:watch','data:watch']);

gulp.task('server',['compile','webserver','watch']);

gulp.task('clear-all',['clear-build','clear-compile']);
gulp.task('build',['build-img','build-jade','build-lib','build-sass']);
