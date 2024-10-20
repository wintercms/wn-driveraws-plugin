# AWS Driver Plugin

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wintercms/wn-driveraws-plugin/blob/main/LICENSE)

This plugin adds support for integrating various AWS services into Winter CMS.

Supports:
- Configuring & using AWS Simple Email Service (SES) as a system mailer service.
- Using S3 (and S3-compatible storage providers) as a filesystem driver
- Simple Queing System (SQS) for queues
- DynamoDB as a cache driver
- Streamed file uploads to S3 (and S3-compatible storage providers)

## Installation

This plugin is available for installation via [Composer](http://getcomposer.org/).

```bash
composer require winter/wn-driveraws-plugin
```

After installing the plugin you will need to run the migrations and (if you are using a [public folder](https://wintercms.com/docs/develop/docs/setup/configuration#using-a-public-folder)) [republish your public directory](https://wintercms.com/docs/develop/docs/console/setup-maintenance#mirror-public-files).

```bash
php artisan migrate
```

## Usage

Simply installing & enabling this plugin should be enough to enable support for the AWS drivers for various core Winter / Laravel functionality (i.e. `s3` filesystem disks, `sqs` queues, `dynamodb` caches, `ses` mailers, etc).

This plugin also provides some additional functionality over and above the AWS SDK, including:

- [Backend configuration of SES as a Mailer](#backend-ses-mailer)
- [Streamed File Uploads to S3](#streamed-uploads)

<a name="backend-ses-mailer"></a>
### Backend Configuration of SES as a Mailer

By default you can setup SES as a mail transport by configuring the `mail.mailers.*` option to `ses` and providing the `services.aws.key`, `services.aws.secret`, and `services.aws.region` configuration values in your configuration files. This plugin also provides the ability to configure these values through the backend Mail Settings form.

<a name="streamed-uploads"></a>
### Streamed File Uploads to S3

>**NOTE:** This feature requires Winter v1.2.1 or greater.

When dealing with large files or serverless application infrastructure it can be extremely useful to support client-side direct uploads to S3 (i.e. file uploads are streamed to S3 directly from the browser without going through the application server). This plugin provides the ability to do this by automatically hooking into the FileUpload, MediaManager, RichEditor, & MarkdownEditor Widgets and providing the ability to upload directly to S3 when their respective disk configurations are set to `s3` and have the `stream_uploads` option set to `true`.

The following additional configuration options are available to be set on `s3` disk configurations:

```php
's3' => [
    // Default options
    'bucket' => env('AWS_BUCKET'),
    'driver' => 's3',
    'endpoint' => env('AWS_ENDPOINT'),
    'key' => env('AWS_ACCESS_KEY_ID'),
    'region' => env('AWS_DEFAULT_REGION'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'stream_uploads' => env('AWS_S3_STREAM_UPLOADS', false),
    'url' => env('AWS_URL'),
    'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false)

    // Additional options used by the StreamS3Uploads functionality:
    // The lifespan of the signed URL in minutes
    'stream_uploads_ttl' => 5,
    // The max upload size of a single file in bytes, default 128 MB
    'stream_uploads_max_size' => 128 * 1024 * 1024,
],
```

>**NOTE:** In order to use the streamed uploads functionality, your AWS credential require access to the following actions on the desired S3 bucket:

- `s3:PutObject`
- `s3:PutObjectAcl`
- `s3:GetObject`
- `s3:GetObjectAcl`
- `s3:DeleteObject`

See below for an example IAM policy that shoud work:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::my-bucket-name-here"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:GetObjectAcl",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::my-bucket-name-here/*"
            ]
        }
    ]
}
```
