<?php

namespace Winter\DriverAWS\Behaviours;

use Event;
use Config;
use Aws\S3\S3Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Winter\DriverAWS\Classes\S3SignatureV4Winter;
use Winter\Storm\Extension\ExtensionBase;
use InvalidArgumentException;

class SignedStorageUrlBehaviour extends ExtensionBase
{
    protected mixed $parent;
    protected string $storageCms;

    public function __construct($parent)
    {
        $this->parent = $parent;
    }

    /**
     * Create a new signed URL.
     */
    public function onSignUrl(): JsonResponse
    {
        $request = request();

        $this->ensureEnvironmentVariablesAreAvailable($request);

        $bucket = $request->input('bucket') ?: $_ENV['AWS_BUCKET'];

        $root = Config::get(sprintf('filesystems.disks.%s.root', $this->getStorageDisk()), '');
        $root = $root ? $root . '/' : $root;

        $client = $this->storageClient();

        $uuid = (string) Str::uuid();

        $expiresAfter = Config::get('winter.driveraws::stream_s3_uploads.url_expires_after', 5);

        $signedRequest = $client->createPresignedRequest(
            $this->createCommand($request, $client, $bucket, $key = ($root . 'tmp/' . $uuid)),
            sprintf('+%s minutes', $expiresAfter)
        );

        $uri = $signedRequest->getUri();

        return response()->json([
            'uuid'    => $uuid,
            'bucket'  => $bucket,
            'key'     => $key,
            'url'     => $uri->getScheme() . '://' . $uri->getAuthority() . $uri->getPath() . '?' . $uri->getQuery(),
            'headers' => $this->headers($request, $signedRequest),
        ], 201);
    }

    /**
     * Create a command for the PUT operation.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Aws\S3\S3Client  $client
     * @param  string  $bucket
     * @param  string  $key
     * @return \Aws\Command
     */
    protected function createCommand(Request $request, S3Client $client, string $bucket, string $key)
    {
        return $client->getCommand('putObject', array_filter([
            'Bucket'        => $bucket,
            'Key'           => $key,
            'ACL'           => $request->input('visibility') ?: $this->defaultVisibility(),
            'ContentType'   => $request->input('content_type') ?: 'application/octet-stream',
            // @see https://github.com/aws/aws-sdk-php/pull/2505, may have to implement custom SignatureV4 class
            'ContentLength' => $this->getUploadSize($request->input('size')),
            'CacheControl'  => $request->input('cache_control') ?: null,
            'Expires'       => $request->input('expires') ?: null,
        ]));
    }

    protected function getUploadSize(int $uploadSize): int
    {
        $max = $this->parent->signedStorageUrlGetMaxFilesize();

        if ($uploadSize > $max) {
            throw new \ApplicationException('The file size exceeds the maximum allowable size');
        }

        return $uploadSize;
    }

    public function signedStorageUrlGetMaxFilesize()
    {
        return Config::get('winter.driveraws::stream_s3_uploads.max_upload_size', UploadedFile::getMaxFilesize());
    }

    /**
     * Get the headers that should be used when making the signed request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \GuzzleHttp\Psr7\Request
     * @return array
     */
    protected function headers(Request $request, $signedRequest)
    {
        return array_merge($signedRequest->getHeaders(), [
            'Content-Type' => $request->input('content_type') ?: 'application/octet-stream',
        ]);
    }

    /**
     * Ensure the required environment variables are available.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return void
     */
    protected function ensureEnvironmentVariablesAreAvailable(Request $request)
    {
        $missing = array_diff_key(array_flip(array_filter([
            $request->input('bucket') ? null : 'AWS_BUCKET',
            'AWS_DEFAULT_REGION',
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
        ])), $_ENV);

        if (empty($missing)) {
            return;
        }

        throw new InvalidArgumentException(
            'Unable to issue signed URL. Missing environment variables: '.implode(', ', array_keys($missing))
        );
    }

    /**
     * Get the S3 storage client instance.
     *
     * @return \Aws\S3\S3Client
     */
    protected function storageClient()
    {
        $config = [
            'region' => Config::get(
                'filesystems.disks.' . $this->getStorageDisk() . '.region',
                $_ENV['AWS_DEFAULT_REGION'] ?? null
            ),
            'version' => 'latest',
            'signature_version' => 'v4',
            'use_path_style_endpoint' => Config::get(
                'filesystems.disks.' . $this->getStorageDisk() . '.use_path_style_endpoint',
                false
            )
        ];

        if (! isset($_ENV['AWS_LAMBDA_FUNCTION_VERSION'])) {
            $config['credentials'] = array_filter([
                'key' => $_ENV['AWS_ACCESS_KEY_ID'] ?? null,
                'secret' => $_ENV['AWS_SECRET_ACCESS_KEY'] ?? null,
                'token' => $_ENV['AWS_SESSION_TOKEN'] ?? null,
            ]);

            if (
                !Config::get('winter.driveraws::stream_s3_uploads.ignore_aws_url')
                && array_key_exists('AWS_URL', $_ENV)
                && !is_null($_ENV['AWS_URL'])
            ) {
                $config['url'] = $_ENV['AWS_URL'];
                $config['endpoint'] = $_ENV['AWS_URL'];
            }
        }

        return new S3Client($config);
    }

    /**
     * Get the default visibility for uploads.
     *
     * @return string
     */
    protected function defaultVisibility()
    {
        return 'private';
    }

    protected function getStorageDisk(): string
    {
        return Config::get('cms.storage.' . $this->getCmsStorage() . '.disk');
    }

    public function getCmsStorage(): string
    {
        if (isset($this->storageCms)) {
            return $this->storageCms;
        }

        if ($diskName = Event::fire('driveraws.signedurl.cmsDisk')) {
            return $this->storageCms = $diskName;
        }

        if (in_array('Backend\Traits\UploadableWidget', array_keys(class_uses_recursive($this->parent)))) {
            return $this->storageCms = 'media';
        }

        return $this->storageCms = 'uploads';
    }
}
