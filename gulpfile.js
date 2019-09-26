require('es6-promise').polyfill();
const gulp = require('gulp');
const uglify = require('gulp-uglify');
const ngAnnotate = require('gulp-ng-annotate');
const autoprefixer = require('gulp-autoprefixer');
const htmlmin = require('gulp-htmlmin');
const useref = require('gulp-useref');
const uglifycss = require('gulp-uglifycss');
const del = require('del');
const replace = require('gulp-replace');
const jsonminify = require('gulp-jsonminify');
const lazypipe = require('lazypipe');
const gulpif = require('gulp-if');
const swPrecache = require('sw-precache');
const path = require('path');
const revReplace = require('gulp-rev-replace');
const rev = require('gulp-rev');
const fs = require('fs');
const babel = require('gulp-babel');

// Config params
const outputDir = 'webapp';
const appDir = '.';
const revManifestPath = outputDir + '/rev-manifest.json';
const dynamicRevManifestPath = outputDir + '/d-rev-manifest.json';

const htmlminConfig = {
    collapseWhitespace: true,
    removeComments: true,
    removeCommentsFromCDATA: true,
    collapseBooleanAttributes: true,
    removeRedundantAttributes: true,
    removeIgnored: true
};

function replaceAll(str, search, replacement) {
    return str.replace(new RegExp(search, 'g'), replacement);
}

function getFolders(dir) {
    return fs.readdirSync(dir)
        .filter(function (file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
}

function jsChannel() {
    const manifest = gulp.src(revManifestPath);
    const dynamicRevManifestTxt = fs.readFileSync(require.resolve('./' + dynamicRevManifestPath), 'utf8');
    const placeholder = '{/* rev-manifest-placeholder: filled during build - DO NOT REMOVE */};';

    const channel = lazypipe()
        .pipe(ngAnnotate)
        .pipe(revReplace, {manifest: manifest})
        .pipe(gulpif, function (file) {
            return replaceAll(file.relative, '\\\\', '/') === 'common/services/cache/cache.js';
        }, replace(placeholder, dynamicRevManifestTxt))
        .pipe(babel, {
            plugins: ['angularjs-annotate'],
            presets: [['@babel/preset-env',
                {
                    targets: 'last 1 version, not dead, > 0.2%',
                    ignoreBrowserslistConfig: true
                }
            ]]
        })
        .pipe(uglify);

    return channel();

}


function cssChannel() {
    const channel = lazypipe()
        .pipe(autoprefixer, {
            browsers: ['> 1%'],
            cascade: false
        })
        .pipe(uglifycss, {
            'uglyComments': true
        });
    return channel();
}

gulp.task('html', function () {
    return gulp.src([
        appDir + '/*.html',
        appDir + '/**/*.html',
        '!' + appDir + '/index.html',
        '!' + appDir + '/node_modules/**/*.html'], {base: appDir})
        .pipe(htmlmin(htmlminConfig))
        .pipe(replace(appDir + '/', ''))
        .pipe(rev())
        .pipe(gulp.dest(outputDir))
        .pipe(rev.manifest(revManifestPath, {
            base: outputDir,
            merge: true
        }))
        .pipe(gulp.dest(outputDir));
});

gulp.task('index', function () {
    return gulp.src(appDir + '/index.html', {base: appDir})
        .pipe(replace('<meta name="robots" content="noindex,nofollow">', ''))
        .pipe(useref({
            noconcat: true,
            additionalStreams: gulp.src([appDir + '/*-sw.js'])
        }))
        .pipe(gulpif(file => file.history[0].endsWith(".js") && !file.history[0].endsWith('.min.js'), jsChannel()))
        .pipe(gulpif('*.css', cssChannel()))
        .pipe(gulpif('*.html', htmlmin(htmlminConfig)))
        .pipe(gulpif(['**/*', '!**/index.html', '!**/*-sw.js'], rev()))
        .pipe(gulp.dest(outputDir))
        .pipe(rev.manifest(revManifestPath, {
            base: outputDir,
            merge: true
        }))
        .pipe(gulp.dest(outputDir));

});

gulp.task("revReplace", function () {
    const manifest = gulp.src(revManifestPath);
    return gulp.src([outputDir + "/**/*.{js,html}"])
        .pipe(revReplace({manifest: manifest}))
        .pipe(gulp.dest(outputDir));
});

gulp.task('removeRevManifests', function () {
    return del([revManifestPath,
        dynamicRevManifestPath
    ], {
        force: true
    });
});

gulp.task('removePreviousBuild', function () {
    return del([
        outputDir + '/**/*',
        '!' + outputDir + '/WEB-INF',
        '!' + outputDir + '/WEB-INF/**/*'
    ], {
        force: true
    });
});

gulp.task('json', function () {
    return gulp.src([appDir + '/**/*.json',
        '!' + appDir + '/node_modules/**/*.json',
        '!' + appDir + '/package.json',
        '!' + appDir + '/package-lock.json',
        '!' + appDir + '/manifest.json'], {base: appDir})
        .pipe(jsonminify())
        .pipe(rev())
        .pipe(gulp.dest(outputDir))
        .pipe(rev.manifest(dynamicRevManifestPath, {
            base: outputDir,
            merge: true
        }))
        .pipe(gulp.dest(outputDir));
});

gulp.task('incorporateMedia', function () {
    return gulp.src([appDir + '/**/*.{mp3,mp4,webm,ogv}',
        '!' + appDir + '/node_modules/**/*.{mp3,mp4,webm,ogv}'], {base: appDir})
        .pipe(gulp.dest(outputDir));
});

gulp.task('incorporateManifest', function () {
    return gulp.src([appDir + '/manifest.json'], {base: appDir})
        .pipe(jsonminify())
        .pipe(rev())
        .pipe(gulp.dest(outputDir))
        .pipe(rev.manifest(revManifestPath, {
            base: outputDir,
            merge: true
        }))
        .pipe(gulp.dest(outputDir));
});

gulp.task('incorporateNgLocaleFiles', function () {
    return gulp.src(appDir + '/i18n/angular-locales/**/*')
        .pipe(replace(/(['"])use strict\1;?/, ''))
        .pipe(uglify())
        .pipe(gulp.dest(outputDir + '/i18n/angular-locales'));
});

gulp.task('incorporateFontFiles', function () {
    return gulp.src(appDir + '/common/fonts/**/*')
        .pipe(gulp.dest(outputDir + '/common/fonts'));
});

gulp.task('incorporateImages', function () {
    return gulp.src([appDir + '/**/*.{png,svg}',
        '!' + appDir + '/node_modules/**/*.{png,svg}',
        '!' + appDir + '/common/fonts/**/*.svg',
        '!' + appDir + '/favicon.png'], {base: appDir})
        .pipe(gulpif(['!sections/manage/session-chat/images/emoji/**/*.{png,svg}',
            '!' + appDir + '/common/images/app-icons/**/*.png'], rev()))
        .pipe(gulp.dest(outputDir))
        .pipe(rev.manifest(dynamicRevManifestPath, {
            base: outputDir,
            merge: true
        }))
        .pipe(gulp.dest(outputDir));
});

gulp.task('incorporateFavicon', function () {
    return gulp.src([appDir + '/favicon.png'], {base: appDir})
        .pipe(rev())
        .pipe(gulp.dest(outputDir))
        .pipe(rev.manifest(revManifestPath, {
            base: outputDir,
            merge: true
        }))
        .pipe(gulp.dest(outputDir));
});

gulp.task('generateCacheServiceWorker', function (callback) {
    let staticFileGlobs = [outputDir + '/**/*.{json,js,html,css,mp3,otf,eot,ttf,woff,woff2}'];

    // Not caching .png: if service workers are supported for sure svg images also are.
    const common = getFolders(outputDir + '/common').filter(function (folder) {
        return folder !== 'app-icons'
    });
    staticFileGlobs = staticFileGlobs.concat(common.map(function (folder) {
        return outputDir + '/common/' + folder + '/**/*.svg';
    }));
    const sections = getFolders(outputDir + '/sections').filter(function (section) {
        return section !== 'manage'
    });
    staticFileGlobs = staticFileGlobs.concat(sections.map(function (section) {
        return outputDir + '/sections/' + section + '/**/*.svg';
    }));
    const manageSectionFolders = getFolders(outputDir + '/sections/manage').filter(function (folder) {
        return folder !== 'session-chat';
    });
    staticFileGlobs = staticFileGlobs.concat(manageSectionFolders.map(function (folder) {
        return outputDir + '/sections/manage/' + folder + '/**/*.svg';
    }));

    const config = {
        cacheId: "knowhub",
        handleFetch: true,
        ignoreUrlParametersMatching: [/./],
        dontCacheBustUrlsMatching: /^((?!index\.html).)*$/,
        staticFileGlobs: staticFileGlobs,
        stripPrefix: outputDir + '/',
        runtimeCaching: [{
            urlPattern: /\/images\/emoji\//,
            handler: 'cacheFirst'
        }
        ]
    };
    swPrecache.write(path.join(outputDir, 'cache-sw.js'), config, callback);
});

exports.build = gulp.series('removePreviousBuild', 'incorporateFavicon', 'incorporateImages', 'json', 'incorporateManifest', 'incorporateMedia', 'incorporateNgLocaleFiles', 'incorporateFontFiles', 'html', 'index', 'revReplace', 'removeRevManifests', 'generateCacheServiceWorker');