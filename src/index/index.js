import CodeView from "../code/CodeView.vue";
import getGifFrames from "../getGifFrames";
import render from "./render";
export default {
  name: "ns-frame-animation",
  data() {
    let form = {
      files: [],
      col: 7,
      renderType: "css",
      frame: 25,
      loop: true,
      unit: "px",
      rem2px: "100",
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
        let fontSize =
          this.result.unit === "rem" ? `${this.result.rem2px}px` : "14px";
        this.$refs.iframe.contentWindow.document.querySelector(
          "head"
        ).innerHTML = "";
        this.$refs.iframe.contentWindow.document.body.innerHTML = "";
        this.$refs.iframe.contentWindow.document.write(
          `<style>*{padding:0;margin:0;}html{font-size:${fontSize}}</style>` +
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
        if (!/\.gif$/i.test(this.value)) {
          $vm.$msg.error("请上传正确的gif图片！");
          return;
        }
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
      if (renderType === "canvas") {
        this.form.unit = "px";
      }
      this.isShowModal = false;
    },
    min() {
      this.form.col = 1;
    },
    max() {
      this.form.col = this.form.files.length;
    },
    generate(files) {
      let { form, cols, rows, duration } = this;
      let { col, frame, loop, renderType, unit, rem2px } = form;
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
      let rect = {
        px: {
          fullWidth,
          fullHeight,
          width,
          height,
          unit,
        },
        rem: {
          fullWidth: (fullWidth / rem2px).toFixed(4),
          fullHeight: (fullHeight / rem2px).toFixed(4),
          width: (width / rem2px).toFixed(4),
          height: (height / rem2px).toFixed(4),
          unit,
        },
      };
      let result = {
        image,
        name,
        filename: `${name}.png`,
        fileSize: (window.atob(image.split(",")[1]).length / 1024).toFixed(2),
        rect,
        unit,
        rem2px,
        rows,
        cols,
        files,
        frame: frame,
        loop: loop,
        renderType,
        duration,
      };
      result.html = render(result.renderType, result);
      this.result = result;
    },
    onSave() {
      let { filename, image } = this.result;
      this.$download(image, filename);
      this.$notify.success("保存成功！");
    },
    rem2pxChange() {
      let rem2px = this.form.rem2px;
      rem2px = rem2px.replace(/\D/g, "");
      if (rem2px) {
        if (+rem2px < 1) {
          this.form.rem2px = 1;
        } else {
          this.form.rem2px = rem2px;
        }
      } else {
        this.form.rem2px = 1;
      }
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
