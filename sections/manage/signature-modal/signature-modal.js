'use strict';

angular.module('knowhub').controller('signatureModal', function ($uibModalInstance, $scope, $document, $window) {

    let $ctrl = this;
    let signaturePad;
    let modalBody;
    let canvas;

    $ctrl.isEmpty = true;

    $uibModalInstance.rendered.then(function () {
        canvas = $document.find(".signature-modal canvas")[0];
        modalBody = $document.find(".signature-modal .modal-body");
        angular.element(canvas).awesomeCursor('pencil', {
            hotspot: 'bottom left'
        });
        signaturePad = new SignaturePad(canvas, {
            onEnd: function () {
                $scope.$evalAsync(function () {
                    $ctrl.isEmpty = false;
                });
            }
        });
        $ctrl.isEmpty = signaturePad.isEmpty;
        angular.element($window).on("resize", resizeCanvas);
        resizeCanvas();
    });

    $scope.$on("$destroy", function () {
        angular.element($window).off("resize");
    });

    $ctrl.clear = function () {
        signaturePad.clear();
        $ctrl.isEmpty = true;
    };

    $ctrl.dismiss = function () {
        $uibModalInstance.dismiss();
    };

    $ctrl.confirm = function () {
        $uibModalInstance.close(getCroppedCanvas());
    };

    function resizeCanvas() {
        let ratio = 1; //Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = modalBody.width() * ratio;
        canvas.height = modalBody.height() * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear();
        $scope.$evalAsync(function () {
            $ctrl.isEmpty = true;
        });
    }

    function getCroppedCanvas() {
        // First duplicate the canvas to not alter the original
        let croppedCanvas = document.createElement('canvas'),
            croppedCtx = croppedCanvas.getContext('2d');

        croppedCanvas.width = canvas.width;
        croppedCanvas.height = canvas.height;
        croppedCtx.drawImage(canvas, 0, 0);

        // Next do the actual cropping
        let w = croppedCanvas.width,
            h = croppedCanvas.height,
            pix = {
                x: [],
                y: []
            },
            imageData = croppedCtx.getImageData(0, 0, croppedCanvas.width, croppedCanvas.height),
            x, y, index;

        for (y = 0; y < h; y++) {
            for (x = 0; x < w; x++) {
                index = (y * w + x) * 4;
                if (imageData.data[index + 3] > 0) {
                    pix.x.push(x);
                    pix.y.push(y);

                }
            }
        }
        pix.x.sort(function (a, b) {
            return a - b;
        });
        pix.y.sort(function (a, b) {
            return a - b;
        });
        let n = pix.x.length - 1;

        w = pix.x[n] - pix.x[0];
        h = pix.y[n] - pix.y[0];
        let cut = croppedCtx.getImageData(pix.x[0], pix.y[0], w, h);

        croppedCanvas.width = w;
        croppedCanvas.height = h;
        croppedCtx.putImageData(cut, 0, 0);

        return croppedCanvas.toDataURL();
    }
});