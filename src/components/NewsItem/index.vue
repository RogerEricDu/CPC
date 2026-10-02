<template>
  <div>
    <el-row class="news-header">
      <el-col :span="18">
        <el-link :underline="false">{{ news.author }}</el-link>
        <el-divider direction="vertical"/>
        <el-link :underline="false" type="info">{{
            new Date(news.publishTime).toLocaleDateString().split('/').join('-')
          }}
        </el-link>
        <el-divider direction="vertical"/>
        <div v-if="news.tags" class="inline-div">
          <span v-for="(newsLabel, index) in news.tags.split(';')" :key="newsLabel.id" class="label-group">
            <el-link :underline="false" type="primary" style="text-transform:capitalize;">{{ newsLabel }}</el-link>
            <span v-if="index!==(news.tags.split(';').length-1)" class="splitter">·</span>
          </span>
        </div>
      </el-col>
      <el-col :span="6">
        <span class="news-tag">{{ news.category }}</span>
      </el-col>
    </el-row>
<!--    <div :key="$route.fullPath" class="news-main" @click="detailHandler(news.id)">-->
    <div
        :key="$route.fullPath"
        class="news-main"
        @click="news.category !== 'Meeting' && detailHandler(news.id)"
    >
      <el-row :gutter="40">
        <el-col :span="news.filepath? 18 : 24">
          <h4 class="news-title">
            {{ news.title }}
          </h4>
<!--          <p class="news-content">-->
<!--            {{ formatContent(news.content) }}-->
<!--          </p>-->
          <p class="news-content">
            {{ news.category === 'Meeting' ? news.content : formatContent(news.content) }}
          </p>
          <!-- Meeting news images -->
          <div v-if="news.category === 'Meeting'" class="meeting-images">

            <!-- Singapore, Sep 27 -->
            <img
                v-if="news.id === '20260927'"
                src="@/assets/img/news/260930_speach.jpg"
                alt="Oxford Nanopore APAC Health Summit 2026"
            >

            <!-- Beijing, May 28 -->
            <img
                v-if="news.id === '20260528'"
                src="@/assets/img/news/260528_bj.jpg"
                alt="Oxford Nanopore WYMM Tour Beijing"
            >

            <!-- Fukuoka, May 12 -->
            <img
                v-if="news.id === '20260512'"
                src="@/assets/img/news/260512_jp.jpg"
                alt="PacBio PRISM 2026"
            >

            <!-- London, Mar 25 -->
            <img
                v-if="news.id === '20260325'"
                src="@/assets/img/news/260325_ld.jpg"
                alt="Oxford Nanopore Global Health Summit 2026"
            >

          </div>
<!--          <div class="icon-group">-->
<!--            <i class="el-icon-view"/><span class="icon-num">{{ news.viewnum }}</span>-->
<!--            <i class="el-icon-star-off"/><span class="icon-num">{{ news.starnum }}</span>-->
<!--            <i class="el-icon-chat-round"/><span class="icon-num">{{ news.commentnum }}</span>-->
<!--          </div>-->
        </el-col>
        <el-col v-if="news.filepath" :span="6">
          <!--          <img class="news-img" :src="nginxURL + UPLOAD_PATH['newscover'] + news.filepath">-->
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script>

export default {
  props: ['news'],
  data() {
    return {}
  },
  methods: {
    formatDate(dateObj) {
      const d = [dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate()].join('-')
      return d
    },
    formatContent(content) {
      if (content.length < 300) {
        return content
      }
      const res = content.substring(0, 250)

      return res + ' ......'
    },
    detailHandler(id) {
      this.$router.push({
        path: '/news/detail',
        query: {

        }
      })
    }
  }
}
</script>

<style scoped>
.inline-div {
  display: inline-block;
}

.news-main:hover {
  cursor: pointer;
}

.icon-num {
  margin-right: 10px;
  margin-left: 4px;
  font-size: 14px;

}

.icon-group {
  margin-top: 10px;
  /* margin-left: -3px; */
}

.news-header {
  margin-bottom: 20px;
}

.news-img {
  float: right;
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.news-content {
  font-size: 14px;
  text-align: justify;
  color: #606266;
  margin-top: 10px;
}

.news-tag {
  float: right;
  color: #65B787;
  font-weight: 550;
  font-size: 14px;
  margin-top: 2.5px;
  text-transform: capitalize;
}

.splitter {
  margin-left: 7px;
  margin-right: 7px;
}

.sort-by {
  padding: 10px 20px 10px 38px;
  text-align: right;

}

.demonstration {
  margin-right: 8px;
}

.top-search {
  padding: 20px;
  /* box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.05); */
}

.main-wrapper {
  padding-top: 20px;
  padding-bottom: 40px;
  background-color: #F4F5F5;
  min-height: 100%;
}

.container {
  width: 1050px;
  display: block;
  background-color: #fff;
  z-index: 50px;
  margin: auto;
  margin-top: 0;
  min-height: 100%;
  /* text-align: center; */
}
  .meeting-images {
    margin-top: 16px;
  }

  .meeting-images img {
    display: block;
    width: 100%;
    max-width: 750px;
    height: auto;
    margin-top: 12px;
  }

</style>
