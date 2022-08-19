/**
 * Steam S3 uploads provider.
 *
 * @copyright 2022 Winter.
 * @author Jack Wilkinson <me@jackwilky.com>
 */
import { froalaStream } from "./froala-stream";

export default class SteamFileUploads extends Snowboard.Singleton {
    listens() {
        return {
            mediaManagerInitUploader: "mediaManager",
            fileUploadInitUploader: "fileUpload",
            richEditorInit: "richEditor"
        };
    }

    vaporHandler(file, storage, progress) {
        return require('laravel-vapor').store(file, {
            expires: 5,
            signedStorageUrl: "/winter/aws/signed-storage-url",
            data: {
                cmsStorage: storage
            },
            progress: progress
        });
    }

    mediaManager(mediaManager) {
        this.dropzoneHandle(mediaManager, "media");
    }

    fileUpload(fileUpload) {
        this.dropzoneHandle(fileUpload, "uploads");
    }

    richEditor(richEditor) {
        froalaStream(richEditor.editor, this.vaporHandler);
    }

    dropzoneHandle(parent, storage) {
        const _this = this;
        parent.dropzone._uploadData = function _uploadData(files, dataBlocks) {
            const _dropzone = this;
            for (let i in files) {
                if (!files.hasOwnProperty(i)) {
                    continue;
                }
                const file = files[i];
                _this.vaporHandler(file, storage, progress => {
                    _dropzone._updateFilesUploadProgress(files, progress);
                }).then(response => {
                    // The following is an adapted version of the original _uploadData
                    const xhr = new XMLHttpRequest(),
                        method = _dropzone.resolveOption(_dropzone.options.method, files),
                        url = _dropzone.resolveOption(_dropzone.options.url, files),
                        steamResponse = {
                            uuid: response.uuid,
                            key: response.key,
                            bucket: response.bucket,
                            name: files[i].name,
                            content_type: files[i].type,
                        };
                    let key;

                    xhr.open(method, url, true);

                    // Setting the timeout after open because of IE11 issue: https://gitlab.com/meno/dropzone/issues/8
                    xhr.timeout = _dropzone.resolveOption(_dropzone.options.timeout, files);

                    // Has to be after `.open()`. See https://github.com/enyo/dropzone/issues/179
                    xhr.withCredentials = !!_dropzone.options.withCredentials;

                    xhr.onload = function (e) {
                        _dropzone._finishedUploading(files, xhr, e);
                    };

                    xhr.onerror = function () {
                        _dropzone._handleUploadError(files, xhr);
                    };

                    // Some browsers do not have the .upload property
                    let progressObj = xhr.upload != null ? xhr.upload : xhr;
                    progressObj.onprogress = function (e) {
                        return _dropzone._updateFilesUploadProgress(files, xhr, e);
                    };

                    const headers = {
                        "Accept": "application/json",
                        "Cache-Control": "no-cache",
                        "X-Requested-With": "XMLHttpRequest"
                    };

                    if (_dropzone.options.headers) {
                        Dropzone.extend(headers, _dropzone.options.headers);
                    }

                    for (let headerName in headers) {
                        let headerValue = headers[headerName];
                        if (headerValue) {
                            xhr.setRequestHeader(headerName, headerValue);
                        }
                    }

                    const formData = new FormData();

                    // Adding all @options parameters
                    if (_dropzone.options.params) {
                        let additionalParams = _dropzone.options.params;
                        if (typeof additionalParams === 'function') {
                            additionalParams = additionalParams.call(_dropzone, files, xhr, files[0].upload.chunked ? _dropzone._getChunk(files[0], xhr) : null);
                        }

                        for (key in additionalParams) {
                            formData.append(key, additionalParams[key]);
                        }
                    }

                    for (key in steamResponse) {
                        formData.append(key, steamResponse[key]);
                    }

                    _dropzone.emit("sending", file, xhr, formData);

                    if (_dropzone.options.uploadMultiple) {
                        _dropzone.emit("sendingmultiple", files, xhr, formData);
                    }

                    _dropzone._addFormElementData(formData);
                    _dropzone.submitRequest(xhr, formData, files);
                });
            }
        }
    }
}
