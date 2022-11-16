// import functions not bound to file scope

export const froalaStream = (editor, vaporHandler) => {
    const BAD_LINK = 1,
        MISSING_LINK = 2,
        ERROR_DURING_UPLOAD = 3,
        BAD_RESPONSE = 4,
        MAX_SIZE_EXCEEDED = 5,
        BAD_FILE_TYPE = 6,
        NO_CORS_IE = 7,
        error_messages = {};

    error_messages[BAD_LINK] = 'File cannot be loaded from the passed link.';
    error_messages[MISSING_LINK] = 'No link in upload response.';
    error_messages[ERROR_DURING_UPLOAD] = 'Error during file upload.';
    error_messages[BAD_RESPONSE] = 'Parsing response failed.';
    error_messages[MAX_SIZE_EXCEEDED] = 'File is too large.';
    error_messages[BAD_FILE_TYPE] = 'File file type is invalid.';
    error_messages[NO_CORS_IE] = 'Files can be uploaded only to same domain in IE 8 and IE 9.';

    const _setProgressMessage = (message, progress) => {
        var $popup = editor.popups.get('file.insert');
        if ($popup) {
            var $layer = $popup.find('.fr-file-progress-bar-layer');
            $layer.find('h3').text(message + (progress ? ' ' + progress + '%' : ''));
            $layer.removeClass('fr-error');
            if (progress) {
                $layer.find('div').removeClass('fr-indeterminate');
                $layer.find('div > span').css('width', progress + '%');
            } else {
                $layer.find('div').addClass('fr-indeterminate');
            }
        }
    };

    const showProgressBar = () => {
        var $popup = editor.popups.get('file.insert');
        if (!$popup) $popup = _initInsertPopup();
        $popup.find('.fr-layer.fr-active').removeClass('fr-active').addClass('fr-pactive');
        $popup.find('.fr-file-progress-bar-layer').addClass('fr-active');
        $popup.find('.fr-buttons').hide();
        _setProgressMessage('Uploading', 0);
    };

    const imageLink = () => {
        var $el = editor.image ? editor.image.getEl() : null;
        if ($el) {
            var $popup = editor.popups.get('link.insert');
            if (editor.image.hasCaption()) {
                $el = $el.find('.fr-img-wrap');
            }
            if (!$popup) $popup = _initInsertPopup();
            _refreshInsertPopup(true);
            editor.popups.setContainer('link.insert', editor.$sc);
            var left = $el.offset().left + $el.outerWidth() / 2;
            var top = $el.offset().top + $el.outerHeight();
            editor.popups.show('link.insert', left, top, $el.outerHeight());
        }
    }

    const _hideEditPopup = () => {
        editor.popups.hide('link.edit');
    }

    const update = () => {
        _hideEditPopup();
        var link = get();
        if (link) {
            var $popup = editor.popups.get('link.insert');
            if (!$popup) $popup = _initInsertPopup();
            if (!editor.popups.isVisible('link.insert')) {
                editor.popups.refresh('link.insert');
                editor.selection.save();
                if (editor.helpers.isMobile()) {
                    editor.events.disableBlur();
                    editor.$el.blur();
                    editor.events.enableBlur();
                }
            }
            editor.popups.setContainer('link.insert', editor.$sc);
            var $ref = (editor.image ? editor.image.get() : null) || $(link);
            var left = $ref.offset().left + $ref.outerWidth() / 2;
            var top = $ref.offset().top + $ref.outerHeight();
            editor.popups.show('link.insert', left, top, $ref.outerHeight());
        }
    }

    const _showErrorMessage = (message) => {
        showProgressBar();
        var $popup = editor.popups.get('file.insert');

        if (!$popup) {
            alert(message);
            return;
        }

        var $layer = $popup.find('.fr-file-progress-bar-layer');
        $layer.addClass('fr-error');
        var $message_header = $layer.find('h3');
        $message_header.text(message);
        editor.events.disableBlur();
        $message_header.focus();
    }

    const _initInsertPopup = (delayed) => {
        if (delayed) {
            editor.popups.onRefresh('link.insert', _refreshInsertPopup);
            editor.popups.onHide('link.insert', _hideInsertPopup);
            return true;
        }
        var link_buttons = '';
        if (editor.opts.linkInsertButtons.length >= 1) {
            link_buttons = '<div class="fr-buttons">' + editor.button.buildList(editor.opts.linkInsertButtons) + '</div>';
        }
        var checkmark = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10" viewBox="0 0 32 32"><path d="M27 4l-15 15-7-7-5 5 12 12 20-20z" fill="#FFF"></path></svg>';
        var input_layer = '';
        var tab_idx = 0;
        input_layer = '<div class="fr-link-insert-layer fr-layer fr-active" id="fr-link-insert-layer-' + editor.id + '">';
        input_layer += '<div class="fr-input-line"><input id="fr-link-insert-layer-url-' + editor.id + '" name="href" type="text" class="fr-link-attr" placeholder="' + editor.language.translate('URL') + '" tabIndex="' + (++tab_idx) + '"></div>';
        if (editor.opts.linkText) {
            input_layer += '<div class="fr-input-line"><input id="fr-link-insert-layer-text-' + editor.id + '" name="text" type="text" class="fr-link-attr" placeholder="' + editor.language.translate('Text') + '" tabIndex="' + (++tab_idx) + '"></div>';
        }
        for (var attr in editor.opts.linkAttributes) {
            if (editor.opts.linkAttributes.hasOwnProperty(attr)) {
                var placeholder = editor.opts.linkAttributes[attr];
                input_layer += '<div class="fr-input-line"><input name="' + attr + '" type="text" class="fr-link-attr" placeholder="' + editor.language.translate(placeholder) + '" tabIndex="' + (++tab_idx) + '"></div>';
            }
        }
        if (!editor.opts.linkAlwaysBlank) {
            input_layer += '<div class="fr-checkbox-line"><span class="fr-checkbox"><input name="target" class="fr-link-attr" data-checked="_blank" type="checkbox" id="fr-link-target-' + editor.id + '" tabIndex="' + (++tab_idx) + '"><span>' + checkmark + '</span></span><label for="fr-link-target-' + editor.id + '">' + editor.language.translate('Open in new tab') + '</label></div>';
        }
        input_layer += '<div class="fr-action-buttons"><button class="fr-command fr-submit" role="button" data-cmd="linkInsert" href="#" tabIndex="' + (++tab_idx) + '" type="button">' + editor.language.translate('Insert') + '</button></div></div>'
        var template = {buttons: link_buttons, input_layer: input_layer}
        var $popup = editor.popups.create('link.insert', template);
        if (editor.$wp) {
            editor.events.$on(editor.$wp, 'scroll.link-insert', function () {
                var $current_image = editor.image ? editor.image.get() : null;
                if ($current_image && editor.popups.isVisible('link.insert')) {
                    imageLink();
                }
                if (get && editor.popups.isVisible('link.insert')) {
                    update();
                }
            });
        }
        return $popup;
    }

    const _parseResponse = (response) => {
        try {
            if (editor.events.trigger('file.uploaded', [response], true) === false) {
                editor.edit.on();
                return false;
            }
            var resp = $.parseJSON(response);
            if (resp.link) {
                return resp;
            } else {
                _throwError(MISSING_LINK, response);
                return false;
            }
        } catch (ex) {
            _throwError(BAD_RESPONSE, response);
            return false;
        }
    }

    const _fileUploaded = (mode, xhr, filename) => {
        const status = xhr.status;
        const response = xhr.response;
        const responseXML = xhr.responseXML;
        const responseText = xhr.responseText;
        try {
            if (status >= 200 && status < 300) {
                const resp = _parseResponse(responseText);
                if (resp) {
                    switch (mode) {
                        case "image":
                            editor.image.insert(resp.link, filename, response || responseText);
                            break;
                        case "file":
                        default:
                            editor.file.insert(resp.link, filename, response || responseText);
                    }
                }
            } else {
                _throwError(ERROR_DURING_UPLOAD, response || responseText);
            }
        } catch (ex) {
            _throwError(BAD_RESPONSE, response || responseText);
        }
    };

    const _fileUploadProgress = (e) => {
        if (e.lengthComputable) {
            var complete = (e.loaded / e.total * 100 | 0);
            _setProgressMessage('Uploading', complete);
        } else if (e) {
            _setProgressMessage('Uploading', e);
        }
    };

    const _throwError = (code, response) => {
        editor.edit.on();
        _showErrorMessage(editor.language.translate(error_messages[code] || "Unrecognized error, please try again"));
        editor.events.trigger('file.error', [{code: code, message: error_messages[code]}, response]);
    };

    const _fileUploadError = () => {
        _throwError(BAD_RESPONSE, this.response || this.responseText || this.responseXML);
    }

    const hideProgressBar = (dismiss) => {
        var $popup = editor.popups.get('file.insert');
        if ($popup) {
            $popup.find('.fr-layer.fr-pactive').addClass('fr-active').removeClass('fr-pactive');
            $popup.find('.fr-file-progress-bar-layer').removeClass('fr-active');
            $popup.find('.fr-buttons').show();
            if (dismiss) {
                editor.events.focus();
                editor.popups.hide('file.insert');
            }
        }
    }

    const _fileUploadAborted = () => {
        editor.edit.on();
        hideProgressBar(true);
    }

    const upload = (mode) => {
        return (files) => {
            if (typeof files === 'undefined' && files.length !== 1) {
                return false;
            }

            if (editor.events.trigger('file.beforeUpload', [files]) === false) {
                return false;
            }

            const file = files[0];

            if (file.size > editor.opts.fileMaxSize) {
                _throwError(MAX_SIZE_EXCEEDED);
                return false;
            }

            if (editor.opts.fileAllowedTypes.indexOf('*') < 0 && editor.opts.fileAllowedTypes.indexOf(file.type.replace(/file\//g, '')) < 0) {
                _throwError(BAD_FILE_TYPE);
                return false;
            }

            // Detect the target widget for the handler
            let signingHandler = 'onSignUrl';
            let uploadHandler = editor.opts.fileUploadParams._handler;
            if (typeof uploadHandler === 'string') {
                const prefix = uploadHandler.substr(0, uploadHandler.indexOf('::'));
                if (typeof prefix === 'string' && prefix.trim().length !== 0) {
                    signingHandler = prefix + '::' + signingHandler;
                }
            }

            vaporHandler(
                file,
                progress => {
                    _fileUploadProgress(progress);
                },
                signingHandler
            ).then(response => {
                // The following is an adapted version of the original _uploadData
                const xhr = editor.core.getXHR(editor.opts.fileUploadURL, editor.opts.fileUploadMethod),
                    streamResponse = {
                        uuid: response.uuid,
                        key: response.key,
                        bucket: response.bucket,
                        name: file.name,
                        content_type: file.type,
                    },
                    formData = new FormData();
                let key;

                for (key in editor.opts.fileUploadParams) {
                    if (editor.opts.fileUploadParams.hasOwnProperty(key)) {
                        formData.append(key, editor.opts.fileUploadParams[key]);
                    }
                }

                for (key in streamResponse) {
                    formData.append(key, streamResponse[key]);
                }

                xhr.onload = function () {
                    _fileUploaded(mode, xhr, file.name);
                };
                xhr.onerror = _fileUploadError;
                xhr.upload.onprogress = _fileUploadProgress;
                xhr.onabort = _fileUploadAborted;
                showProgressBar();

                editor.edit.off();
                var $popup = editor.popups.get('file.insert');
                if ($popup) {
                    $popup.off('abortUpload').on('abortUpload', function () {
                        if (xhr.readyState != 4) {
                            xhr.abort();
                        }
                    })
                }
                xhr.send(formData);
            }).catch((error) => {
                _throwError(
                    ERROR_DURING_UPLOAD,
                    error.message === "Network Error"
                        ? "Server rejected the file because it was too large."
                        : error?.response?.data || "Unexpected error"
                );
            });
        };
    };

    editor.image.upload = upload("image");
    editor.file.upload = upload("file");
};
