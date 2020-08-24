<template>
  <div class="index">
    <h1>ns frame by frame animation - 逐帧动画生成器</h1>
    <h2>推荐使用chrome及同内核浏览器访问 <iframe src="https://ghbtns.com/github-btn.html?user=nostarsnow&repo=frame-animation&type=star&count=true&size=large&v=2" frameborder="0" scrolling="0" width="160px" height="30px"></iframe></h2>
    <el-form ref="form" :model="form" label-width="200px" class="form">
      <el-form-item label="请选择图片类型：">
        <el-radio-group v-model="sourceType" @change="typeChange">
          <el-radio label="png">png文件夹</el-radio>
          <el-radio label="gif">gif图片</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="请选择png文件夹：" v-show="sourceType === 'png'">
        <div class="upload-box upload-png">
          <input type="file" webkitdirectory ref="uploadPng" />
          <div class="text">
            <el-button type="primary" circle icon="el-icon-upload"></el-button>
            <span class="tip">
              <span v-if="form.files.length > 0">
                已选
                <el-tag type="warning"
                  >{{ form.files.length }} 张png图片</el-tag
                >
              </span>
              <span v-else>请选择包含所有帧图片的文件夹。</span>
            </span>
          </div>
          <div class="text">
            <span class="tip">自动排序方式为png图片名称过滤非数字字符后正序</span>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="请选择gif文件：" v-show="sourceType === 'gif'">
        <div class="upload-box upload-gif">
          <input type="file" accept="image/gif" ref="uploadGif" />
          <div class="text">
            <el-button type="primary" circle icon="el-icon-upload2"></el-button>
            <span class="tip">
              <span v-if="form.files.length > 0">
                {{ gifValue }}。已选
                <el-tag type="warning">{{ form.files.length }} 帧</el-tag>
              </span>
              <span v-else>请选择gif图片。</span>
            </span>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="雪碧图每行个数：">
        <el-tag class="min" @click="min">最小</el-tag>
        <el-input-number
          size="mini"
          v-model="form.col"
          :min="1"
          :disabled="colDisabled"
        ></el-input-number>
        <el-tag class="max" @click="max">最大</el-tag>
        <span class="tip" v-if="form.files.length">
          共生成{{ rows }}行{{ cols }}列
        </span>
      </el-form-item>
      <el-form-item label="动画帧数：">
        <el-input-number
          size="mini"
          v-model="form.frame"
          :min="1"
        ></el-input-number>
        <el-tooltip
          content="每秒多少帧/张图片。数字越小动画效果越差。问UI"
          placement="top"
          style="margin:0 5px;"
        >
          <i class="el-icon-question"></i>
        </el-tooltip>
        <span class="tip" v-if="form.files.length">
          动画时间约为{{ duration }}毫秒
        </span>
      </el-form-item>
      <el-form-item label="渲染方式：">
        <el-radio-group v-model="form.renderType" @change="renderTypeChange">
          <el-radio label="css">css</el-radio>
          <el-radio label="js">js</el-radio>
          <el-radio label="canvas">canvas</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="渲染单位：">
        <el-radio-group v-model="form.unit">
          <el-radio label="px">px</el-radio>
          <el-radio label="rem" :disabled="form.renderType == 'canvas'">rem</el-radio>
        </el-radio-group>
        <span class="rem-box" v-if="form.unit === 'rem'">
          <el-input v-model="form.rem2px" size="mini" @change="rem2pxChange">
            <template slot="prepend">1rem =</template>
            <template slot="append">px</template>
          </el-input>
        </span>
      </el-form-item>
      <el-form-item label="循环播放：">
        <div>
          <el-switch
            v-model="form.loop"
            active-color="#13ce66"
            inactive-color="#ff4949"
          ></el-switch>
          <el-tooltip
            content="播放只有1次和无数次"
            placement="top"
            style="margin: 0 10px 0 5px"
          >
            <i class="el-icon-question"></i>
          </el-tooltip>
          <el-button
            class="show-view"
            v-if="form.files.length > 0"
            @click="isShowModal = true"
            >查看所有的帧图片</el-button
          >
        </div>
      </el-form-item>
      <el-form-item class="el-form-btn">
        <el-button
          :type="loading ? 'info' : 'primary'"
          @click="onSubmit"
          :style="{
            width: '300px',
            marginTop: '10px',
          }"
          :loading="loading"
          >{{ loading ? "正在生成..." : "立即生成" }}</el-button
        >
      </el-form-item>
    </el-form>
    <div class="result" v-if="result.html">
      <hr />
      <div class="img">
        <div class="l">
          <img :src="result.image" @click="onSave" />
        </div>
        <div class="r">
          <p>图片名称：{{ result.filename }}</p>
          <p>图片大小：约{{ result.fileSize }}KB</p>
          <p>图片尺寸：{{ result.rect[result.unit].fullWidth }}{{ result.unit }} × {{ result.rect[result.unit].fullHeight }}{{ result.unit }}</p>
          <p>
            图片行列：{{ result.rows }}行{{ result.cols }}列，共{{
              result.files.length
            }}帧
          </p>
          <p>每秒帧数：{{ result.frame }}</p>
          <p>每帧尺寸：{{ result.rect[result.unit].width }}{{ result.unit }} × {{ result.rect[result.unit].height }}{{ result.unit }}</p>
          <p>动画时长：{{ result.duration }}毫秒</p>
          <p>是否循环：{{ result.loop ? "循环播放" : "播放一次" }}</p>
          <div class="save-box">
            <el-tooltip
              content="如果图片太大点击按钮无法保存，请自行在左侧图片区域右击另存为，然后改名"
              placement="top"
            >
              <el-button type="primary" @click="onSave" icon="el-icon-download"
                >保存图片</el-button
              >
            </el-tooltip>

            <a href="https://tinypng.com/" target="_blank">压缩图片</a>
          </div>
        </div>
      </div>
      <CodeView :code="result.html" />
      <div class="iframe">
        <h3>预览：</h3>
        <iframe ref="iframe" src="about:blank" :width="result.rect.px.width + 'px'" :height="result.rect.px.height + 'px'"></iframe>
      </div>
    </div>
    <FrameModal
      v-if="isShowModal"
      :files="form.files"
      @close="isShowModal = false"
    />
  </div>
</template>

<script>
import index from "./index.js";
export default index;
</script>

<style lang="less">
@import "./index.less";
</style>
