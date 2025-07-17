<template>
  <div>
    <h2>
      Statistics
    </h2>
    <div class="module">
<!--      <h1 class="module-title">Platform Monitor</h1>-->
      <div class="map-scroll-wrapper">
          <div class="map-inner-container">
            <a href='https://clustrmaps.com/site/1c75h'  title='Visit tracker'>
              <img src='//clustrmaps.com/map_v2.png?cl=080808&w=300&t=tt&d=Sx8Dm69Q9ndVaydehRwldv9vPNXIb6wSeisysWB7KVc&co=ffffff&ct=808080'/>
            </a>

        </div>
      </div>
    </div>
  </div>

<!--      <p>China has been an important part of the global force of human-->
<!--        genomics since the Human Genome Project, the International HapMap Project, and the 1000 Genomes Project.-->
<!--        Despite regional efforts are crucial considering the differentiated genetic makeups of populations in-->
<!--        different geographical places as we have shown in this first report of CPC, we believe there is great room for-->
<!--        international collaborations to increase between China and other countries in building the pangenome reference-->
<!--        and applying for various basic and clinical research. Similar to many other collaborative projects in human-->
<!--        genomics, the success of CPC requires a large team of scientists with expertise in population genomics, genome-->
<!--        sequencing technologies, computational biology, and ethics, within China as well as international-->
<!--        collaborations. CPC also aims to improve and broaden foundational genomic data resources to be shared with-->
<!--        both domestic and international communities.-->
<!--      </p>-->


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
