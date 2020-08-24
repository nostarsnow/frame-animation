import CodeView from "../code/CodeView.vue";
import getGifFrames from "../getGifFrames";
export default {
  name: "ns-frame-animation",
  data() {
    let form = {
      files: [],
      col: 7,
      renderType: "css",
      frame: 25,
      loop: true,
    };
    return {
      form,
      formStr: JSON.stringify(form),
      colDisabled: false,
      sourceType: "png",
      gifValue: "",
      loading: false,
      isShowModal: false,
      result: {},
    };
  },
  mounted() {
    this.initUpload();
  },
  methods: {
    async onSubmit() {
      let form = this.form;
      if (form.files.length < 1) {
        if (this.sourceType === "png") {
          this.$notify.error("请选择png文件夹并保证文件夹下存在png图片！");
        } else {
          this.$notify.error("请选择gif图片！");
        }
        return false;
      }
      this.loading = true;
      this.generate(this.form.files);
      if (this.result.image.length === 6) {
        this.$notify.error({
          message: `生成失败！最终图片宽高度(${this.result.fullWidth}*${this.result.fullHeight})大于浏览器最大限制16380*16380，请更换渲染方式或每行个数调整后再重新生成！`,
          duration: 10000,
        });
        this.loading = false;
        this.result = {};
        return;
      }
      this.$notify.success("生成成功！");
      this.loading = false;
      this.$nextTick(() => {
        this.$refs.iframe.contentWindow.document.body.innerHTML = "";
        this.$refs.iframe.contentWindow.document.write(
          `<style>*{padding:0;margin:0;}</style>` +
            this.result.html.replace(
              `./${this.result.filename}`,
              this.result.image
            )
        );
      });
    },
    async formatPng(files) {
      return await Promise.all(
        files.map(async (v) => {
          let img = await this.getFileClientRect(v);
          let data = await this.getFileBase64(v);
          return {
            name: v.name,
            img,
            width: img.width,
            height: img.height,
            data,
          };
        })
      );
    },
    async formatGif(file) {
      let data = await this.getFileBase64(file);
      return new Promise((resolve) => {
        getGifFrames({
          url: data,
          frames: "all",
          outputType: "canvas",
          cumulative: true,
        })
          .then(async (frameData) => {
            resolve({
              frame: ~~(100 / frameData[0].frameInfo.delay),
              files: await Promise.all(
                frameData.map(async (v, i) => {
                  let data = v.getImage().toDataURL();
                  let img = await this.getBase64ClientRect(data);
                  return {
                    name: i + 1,
                    img,
                    width: img.width,
                    height: img.height,
                    data,
                  };
                })
              ),
            });
          })
          .catch(console.error.bind(console));
      });
    },
    getFileClientRect(file) {
      return new Promise((resolve) => {
        let img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = function(e) {
          resolve(img);
        };
      });
    },
    getBase64ClientRect(base64) {
      return new Promise((resolve) => {
        let img = new Image();
        img.src = base64;
        img.onload = function(e) {
          resolve(img);
        };
      });
    },
    getFileBase64(file) {
      return new Promise((resolve) => {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(e) {
          resolve(e.target.result);
        };
      });
    },
    typeChange() {
      this.form = JSON.parse(this.formStr);
      this.colDisabled = false;
      this.isShowModal = false;
    },
    renderTypeChange() {
      this.uploaded();
    },
    initUpload() {
      const $vm = this;
      const uploadGif = this.$refs.uploadGif;
      const uploadPng = this.$refs.uploadPng;
      uploadGif.addEventListener("change", async function(e) {
        $vm.gifValue = this.value;
        let file = e.target.files[0];
        let data = await $vm.formatGif(file);
        $vm.form.frame = data.frame;
        $vm.form.files = data.files;
        $vm.uploaded();
        this.value = "";
      });
      uploadPng.addEventListener("change", async function(e) {
        let files = [].filter
          .call(e.target.files, (v) => /\.png/.test(v.name))
          .sort((a, b) => {
            let an = +a.name.replace(/\D/g, "");
            let bn = +b.name.replace(/\D/g, "");
            return an - bn;
          });
        $vm.form.files = await $vm.formatPng(files);
        $vm.uploaded();
        this.value = "";
      });
    },
    uploaded() {
      let { col, files, renderType } = this.form;
      if (col > files.length) {
        col = files.length;
      }
      if (renderType === "css") {
        this.form.col = files.length;
        this.colDisabled = true;
      } else {
        this.colDisabled = false;
      }
      this.isShowModal = false;
    },
    min() {
      this.form.col = 1;
    },
    max() {
      this.form.col =
        this.form.files.length > 0 ? this.form.files.length : this.maxCol;
    },
    generate(files) {
      let { form, cols, rows, duration } = this;
      let { col, frame, loop, renderType } = form;
      let { width, height } = files[0];
      let canvas = document.createElement("canvas");
      let fullWidth = width * cols;
      let fullHeight = height * rows;
      canvas.setAttribute("width", fullWidth);
      canvas.setAttribute("height", fullHeight);
      canvas.style.width = fullWidth + "px";
      canvas.style.height = fullHeight + "px";
      let ctx = canvas.getContext("2d");
      files.forEach((v, i) => {
        ctx.drawImage(
          v.img,
          width * ~~(i % col),
          height * ~~(i / col),
          width,
          height
        );
      });
      let image = canvas.toDataURL();
      let name = `ns-frame-${String(+new Date()).substr(6)}`;
      let result = {
        image,
        name,
        filename: `${name}.png`,
        fullSize: (window.atob(image.split(",")[1]).length / 1024).toFixed(2),
        fullWidth,
        fullHeight,
        rows,
        cols,
        files,
        frame: frame,
        loop: loop,
        renderType,
        width,
        height,
        duration,
      };
      result.html = this.generateHtml(result);
      this.result = result;
    },
    generateHtml(result) {
      if (result.renderType === "css") {
        return `<style>
  .${result.name}{
    width: ${result.width}px;
    height: ${result.height}px;
    background: url(./${result.filename}) no-repeat 0 0;
    background-size: ${result.fullWidth}px ${result.fullHeight}px;
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
          ? "-" + result.fullWidth + "px 0"
          : "0 -" + result.fullHeight + "px"
      };
    }
  }
</style>
<div class="${result.name}"></div>`;
      }
      if (result.renderType === "js") {
        return `<div class="${result.name}" data-src="./${result.filename}"></div>
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
      $box.style.width = width + 'px';
      $box.style.height = height + 'px';
      frameAnim(0);
    }
    function frameAnim(index){
      var position = (-width * ~~(index%options.cols)) + 'px ' + (-height * ~~(index/options.cols)) + 'px';
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
    width: ${result.width},
    height: ${result.height},
    cols: ${result.cols},
    framesLength: ${result.files.length},
    framesOnSecond: ${result.frame},
    loop: ${result.loop}
  })
</script>`;
      }
      if (result.renderType === "canvas") {
        return `<div class="${result.name}" data-src="./${result.filename}"></div>
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
      $box.style.width = width + 'px';
      $box.style.height = height + 'px';
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
    width: ${result.width},
    height: ${result.height},
    cols: ${result.cols},
    framesLength: ${result.files.length},
    framesOnSecond: ${result.frame},
    loop: ${result.loop}
  })
</script>`;
      }
    },
    onSave() {
      let { filename, image } = this.result;
      this.$download(image, filename);
      this.$notify.success("保存成功！");
    },
  },
  computed: {
    rows() {
      return (
        ~~(this.form.files.length / this.form.col) +
        +!!~~(this.form.files.length % this.form.col)
      );
    },
    cols() {
      return this.form.col;
    },
    duration() {
      return ((this.form.files.length / this.form.frame) * 1000).toFixed(2);
    },
  },
  components: {
    CodeView,
    FrameModal: () => import("../frameModal/index.vue"),
  },
};
