<?php

namespace Winter\DriverAWS;

use App;
use Event;
use Config;
use Request;
use Response;
use Storage;
use ApplicationException;
use Backend\Classes\WidgetBase;
use Backend\Widgets\MediaManager;
use Backend\FormWidgets\FileUpload;
use Backend\FormWidgets\RichEditor;
use Backend\FormWidgets\MarkdownEditor;
use System\Classes\PluginBase;
use System\Models\MailSetting;
use Symfony\Component\Mime\MimeTypes;
use Illuminate\Support\Facades\Route;
use Illuminate\Filesystem\FilesystemAdapter;
use Winter\DriverAWS\Behaviours\SignedStorageUrlBehaviour;
use Winter\Storm\Exception\ValidationException;
use Winter\Storm\Database\Attach\File as FileModel;
use Validator;
use SystemException;

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
                $model->rules['ses_secret'] = 'required_if:send_mode,' . self::MODE_SES;
                $model->rules['ses_region'] = 'required_if:send_mode,' . self::MODE_SES;
            });
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
     * Check if the provided widget's disk is a valid S3 disk with streaming enabled
     *
     * @throws SystemException if the widget's disk cannot be identified
     */
    protected function diskHasStreamingEnabled(WidgetBase $widget): bool
    {
        if ($widget instanceof FileUpload) {
            $disk = $widget->getRelationModel()->getDisk();
        } elseif (method_exists($widget, 'uploadableGetDisk')) {
            $disk = $widget->getController()->disk;
        } else {
            throw new SystemException('Unable to determine the disk for widget ' . get_class($widget));
        }

        return (
            $disk->getDriver() instanceof \League\Flysystem\AwsS3v3\AwsS3Adapter
            && $disk->getConfig()['stream_uploads'] ?? false
        );
    }

    /**
     * Extend the uploadable Widgets to support streaming file uploads directly to S3
     */
    protected function extendUploadableWidgets()
    {
        $addDependencies = function (WidgetBase $widget): void {
            if (!$this->widgetDiskHasStreamingEnabled($widget)) {
                return;
            }

            $widget->extendClassWith(SignedStorageUrlBehaviour::class);
            $widget->addJs('/plugins/winter/driveraws/assets/js/build/stream-file-uploads.js');
        };

        MediaManager::extend($addDependencies);
        FileUpload::extend($addDependencies);
        RichEditor::extend($addDependencies);
        MarkdownEditor::extend($addDependencies);
    }

    /**
     * Hook into the backend.widgets.uploadable.onUpload event to process streamed file uploads
     */
    protected function processUploadableWidgetUploads()
    {
        Event::listen('backend.widgets.uploadable.onUpload', function (WidgetBase $widget): \Illuminate\Http\Response {
            if (!$this->widgetDiskHasStreamingEnabled($widget)) {
                return;
            }

            try {
                /**
                 * Expects the following input data:
                 * - uuid: The unique identifier of uploaded file on S3
                 * - name: The original name of the uploaded file
                 * - path: The path to put the uploaded file (relative to the media folder and only takes effect if $widget->uploadPath is not set)
                 */
                $uploadedPath = 'tmp/' . Request::get('uuid');
                $originalName = Request::get('name');

                $fileName = $widget->validateMediaFileName(
                    $originalName,
                    strtolower(pathinfo($originalName, PATHINFO_EXTENSION))
                );

                $disk = $widget->uploadableGetDisk();

                /*
                 * See mime type handling in the asset manager
                 */
                if (!$disk->exists($uploadedPath)) {
                    // @TODO: Add translation support here
                    throw new ApplicationException('The file failed to upload');
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
            } catch (\Exception $ex) {
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
            if (!$this->diskHasStreamingEnabled($widget)) {
                return;
            }

            if (!Request::has(['name', 'uuid', 'key'])) {
                return null;
            }

            $disk = $model->getDisk();
            $path = 'tmp/' . Request::input('uuid');
            $name = Request::input('name');

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

            $validation = Validator::make([
                'size' => $disk->size($path),
                'name' => $name,
                'mime' => $disk->mimeType($path)
            ], $rules);

            if ($validation->fails()) {
                throw new ValidationException($validation);
            }

            return $path;
        });
    }
}
