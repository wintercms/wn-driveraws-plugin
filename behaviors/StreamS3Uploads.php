<?php

namespace Winter\DriverAWS\Behaviors;

use ApplicationException;
use Aws\S3\S3Client;
use Backend\Classes\WidgetBase;
use Backend\FormWidgets\FileUpload;
use File;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Lang;
use SystemException;
use Winter\Storm\Extension\ExtensionBase;
use Winter\Storm\Support\Str;

/**
 * StreamS3Uploads Widget Behavior
 *
 * @author Jack Wilkinson, Luke Towers
 */
class StreamS3Uploads extends ExtensionBase
{
    /**
     * @var WidgetBase The widget that this behavior is bound to
     */
    protected WidgetBase $parent;

    public function __construct(WidgetBase $parent)
    {
        $this->parent = $parent;
    }

    /**
     * Check if the extended widget's disk is a valid S3 disk with streaming enabled
     *
     * @throws SystemException if the parent's disk cannot be identified
     */
    public function streamUploadsIsEnabled(): bool
    {
        $disk = $this->parent->streamUploadsGetDisk();

        return (
            $disk instanceof AwsS3V3Adapter
            && isset($disk->getConfig()['stream_uploads'])
            && $disk->getConfig()['stream_uploads']
        );
    }

    /**
     * Create a new signed URL.
     */
    public function onSignUrl(): ?JsonResponse
    {
        if (!$this->parent->streamUploadsIsEnabled()) {
            return null;
        }

        // Generate the UUID for this upload
        $uuid = (string) Str::uuid();

        /**
         * NOTE:
         * Laravel Vapor allows for the request to configure a number of properties
         * about the upload which we do not currently allow given the potential
         * security implications.
         *
         * The following request parameters are supported by Vapor Core but not us:
         * - bucket: Sets the bucket being uploaded to
         * - visibility: Sets the ACL sent to the putObject command
         * - cache_control: Sets the CacheControl sent to the putObject command
         * - expires: Sets the Expires sent to the putObject command
         *
         * The following request parameters are supported by us:
         * - size: The size of the content being uploaded, used when signing the URL
         * for data integrity.
         * - content_type: Sets the ContentType sent to the putObject command and the
         * Content-Type value of the headers property in the response from this method
         */
        $size = (int) request()->input('size');
        $contentType = request()->input('content_type', 'application/octet-stream');

        /**
         * The following options are required to be present in the disk config:
         * - stream_uploads: Must be set to true to enable streaming
         * - bucket: The bucket to upload to
         * - region: The S3 region to upload to
         * - key: The AWS access key ID to use
         * - secret: The AWS access key secret to use
         *
         * The following options are optional:
         * - root: The root path on the bucket for the current disk
         * - use_path_style_endpoint: Defaults to false but may need to be set for use with MinIO
         *   @see https://laravel.com/docs/9.x/sail#file-storage
         * - endpoint: The S3 endpoint for the bucket, requires the scheme to be present if used
         * - stream_uploads_ttl: The lifespan of the signed URL in minutes, default: 5
         * - stream_uploads_max_size: The max upload size of a single file in bytes, default: 128MB
         */
        $diskConfig = $this->parent->streamUploadsGetDisk()->getConfig();
        $client = $this->parent->streamUploadsGetClient($diskConfig);
        $bucket = $diskConfig['bucket'];
        $key = 'tmp/' . $uuid;
        if (!empty($diskConfig['root'])) {
            $key = rtrim($diskConfig['root'] ?? '', '/') . '/' . $key;
        }
        $expiresAfter = $diskConfig['stream_uploads_ttl'] ?? 5;
        $maxUploadSize = $diskConfig['stream_uploads_max_size'] ?? (128 * 1024 * 1024);

        /**
         * Validate the size of the file to be uploaded
         *
         * @NOTE: It is still technically possible for the client to lie about
         * the size of the file to be uploaded while generating the signed URL.
         * The solution is to use a custom implementation of the SignatureV4 class
         * but that requires https://github.com/aws/aws-sdk-php/pull/2505 to be
         * merged first.
         *
         * @TODO: Also validate the ContentType and provide it as a signed header
         */
        if ($size > $maxUploadSize) {
            throw new ApplicationException(Lang::get(
                'winter.driveraws::lang.stream_uploads.max_size_exceeded',
                ['size' => File::sizeToString($maxUploadSize)],
            ));
        }

        // Generate the S3 signed request to process the upload
        $signedRequest = $client->createPresignedRequest(
            $client->getCommand('putObject', [
                'Bucket' => $bucket,
                'Key' => $key,
                'ACL' => 'private',
                'ContentType' => $contentType,
                'ContentLength' => $size,
            ]),
            sprintf('+%s minutes', $expiresAfter)
        );

        // Return the details to the client for it to use to upload the file
        return response()->json([
            'uuid' => $uuid,
            'bucket' => $bucket,
            'key' => $key,
            'url' => (string) $signedRequest->getUri(),
            'headers' => array_merge($signedRequest->getHeaders(), [
                'Content-Type' => $contentType,
            ]),
        ], 201);
    }

    /**
     * Get the disk to generate a signed upload URL for
     *
     * @throws SystemException if the parent's disk cannot be identified
     */
    public function streamUploadsGetDisk(): FilesystemAdapter
    {
        if ($this->parent instanceof FileUpload) {
            return $this->parent->getRelationModel()->getDisk();
        }

        if (method_exists($this->parent, 'uploadableGetDisk')) {
            return $this->parent->uploadableGetDisk();
        }

        throw new SystemException('Unable to determine the disk for widget ' . get_class($this->parent));
    }

    /**
     * Get the S3 storage client instance.
     */
    public function streamUploadsGetClient(array $config): \Aws\S3\S3Client
    {
        $clientConfig = [
            'region' => $config['region'],
            'version' => 'latest',
            'signature_version' => 'v4',
            'use_path_style_endpoint' => $config['use_path_style_endpoint'] ?? false,
            'credentials' => [
                'key' => $config['key'],
                'secret' => $config['secret'],
            ],
        ];

        // If a custom endpoint is set, use it
        if (!empty($config['endpoint'])) {
            // Expected in the form of https://s3.ca-central-1.amazonaws.com
            $clientConfig['endpoint'] = $config['endpoint'];
        }

        return new S3Client($clientConfig);
    }
}
