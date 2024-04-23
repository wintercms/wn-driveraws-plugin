<?php

namespace Winter\DriverAWS;

use App;
use ApplicationException;
use Backend\Classes\WidgetBase;
use Backend\FormWidgets\FileUpload;
use Backend\FormWidgets\MarkdownEditor;
use Backend\FormWidgets\RichEditor;
use Backend\Widgets\MediaManager;
use Event;
use Lang;
use Request;
use Response;
use Symfony\Component\Mime\MimeTypes;
use System\Classes\PluginBase;
use System\Models\MailSetting;
use SystemException;
use Validator;
use Winter\DriverAWS\Behaviors\StreamS3Uploads;
use Winter\Storm\Database\Attach\File as FileModel;
use Winter\Storm\Exception\ValidationException;

/**
 * DriverAWS Plugin Information File
 */
class Plugin extends PluginBase
{
    const MODE_SES = 'ses';

    public function pluginDetails()
    {
        return [
            'name'        => 'winter.driveraws::lang.plugin.name',
            'description' => 'winter.driveraws::lang.plugin.description',
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
                $config->set('services.ses.region', $settings->ses_region);
                $config->set('services.ses.secret', $settings->ses_secret);
            }
        });
    }

    public function boot()
    {
        $this->extendMailSettings();
        $this->extendMailForm();

        // Add support for S3 streamed uploads
        $this->extendUploadableWidgets();
        $this->processUploadableWidgetUploads();
        $this->processFileUploadWidgetUploads();
    }

    /**
     * Extend the mail settings model to add support for SES
     */
    protected function extendMailSettings()
    {
        MailSetting::extend(function ($model) {
            $model->bindEvent('model.beforeValidate', function () use ($model) {
                $model->rules['ses_key'] = 'required_if:send_mode,' . self::MODE_SES;
                $model->rules['ses_region'] = 'required_if:send_mode,' . self::MODE_SES;
                $model->rules['ses_secret'] = 'required_if:send_mode,' . self::MODE_SES;
            });
            $model->ses_key = config('services.ses.key', env('AWS_ACCESS_KEY_ID'));
            $model->ses_region = config('services.ses.region', env('AWS_DEFAULT_REGION', 'us-east-1'));
            $model->ses_secret = config('services.ses.secret', env('AWS_SECRET_ACCESS_KEY'));
        });
    }

    /**
     * Extend the mail form to add support for SES
     */
    protected function extendMailForm()
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
                        'condition' => 'value[ses]',
                    ],
                ],
                'ses_secret' => [
                    'label' => 'winter.driveraws::lang.ses_secret',
                    'commentAbove' => 'winter.driveraws::lang.ses_secret_comment',
                    'tab' => 'system::lang.mail.general',
                    'type' => 'sensitive',
                    'span' => 'right',
                    'trigger' => [
                        'action' => 'show',
                        'field' => 'send_mode',
                        'condition' => 'value[ses]',
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
    }

    /**
     * Extend the uploadable Widgets to support streaming file uploads directly to S3
     */
    protected function extendUploadableWidgets()
    {
        $addBehavior = function (WidgetBase $widget): void {
            $widget->extendClassWith(StreamS3Uploads::class);

            if ($widget->streamUploadsIsEnabled()) {
                $widget->addJs('/plugins/winter/driveraws/assets/js/build/stream-file-uploads.js');
            }
        };

        MediaManager::extend($addBehavior);
        FileUpload::extend($addBehavior);
        RichEditor::extend($addBehavior);
    }

    /**
     * Hook into the backend.widgets.uploadable.onUpload event to process streamed file uploads
     */
    protected function processUploadableWidgetUploads()
    {
        Event::listen('backend.widgets.uploadable.onUpload', function (WidgetBase $widget): ?\Illuminate\Http\Response {
            if (!$widget->streamUploadsIsEnabled()) {
                return null;
            }

            // Check if the request came from our StreamFileUploads.js script
            if (!Request::has(['uuid', 'key', 'bucket', 'name', 'content_type'])) {
                return null;
            }

            try {
                /**
                 * Expects the following input data:
                 * - uuid: The unique identifier of uploaded file on S3
                 * - name: The original name of the uploaded file
                 * - path: The path to put the uploaded file (relative to the media folder and only takes effect if $widget->uploadPath is not set)
                 */
                $uploadedPath = 'tmp/' . Request::input('uuid');
                $originalName = Request::input('name');

                $fileName = $widget->validateMediaFileName(
                    $originalName,
                    strtolower(pathinfo($originalName, PATHINFO_EXTENSION))
                );

                $disk = $widget->uploadableGetDisk();

                // Check if the upload succeeded
                if (!$disk->exists($uploadedPath)) {
                    throw new ApplicationException(Lang::get('winter.driveraws::lang.stream_uploads.upload_failed'));
                }

                $targetPath = $widget->uploadableGetUploadPath($fileName);

                $disk->move($uploadedPath, $targetPath);

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
                $widget->fireSystemEvent('media.file.streamedUpload', [&$targetPath]);

                $response = Response::make([
                    'link' => $widget->uploadableGetUploadUrl($targetPath),
                    'result' => 'success'
                ]);
            } catch (\Throwable $ex) {
                throw new ApplicationException($ex->getMessage());
            }

            return $response;
        });
    }

    /**
     * Hook into the backend.formwidgets.fileupload.onUpload event to process streamed file uploads
     */
    protected function processFileUploadWidgetUploads()
    {
        Event::listen('backend.formwidgets.fileupload.onUpload', function (FileUpload $widget, FileModel $model): ?string {
            if (!$widget->streamUploadsIsEnabled()) {
                return null;
            }

            // Check if the request came from our StreamFileUploads.js script
            if (!Request::has(['uuid', 'key', 'bucket', 'name', 'content_type'])) {
                return null;
            }

            /**
             * Expects the following input data:
             * - uuid: The unique identifier of uploaded file on S3
             * - name: The original name of the uploaded file
             */
            $disk = $model->getDisk();
            $path = 'tmp/' . Request::input('uuid');
            $name = Request::input('name');

            // Check if the upload succeeded
            if (!$disk->exists($path)) {
                throw new ApplicationException(Lang::get('winter.driveraws::lang.stream_uploads.upload_failed'));
            }

            $rules = ['size' => 'max:' . $model::getMaxFilesize()];

            if ($fileTypes = $widget->getAcceptedFileTypes()) {
                $rules['name'] = 'ends_with:' . $fileTypes;
            }

            if ($widget->mimeTypes) {
                $mimeType = new MimeTypes();
                $mimes = [];
                foreach (explode(',', $widget->mimeTypes) as $item) {
                    if (str_contains($item, '/')) {
                        $mimes[] = $item;
                        continue;
                    }

                    $mimes = array_merge($mimes, $mimeType->getMimeTypes($item));
                }

                $rules['mime'] = 'in:' . implode(',', $mimes);
            }

            $data = [
                'size' => $disk->size($path),
                'name' => $name,
                'mime' => $disk->mimeType($path)
            ];

            $validation = Validator::make($data, $rules);

            if ($validation->fails()) {
                throw new ValidationException($validation);
            }

            $model->file_name = $data['name'];
            $model->content_type = $data['mime'];

            return $path;
        });
    }
}
