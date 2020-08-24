const MultiRange = require("multi-integer-range").MultiRange;
const getPixels = require("get-pixels-frame-info-update");
const savePixels = require("save-pixels-jpeg-js-upgrade");

export default function getGifFrames(options, callback) {
  options = options || {};
  callback = callback || function() {};

  return new Promise((resolve, reject) => {
    var url = options.url;
    if (!url) {
      reject(new Error('"url" option is required.'));
      return;
    }
    var frames = options.frames;
    if (!frames && frames !== 0) {
      reject(new Error('"frames" option is required.'));
      return;
    }
    var outputType = options.outputType || "jpg";
    var quality = options.quality;
    var cumulative = options.cumulative;

    var acceptedFrames = frames === "all" ? "all" : new MultiRange(frames);

    var inputType = typeof window === "undefined" ? "image/gif" : ".GIF";
    getPixels(url, inputType, function(err, pixels, framesInfo) {
      if (err) {
        reject(err);
        return;
      }
      if (pixels.shape.length < 4) {
        reject(new Error('"url" input should be multi-frame GIF.'));
        return;
      }
      var frameData = [];
      var maxAccumulatedFrame = 0;
      for (var i = 0; i < pixels.shape[0]; i++) {
        if (acceptedFrames !== "all" && !acceptedFrames.has(i)) {
          continue;
        }
        (function(frameIndex) {
          frameData.push({
            getImage: function() {
              if (cumulative && frameIndex > maxAccumulatedFrame) {
                var lastFrame = pixels.pick(maxAccumulatedFrame);
                for (var f = maxAccumulatedFrame + 1; f <= frameIndex; f++) {
                  var frame = pixels.pick(f);
                  for (var x = 0; x < frame.shape[0]; x++) {
                    for (var y = 0; y < frame.shape[1]; y++) {
                      if (frame.get(x, y, 3) === 0) {
                        frame.set(x, y, 0, lastFrame.get(x, y, 0));
                        frame.set(x, y, 1, lastFrame.get(x, y, 1));
                        frame.set(x, y, 2, lastFrame.get(x, y, 2));
                        frame.set(x, y, 3, lastFrame.get(x, y, 3));
                      }
                    }
                  }
                  lastFrame = frame;
                }
                maxAccumulatedFrame = frameIndex;
              }
              return savePixels(pixels.pick(frameIndex), outputType, {
                quality: quality,
              });
            },
            frameIndex: frameIndex,
            frameInfo: framesInfo && framesInfo[frameIndex],
          });
        })(i);
      }
      resolve(frameData);
    });
  });
}
