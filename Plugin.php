<?php

namespace Winter\DriverAWS;

use App;
use Backend\FormWidgets\FileUpload;
use Backend\Widgets\MediaManager;
use Event;
use Config;
use Request;
use Response;
use Storage;
use Winter\Storm\Validation\Validator;
use System\Classes\MediaLibrary;
use System\Classes\PluginBase;
use System\Models\MailSetting;
use Illuminate\Support\Facades\Route;
use \ApplicationException;
use Winter\Storm\Database\Attach\File;

/**
 * DriverAWS Plugin Information File
 */
class Plugin extends PluginBase
{
    const MODE_SES = 'ses';

    public function pluginDetails()
    {
        return [
            'name'        => 'winter.driveraws::lang.plugin_name',
            'description' => 'winter.driveraws::lang.plugin_description',
            'homepage'    => 'https://github.com/wintercms/wn-driveraws-plugin',
            'author'      => 'Winter CMS',
            'icon'        => 'icon-leaf',
        ];
    }

    public function register()
    {
        Event::listen('mailer.beforeRegister', function ($mailManager) {
            $settings = MailSetting::instance();
            if ($settings->send_mode === self::MODE_SES) {
                $config = App::make('config');
                $config->set('mail.mailers.ses.transport', self::MODE_SES);
                $config->set('services.ses.key', $settings->ses_key);
                $config->set('services.ses.secret', $settings->ses_secret);
                $config->set('services.ses.region', $settings->ses_region);
            }
        });
    }

    public function boot()
    {
        $this->extendMailSettings()
            ->extendMailForm();

        if (!\Config::get('winter.driveraws::stream_s3_uploads.enabled')) {
            return;
        }

        $this->addSignedStorageRoute()
            ->addCustomJs()
            ->addUploadWidgetOverride()
            ->addFileUploadOverride();
    }

    protected function extendMailSettings(): static
    {
        MailSetting::extend(function ($model) {
            $model->bindEvent('model.beforeValidate', function () use ($model) {
                $model->rules['ses_key'] = 'required_if:send_mode,' . self::MODE_SES;
                $model->rules['ses_secret'] = 'required_if:send_mode,' . self::MODE_SES;
                $model->rules['ses_region'] = 'required_if:send_mode,' . self::MODE_SES;
            });
        });

        return $this;
    }

    protected function extendMailForm(): static
    {
        Event::listen('backend.form.extendFields', function ($widget) {
            if (!$widget->getController() instanceof \System\Controllers\Settings) {
                return;
            }
            if (!$widget->model instanceof MailSetting) {
                return;
            }

            $field = $widget->getField('send_mode');
            $field->options(array_merge($field->options(), [self::MODE_SES => 'Amazon SES']));

            $widget->addTabFields([
                'ses_key' => [
                    'label' => 'winter.driveraws::lang.ses_key',
                    'commentAbove' => 'winter.driveraws::lang.ses_key_comment',
                    'tab' => 'system::lang.mail.general',
                    'span' => 'left',
                    'type' => 'sensitive',
                    'trigger' => [
                        'action' => 'show',
                        'field' => 'send_mode',
                        'condition' =>  'value[ses]',
                    ],
                ],
                'ses_secret' => [
                    'label' => 'winter.driveraws::lang.ses_secret',
                    'commentAbove' => 'winter.driveraws::lang.ses_secret_comment',
                    'tab' => 'system::lang.mail.general',
                    'type' => 'sensitive',
                    'span' => 'right',
                    'trigger' => [
                        'action' =>  'show',
                        'field' =>  'send_mode',
                        'condition' =>  'value[ses]',
                    ],
                ],
                'ses_region' => [
                    'label' => 'winter.driveraws::lang.ses_region',
                    'commentAbove' => 'winter.driveraws::lang.ses_region_comment',
                    'tab' => 'system::lang.mail.general',
                    'span' => 'left',
                    'trigger' => [
                        'action' => 'show',
                        'field' => 'send_mode',
                        'condition' => 'value[ses]',
                    ],
                ],
            ]);
        });

        return $this;
    }

    protected function addSignedStorageRoute(): static
    {
        Event::listen('system.route', function () {
            /*
             * Signed storage url generator
             */
            Route::post('winter/aws/signed-storage-url', 'Winter\DriverAWS\Classes\SignedStorageUrlController@store');
        });

        return $this;
    }

    protected function addCustomJs(): static
    {
        Event::listen('mediaManager.loadAssets', function (MediaManager $mediaManager) {
            $mediaManager->addJs('/plugins/winter/driveraws/assets/js/build/stream-file-uploads.js');
        });

        Event::listen('fileUpload.loadAssets', function (FileUpload $fileUpload) {
            $fileUpload->addJs('/plugins/winter/driveraws/assets/js/build/stream-file-uploads.js');
        });

        return $this;
    }

    protected function addUploadWidgetOverride(): static
    {
        Event::listen('uploadableWidget.onUpload', function (object $uploadableWidget): \Illuminate\Http\Response {
            try {
                $diskPath = 'tmp/' . Request::get('uuid');
                $originalName = Request::get('name');

                $fileName = $uploadableWidget->validateMediaFileName(
                    $originalName,
                    strtolower(pathinfo($originalName, PATHINFO_EXTENSION))
                );

                $disk = Storage::disk(Config::get('cms.storage.media.disk'));

                /*
                 * See mime type handling in the asset manager
                 */
                if (!$disk->exists($diskPath)) {
                    throw new ApplicationException('The file failed to uploaded');
                }

                // Use the configured upload path unless it's null, in which case use the user-provided path
                $path = Config::get('cms.storage.media.folder') . (
                    !empty($uploadableWidget->uploadPath)
                        ? $uploadableWidget->uploadPath
                        : Request::input('path')
                    );
                $path = MediaLibrary::validatePath($path);
                $filePath = rtrim($path, '/') . '/' . $fileName;

                $disk->move($diskPath, $filePath);

                /**
                 * @event media.file.streamedUpload
                 * Called after a file is uploaded via streaming
                 *
                 * Example usage:
                 *
                 *     Event::listen('media.file.streamedUpload', function ((\Backend\Widgets\MediaManager) $mediaWidget, (string) &$path) {
                 *         \Log::info($path . " was upoaded.");
                 *     });
                 *
                 * Or
                 *
                 *     $mediaWidget->bindEvent('file.streamedUpload', function ((string) &$path) {
                 *         \Log::info($path . " was uploaded");
                 *     });
                 *
                 */
                $uploadableWidget->fireSystemEvent('media.file.streamedUpload', [&$filePath]);

                $response = Response::make([
                    'link' => MediaLibrary::url($filePath),
                    'result' => 'success'
                ]);
            } catch (\Exception $ex) {
                throw new ApplicationException($ex->getMessage());
            }

            return $response;
        });

        return $this;
    }

    protected function addFileUploadOverride(): static
    {
        Event::listen('fileUploadWidget.validateInput', function (array $inputs): bool {
            return array_has($inputs, ['name', 'uuid', 'key']);
        });

        Event::listen('fileUploadWidget.makeValidate', function (FileUpload $fileUpload, array $rules): Validator {
            $disk = Storage::disk(Config::get('cms.storage.uploads.disk'));
            $path = 'tmp/' . Request::get('uuid');
            $name = Request::get('name');

            $rules = ['size' => $rules[0]];

            if ($fileTypes = $fileUpload->getAcceptedFileTypes()) {
                $rules['extension'] = 'ends_with:' . $fileTypes;
            }

            if ($fileTypes = $fileUpload->getAcceptedFileTypes()) {
                $rules['name'] = 'ends_with:' . $fileTypes;
            }

            if ($fileUpload->mimeTypes) {
                $rules['mime'] = 'in:' . $fileUpload->mimeTypes;
            }

            return \Validator::make([
                'size' => $disk->size($path),
                'name' => $name,
                'mime' => $disk->mimeType($path)
            ], $rules);
        });

        Event::listen('fileUploadWidget.getFileData', function (): array {
            return [Storage::disk(Config::get('cms.storage.uploads.disk')), 'tmp/' . Request::get('uuid')];
        });

        return $this;
    }
}
