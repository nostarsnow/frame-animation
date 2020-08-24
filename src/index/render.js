const render = {
  css(result) {
    let rect = result.rect[result.unit]
    return (
`<style>
.${result.name}{
  width: ${rect.width}${result.unit};
  height: ${rect.height}${result.unit};
  background: url(./${result.filename}) no-repeat 0 0;
  background-size: ${rect.fullWidth}${result.unit} ${rect.fullHeight}${result.unit};
  animation: key-${result.name} ${result.duration}ms ${
        result.loop ? "infinite " : ""
      }steps(${result.files.length});
}
@keyframes key-${result.name} {
  0%{
    background-position: 0 0;
  }
  100%{
    background-position: ${
      result.rows === 1
        ? `-${rect.fullWidth}${result.unit} 0`
        : `0 -${rect.fullHeight}${result.unit}`
    };
  }
}
</style>
<div class="${result.name}"></div>`
    )
  },
  js(result){
    let rect = result.rect[result.unit]
    return (
`<div class="${result.name}" data-src="./${result.filename}"></div>
<script>
  function nsFrameAnimationByJs(options){
    var $box = options.box;
    var src = $box.getAttribute('data-src');
    var img = new Image();
    img.src = src;
    var width = options.width;
    var height = options.height;
    img.onload = function(){
      $box.style.backgroundImage = 'url(' + src + ')';
      $box.style.width = width + options.unit;
      $box.style.height = height + options.unit;
      $box.style.backgroundSize = '${rect.fullWidth}${result.unit} ${rect.fullHeight}${result.unit}';
      frameAnim(0);
    }
    function frameAnim(index){
      var position = (-width * ~~(index%options.cols)) + options.unit + ' ' + (-height * ~~(index/options.cols)) + options.unit;
      $box.style.backgroundPosition = position;
      if ( ++index < options.framesLength ){
        setTimeout(function(){
          frameAnim(index)
        }, 1000/options.framesOnSecond)
      }else{
        if ( options.loop ){
          setTimeout(function(){
            frameAnim(0)
          }, 1000/options.framesOnSecond)
        }
      }
    }
  }
  nsFrameAnimationByJs({
    box: document.querySelector('.${result.name}'),
    width: ${rect.width},
    height: ${rect.height},
    cols: ${result.cols},
    framesLength: ${result.files.length},
    framesOnSecond: ${result.frame},
    loop: ${result.loop},
    unit: '${result.unit}'
  })
</script>`
    )
  },
  canvas(result){
    let rect = result.rect[result.unit]
    return (
`<div class="${result.name}" data-src="./${result.filename}"></div>
<script>
  function nsFrameAnimationByCanvas(options){
    var $box = options.box;
    var src = $box.getAttribute('data-src');
    var img = new Image();
    img.src = src;
    var width = options.width;
    var height = options.height;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    img.onload = function(){
      $box.style.width = width + options.unit;
      $box.style.height = height + options.unit;
      canvas.width = width;
      canvas.height = height;
      $box.appendChild(canvas);
      frameAnim(0);
    }
    function frameAnim(index){
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img,width * ~~(index%options.cols),height * ~~(index/options.cols),
      width, height, 0, 0, width, height);
      if ( ++index < options.framesLength ){
        setTimeout(function(){
          frameAnim(index)
        }, 1000/options.framesOnSecond)
      }else{
        if ( options.loop ){
          setTimeout(function(){
            frameAnim(0)
          }, 1000/options.framesOnSecond)
        }
      }
    }
  }
  nsFrameAnimationByCanvas({
    box: document.querySelector('.${result.name}'),
    width: ${rect.width},
    height: ${rect.height},
    cols: ${result.cols},
    framesLength: ${result.files.length},
    framesOnSecond: ${result.frame},
    loop: ${result.loop}
  })
</script>`
    )
  }
};
export default function(type,result){
  return render[type].call(null,result)
}
