<?php

use Symfony\Component\HttpFoundation\File\UploadedFile;

return [
    'stream_s3_uploads' => [
        /**
         * This tells the signed url generator to ignore custom AWS_URL values
         */
        'ignore_aws_url' => env('STREAM_S3_IGNORE_AWS_URL', false),

        /**
         * The expatriation time for the url in minutes
         */
        'url_expires_after' => env('STREAM_S3_URL_EXPIRES_AFTER', 5),

        /**
         * The maximum size in bytes for file uploads
         */
        'max_upload_size' => env('STREAM_S3_MAX_UPLOAD_SIZE', UploadedFile::getMaxFilesize())
    ],
];
