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
use System\Classes\MediaLibrary;
use System\Classes\PluginBase;
use System\Models\MailSetting;
use Symfony\Component\Mime\MimeTypes;
use Illuminate\Support\Facades\Route;
use Winter\DriverAWS\Behaviours\SignedStorageUrlBehaviour;
use Winter\Storm\Exception\ValidationException;
use Winter\Storm\Database\Attach\File as FileModel;

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

        if (Config::get('winter.driveraws::stream_s3_uploads.enabled', false)) {
            $this->extendUploadableWidgets();
            $this->processUploadableWidgetUploads();
            $this->processFileUploadWidgetUploads();
        }
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
     * Extend the uploadable Widgets to support streaming file uploads directly to S3
     */
    protected function extendUploadableWidgets()
    {
        $addDependencies = function (WidgetBase $widget): void {
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

                $disk = Storage::disk(Config::get('cms.storage.media.disk'));

                /*
                 * See mime type handling in the asset manager
                 */
                if (!$disk->exists($uploadedPath)) {
                    // @TODO: Add translation support here
                    throw new ApplicationException('The file failed to upload');
                }

                // Use the configured upload path unless it's null, in which case use the user-provided path
                $path = Config::get('cms.storage.media.folder') . (
                    !empty($widget->uploadPath)
                        ? $widget->uploadPath
                        : Request::input('path')
                    );
                $path = MediaLibrary::validatePath($path);
                $targetPath = rtrim($path, '/') . '/' . $fileName;

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
                    'link' => MediaLibrary::url($targetPath),
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
            if (!array_has(Request::all(), ['name', 'uuid', 'key'])) {
                return null;
            }

            $disk = $model->getDisk();
            $path = 'tmp/' . Request::get('uuid');
            $name = Request::get('name');

            $fileModel = $widget->getRelationModel();
            $rules = ['size' => 'max:' . $fileModel::getMaxFilesize()];

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

            $validation = \Validator::make([
                'size' => $disk->size($path),
                'name' => $name,
                'mime' => $disk->mimeType($path)
            ], $rules);

            if ($validation->fails()) {
                throw new ValidationException($validation);
            }

            return 'tmp/' . Request::get('uuid');
        });
    }
}
