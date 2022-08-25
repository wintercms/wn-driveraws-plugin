/* eslint-disable */
const mix = require('laravel-mix');
/* eslint-enable */

mix.setPublicPath(__dirname);

mix
    .options({
        terser: {
            extractComments: false,
        },
        runtimeChunkPath: './assets/js/build',
    })

    .js(
        './assets/js/stream-file-uploads.js',
        './assets/js/build/stream-file-uploads.js',
    );
