(function() {
    this.rgba_to_png = rgba_to_png;

    function rgba_to_png() {
        var elem;
        while(elem = document.getElementsByClassName('rgba')[0]) {
            var paras = elem.dataset;
            var bytes = process(elem.firstChild.nodeValue, paras);
            var img = create(bytes, paras);
            img.title = elem.title;
            elem.parentNode.replaceChild(img, elem);
        }
    }

    var HEX = {
        '0' : 0,  '1' : 1,  '2' : 2,  '3' : 3,  '4' : 4,
        '5' : 5,  '6' : 6,  '7' : 7,  '8' : 8,  '9' : 9,
        'a' : 10, 'b' : 11, 'c' : 12, 'd' : 13, 'e' : 14, 'f' : 15,
        'A' : 10, 'B' : 11, 'C' : 12, 'D' : 13, 'E' : 14, 'F' : 15,
    };

    function at(str, pos) { return str.charAt(pos) }

    function hex(str, offset) {
        offset = offset || 0;
        return +HEX[at(str, offset)]
    }

    function hex2(str, offset) {
        offset = offset || 0;
        return HEX[at(str, offset)] * 0x10 + +HEX[at(str, offset + 1)]
    }

    function toMap(str) {
        var map = {};
        var toks = (str || '').split(/\s+/);
        for(var i = 0; i < toks.length; )
            map[toks[i++]] = toks[i++];

        return map;
    }

    function process(code, paras) {
        var width = paras.rgbaWidth;
        var height = paras.rgbaHeight;
        var map = toMap(paras.rgbaMap);
        var bytes = new Uint8ClampedArray(width * height * 4);
        var toks = code.split(/\s+/);

        var j = 0;
        for(var i = 0; i < toks.length; ++i) {
            if(j === bytes.length)
                return bytes;

            var tok = toks[i];
            if(tok.length === 0)
                continue;

            if(map.hasOwnProperty(tok))
                tok = map[tok];

            switch(tok.length) {
                case 1: {
                    var val = hex(tok);
                    if(isNaN(val)) break;
                    var dark = !(val & 8);
                    bytes[j++] = 0xFF * !!(val & 1) >> dark;
                    bytes[j++] = 0xFF * !!(val & 2) >> dark;
                    bytes[j++] = 0xFF * !!(val & 4) >> dark;
                    bytes[j++] = 0xFF * !(val === 8);
                    continue;
                }

                case 2: {
                    var val = hex2(tok);
                    if(isNaN(val)) break;
                    bytes[j++] = val;
                    bytes[j++] = val;
                    bytes[j++] = val;
                    bytes[j++] = 0xFF;
                    continue;
                }

                case 3: {
                    bytes[j++] = hex(tok, 0) * 0x11;
                    bytes[j++] = hex(tok, 1) * 0x11;
                    bytes[j++] = hex(tok, 2) * 0x11;
                    bytes[j++] = 0xFF;
                    continue;
                }

                case 4: {
                    bytes[j++] = hex(tok, 0) * 0x11;
                    bytes[j++] = hex(tok, 1) * 0x11;
                    bytes[j++] = hex(tok, 2) * 0x11;
                    bytes[j++] = hex(tok, 3) * 0x11;
                    continue;
                }

                case 6: {
                    bytes[j++] = hex2(tok, 0);
                    bytes[j++] = hex2(tok, 2);
                    bytes[j++] = hex2(tok, 4);
                    bytes[j++] = 0xFF;
                    continue;
                }

                case 8: {
                    bytes[j++] = hex2(tok, 0);
                    bytes[j++] = hex2(tok, 2);
                    bytes[j++] = hex2(tok, 4);
                    bytes[j++] = hex2(tok, 6);
                    continue;
                }
            }

            console.log('RGBA parse failure: ' + tok);
            return null;
        }

        console.log('RGBA insufficient data: ' + j/4 + '/' +
            bytes.length/4 + ' pixels');
        return null;
    }

    function create(bytes, paras) {
        var width = paras.rgbaWidth;
        var height = paras.rgbaHeight;
        var scale = paras.rgbaScale || 1;
        var softScale = paras.rgbaSoftScale || 1;

        var cv = document.createElement('canvas');
        cv.width = width * scale;
        cv.height = height * scale;

        var data = new ImageData(bytes, width, height);
        var ctx = cv.getContext('2d');
        ctx.putImageData(scaleImageData(ctx, data, scale), 0, 0);

        var img = new Image(
            (width * scale * softScale) >> 0,
            (height * scale * softScale) >> 0);

        img.src = cv.toDataURL();
        return img;
    }

    function scaleImageData(ctx, imageData, scale) {
        var scaled = ctx.createImageData(imageData.width * scale,
            imageData.height * scale);

        var subLine = ctx.createImageData(scale, 1).data

        for(var row = 0; row < imageData.height; row++) {
            for(var col = 0; col < imageData.width; col++) {
                var sourcePixel = imageData.data.subarray(
                    (row * imageData.width + col) * 4,
                    (row * imageData.width + col) * 4 + 4
                );
                for(var x = 0; x < scale; x++) subLine.set(sourcePixel, x * 4)
                for(var y = 0; y < scale; y++) {
                    var destRow = row * scale + y;
                    var destCol = col * scale;
                    scaled.data.set(subLine,
                        (destRow * scaled.width + destCol) * 4)
                }
            }
        }

        return scaled;
    }
})();
