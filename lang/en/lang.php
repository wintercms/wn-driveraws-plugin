<?php

return [
    'plugin' => [
        'name' => 'AWS Driver',
        'description' => 'Driver that adds support for the AWS SDK (SQS queues, DynamoDB, SES mail driver) to WinterCMS',
    ],

    'ses_key' => 'SES key',
    'ses_key_comment' => 'Enter your SES API key',
    'ses_secret' => 'SES secret',
    'ses_secret_comment' => 'Enter your SES API secret key',
    'ses_region' => 'SES region',
    'ses_region_comment' => 'Enter your SES region (e.g. us-east-1)',

    'stream_uploads' => [
        'upload_failed' => 'The file failed to upload',
        'max_size_exceeded' => 'The filesize exceeds the maximum allowed upload size (:size)',
    ],
];
