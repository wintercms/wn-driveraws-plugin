<?php namespace Winter\DriverAWS;

use App;
use Event;
use System\Classes\PluginBase;
use System\Models\MailSetting;

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
        MailSetting::extend(function ($model) {
            $model->bindEvent('model.beforeValidate', function () use ($model) {
                $model->rules['ses_key'] = 'required_if:send_mode,' . self::MODE_SES;
                $model->rules['ses_secret'] = 'required_if:send_mode,' . self::MODE_SES;
                $model->rules['ses_region'] = 'required_if:send_mode,' . self::MODE_SES;
            });
        });

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
    }
}
