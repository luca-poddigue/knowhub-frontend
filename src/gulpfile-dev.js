'use strict';

require('es6-promise').polyfill();
const gulp = require('gulp');
const Server = require('karma').Server;
const path = require('path');
const gulpInject = require('gulp-inject');
const google = require('googleapis');
const drive = google.drive('v3');
const fs = require('file-system');
const svgSprite = require("gulp-svg-sprites");
const svg2png = require('gulp-svg2png');
const filter = require('gulp-filter');
const merge = require('merge-stream');

const appDir = '.';

const driveServiceAccountEmail = 'docs-embedder@knowhub-test.iam.gserviceaccount.com';
const driveServiceAccountPrivateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCh4jjzlEfMNiAF\nklp+fWy6gdF+XlwIfFsVVuZYqrxOy4oYds8FEkoTlAdp4CfqZVjaVvg7vynk1qxJ\nSrFsvnY+WQ8RsIF9rGlB+eunqvNbeJLlBYO9pBS+upK2o26W9wTp5p7QfQPmxC69\nP+SKF/39WxftWIG+3ueMCt+egp3AvDO2tptUTmk/WC6QmnrOgcowrX2NMA5a4ZKV\npTRu043tTWu8sRTWbBsEJNpTKp5X4ueVTy2JYprNu0i74tChbASalr+wP9eY5FDO\nXpOFfn6yWMvxaC3s6cAJuEL320fyjrm8fJ5PqLtU08UZz7k6P1IfZ64qM3cmwwjG\nw+rbqhDlAgMBAAECggEACrJilgHNzroi2otlrGcISLisSZ/dj/f7osjXtrMtdz1u\n1hf/rPOc7ndBGCdmK9BfkyndBEGo+ISQ5NTpLWjWcl87Ji2WGOJMID5t6mna48fv\nWO/I2T6e2k2ExUm+VH5lFjmVc+xW1ihPeFTg+pkEQPoEdjv7csvS3AeZ6CT0XJhY\nHd34ctugc3YZ/PYn1Pa6yK46ZpdInSOX0F3I9QkBz5cSE+2mi+TXkop3+WxA6a9C\nD4WNJ6qgpbzewPHVTfwfeG2dCgCA8COaWwZJhusWmIQXkNLhzhUJ1HKBx0VQ7p2k\ntcvZLhGG0PdDT6ujtYjChYRteA1VF/VMyiy9CzpOMQKBgQDR8ZU5Pkb3S38TWZ7C\nkKgAU7qKWofjiRAFfX8MBRe1sWQm0pWOoD82iCXRdm9mUgbgnuN2dQvPmfCzQNIo\nkrYbWN0NlnKz8FTzcjGADZ8Fcxi7bQ0nDdnAfJUpBBQldUT6PEj5X7r4i2HTCEPf\nJ93XGM9nyPYo9bpMMsYp5yDoPQKBgQDFZZgv0YJ51tlJYVxTpj7F2TlaEdY8Whjo\nC8m9uFR9fGI9QlLyVNVYJqGDTAhQtRFk4XUpx8SF9NUMQT6xWW/coe5XDlSTnWoQ\nJcgD0e2/y5vs4BOT+3oOibfSpHf/HN25gQ4yK1PjzarMYuRqAgmDZ166CmkSaJRa\nW+sekRUtyQKBgQCxm7IFSmVZAlqP8Sp5KU2ncS4Hq8z4NlUCgAfCEHDdeiPjIBX8\nIh84L/fme06E/nHpByIhbaW/TFkwHG9ueadr/UKNIzEIfxIvHfU4gs18G8HZlckh\nt/r2d67skxHEGrBvDh8iMNWJPMlWcdCRcjWfqdKU15NAVZn0qqOwgWL6dQKBgQCL\nMKwza8RZLYpiF+kGgv9Ye2fZfyJVxCIz3bwPr17EbWTIVXAvuGoHkpXpA0AJyOPP\nArufDmIhIxbnYUpXu/0I0pZBhLVWsXUMldeH+gtvZp84VHj5rCXRAoNAYQDMPwqJ\nt9rOvYaV53w8Sq9NoMocglNlU9nrRRr27EHKd/s7IQKBgCKUscZgLPcOJMBieH02\nCDRKekYHmtCIh2t5tmo+SQuAMBvIiJ0vabKLoMSuNkliSpdKBTNohZIOQoAPZJ/5\nCDdb0XjqenUtM3xcCarnd2xxs2tR7DQyzJyRdpUNTdlDDG1mihiT9hXI2RobzYSW\n+IDcjK3F9AA+gMW9s/CWYMkV\n-----END PRIVATE KEY-----\n";
const driveScopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly'
];


// INJECT

gulp.task('appInject', function () {
    const target = gulp.src(appDir + '/index.html');
    const sources = gulp.src([appDir + '/*_module.js',
        appDir + '/**/*.{js,css}',
        '!' + appDir + '/node_modules/**/*',
        '!' + appDir + '/node/**/*',
        '!' + appDir + '/**/*-sw.js',
        '!' + appDir + '/**/gulpfile*.js',
        '!' + appDir + '/i18n/**/*',
        '!' + appDir + '/*_test.js',
        '!' + appDir + '/**/*_test.js',
        '!' + appDir + '/common/css/bootstrap.css'], {
        read: false
    });

    return target.pipe(gulpInject(sources, {
        relative: true
    }))
        .pipe(gulp.dest(appDir));
});

gulp.task('specRunnerInject', function () {
    const target = gulp.src('SpecRunner.html');
    const sources = gulp.src([appDir + '/*_module.js',
        appDir + '/**/*.{js,css}',
        '!' + appDir + '/node_modules/**/*',
        '!' + appDir + '/node/**/*',
        '!' + appDir + '/**/gulpfile*.js',
        '!' + appDir + '/i18n/**/*'], {
        read: false
    });
    return target.pipe(gulpInject(sources, {
        relative: true
    }))
        .pipe(gulp.dest('./'));
});

// END INJECT


// KARMA
/**
 * Run test once and exit
 */
gulp.task('test', function (done) {
    new Server({
        configFile: path.resolve('karma.conf.js'),
        singleRun: true
    }, done).start();
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tdd', function (done) {
    new Server({
        configFile: path.resolve('karma.conf.js'),
    }, done).start();
});

// END KARMA

gulp.task('generateEmojiSprites', function () {
    const emojiDir = 'support-files/media/images/emoji';
    const targetRelDir = 'sections/manage/session-chat/images/emoji';
    const targetDir = appDir + '/' + targetRelDir;
    const folders = getFolders(emojiDir);
    const config = {
        common: 'emoji',
        preview: false,
        selector: "emoji-%f",
        cssFile: 'sprite.css',
        svg: {
            sprite: 'sprite.svg'
        },
        baseSize: 28,
        templates: {
            css: require("fs").readFileSync(emojiDir + "/template.css", "utf-8")
        }
    };

    const tasks = folders.map(function (emojiCategory) {
        config.emojiCategory = emojiCategory;
        config.svgPath = '/' + targetRelDir + '/' + emojiCategory + '/sprite.svg';
        config.pngPath = '/' + targetRelDir + '/' + emojiCategory + '/sprite.png';
        return gulp.src(path.join(emojiDir, emojiCategory, '*.svg'))
            .pipe(svgSprite(config))
            .pipe(gulp.dest(targetDir + '/' + emojiCategory))
            .pipe(filter("**/*.svg"))
            .pipe(svg2png({width: 60}))
            .pipe(gulp.dest(targetDir + '/' + emojiCategory));
    });

    return merge(tasks);
});

function getFolders(dir) {
    return fs.readdirSync(dir)
        .filter(function (file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
}

gulp.task('docs-embedder', function (done) {
    const docMaps = [
        {
            targetPath: appDir + '/i18n/terms-of-service/',
            docs: {
                en_us: [{
                    docId: '1mzt4EuvimSK6c70WE9A3G9_X9JekfIVU2fwPogINzww',
                    key: "TERMS_OF_SERVICE"
                }],
                it_it: [{
                    docId: '1D2abriQ5vWtU_wix1MAk9GGtRfmNQSveaEA5ONN1FzM',
                    key: "TERMS_OF_SERVICE"
                }],
            }
        },
        {
            targetPath: appDir + '/i18n/privacy/',
            docs: {
                en_us: [{
                    docId: '1Z3FJzba2zdJJoiZU1d-mzYItMtapOCgymr_m0OgAz8Q',
                    key: "PRIVACY_POLICY"
                },
                    {
                        docId: '1hbbgJB6fP_-clifulclOJSdNjgXLSNaPDM-bQYa_0hY',
                        key: "COOKIES_POLICY"
                    }],
                it_it: [{
                    docId: '15LmcAPTpL6wAXlHpCQpydEnadOwBI6Ea_E3EniSVs_E',
                    key: "PRIVACY_POLICY"
                },
                    {
                        docId: '1dcBv2I7w-2KfXc90upZZ9tjGcocsGMSIKg3hzmf_NGk',
                        key: "COOKIES_POLICY"
                    }],
            }
        },
        {
            targetPath: appDir + '/i18n/guide/',
            docs: {
                en_us: [{
                    docId: '1fwx34z0V3n2U4ifBUUhZTgESHZuaM7hFC23yMakpQ3I',
                    key: "GUIDE_EXPERT"
                },
                    {
                        docId: '1aezh9dlRFTVw7Dk5RVUyYGuWNPu_3NabeLi9GE14qLI',
                        key: "GUIDE_SEEKER"
                    }],
                it_it: [{
                    docId: '1xpk_aIgzLm0ZTqXv64KDDRj0QzkstCESLTs96ZjEQEE',
                    key: "GUIDE_EXPERT"
                },
                    {
                        docId: '1s_2mAp1ZrLTjIuUx2Vs3U9X3Jn8P3RBuuQcq_ggEleE',
                        key: "GUIDE_SEEKER"
                    }],
            }
        }
    ];

    const jwtClient = new google.auth.JWT(
        driveServiceAccountEmail,
        null,
        driveServiceAccountPrivateKey,
        driveScopes
    );

    jwtClient.authorize(function (err) {
        if (err) {
            console.log(err);
            return;
        }

        for (let i = 0; i < docMaps.length; i++) {
            for (let locale in docMaps[i].docs) {
                if (docMaps[i].docs.hasOwnProperty(locale)) {
                    doExport(docMaps[i].targetPath + locale + '.json', docMaps[i].docs[locale], 0);
                }
            }
        }

        function doExport(targetFile, docs, index, finalFile) {
            if (!finalFile) {
                finalFile = '{\n';
            }
            drive.files.export({
                auth: jwtClient,
                fileId: docs[index].docId,
                mimeType: 'text/plain'
            }, function (err, result) {
                if (err) {
                    console.error(err);
                    process.exit();
                    return;
                }

                finalFile += '"' + docs[index].key + '": "' +
                    result.substring(1).replace(new RegExp('\r\n(\\s*?\\*)?', 'g'), '<br>') + '"';
                console.log(finalFile);
                if (index === docs.length - 1) {
                    finalFile += '\n}';
                    let dest = fs.createWriteStream(targetFile);
                    dest.write(finalFile);
                    dest.end();
                } else {
                    finalFile += ',\n';
                    doExport(targetFile, docs, index + 1, finalFile);
                }
            });
        }
    });
    done();
});