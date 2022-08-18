<?php

return [
    'stream_s3_uploads' => [
        /**
         * This enables support for steaming uploads directly to S3
         */
        'enabled' => env('STREAM_S3_UPLOADS', false),

        /**
         * This tells the signed url generator to ignore custom AWS_URL values
         */
        'ignore_aws_url' => env('STREAM_IGNORE_AWS_URL', false)
    ],
];
