<template>
  <div>
    <h2>Statistics</h2>

    <div class="module">
      <!-- 可选模块标题 -->
      <!-- <h1 class="module-title">Platform Monitor</h1> -->

      <p class="map-description">
        This map shows the geographic distribution of visitors to this site in real time. Your visit may be reflected here!
      </p>

      <div class="map-scroll-wrapper">
        <div class="map-inner-container">
          <a href='https://clustrmaps.com/site/1c75i' title='Visit tracker'>
            <img src='//clustrmaps.com/map_v2.png?cl=ffffff&w=900&t=n&d=Jep35PyKwkjIy_1isBFHO3WQowUUZG_poldVyKPA--w&co=cec6c6&ct=ffffff' />
          </a>
        </div>
      </div>

      <!-- 空白区域 -->
      <div style="height: 40px;"></div>
    </div>
  </div>
</template>
<script>
// const script = document.createElement('script');
// script.id = 'clustrmaps';
// script.type = 'text/javascript';
// script.src = '//clustrmaps.com/map_v2.js?d=Sx8Dm69Q9ndVaydehRwldv9vPNXIb6wSeisysWB7KVc&cl=ffffff&w=a';
// document.getElementById('clustrmaps-container')?.appendChild(script);
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'About'
}
</script>

<style lang="scss" scoped>
@import '@/scss/index.scss';

.el-tabs__content {
  overflow: hidden;
  position: relative;
}

.title {
  //background-color: #f6f8fd;
  border-radius: 5px;
  height: 60px;
  color: #285fca;
  line-height: 60px;
  font-size: 24px;
  font-weight: 540;
  padding-left: 15px;
}

.icon-group {
  display: flex;
  justify-content: space-between;
  width: 490px;
  margin-bottom: 20px;
}

.icon-border {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 100%;
  border: 1.5px solid #e4e7ed;
  width: 55px !important;
  height: 55px;
  //box-shadow: 0 4px 15px 0 rgb(0 0 0 / 10%);
}

.icon-img {
  display: inline-block;
  height: 30px;
  width: 30px;
  position: absolute;
  margin: auto;
}

.icon-title {
  margin-top: 7px;
  margin-bottom: 2px;
  color: #909399;
}

h4 {
  margin: 0;
}
.map-inner-container {
  width: 100%;
  max-width: 1000px; /* 你希望的最大宽度 */
  margin: 0 auto;
}

.map-inner-container img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin-left: 8px;
  font-size: 20px;
  color: #5F74A4FF;
}

p {
  color: #606266;
  font-size: 18px;
}
</style>
