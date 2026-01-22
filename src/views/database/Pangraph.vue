<template>
  <div style="min-height: 800px">
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
    <iframe
        ref="myIframe"
        src="https://pog.fudan.edu.cn/pangraphviewer/"
        width="100%"
        height="900px"
    ></iframe>
    <!-- 下载链接 -->
    <div style="text-align: center; margin-top: 20px;padding-bottom: 60px;">
      <a
        href="/panhigh/static/example.gfa"
        download
        style="font-size: 16px; color: #409EFF; text-decoration: none;"
      >
        Download .gfa example
      </a>
    </div>
  </div>
</template>
<script setup lang="ts">
</script>
