<template>
  <div style="padding: 0px 10px 20px">
    <!-- 新增的 CPC Phase II 部分 -->
    <div style="position: relative; z-index: 1;">
      <!-- 认证描述文字 -->
      <div style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #5979c2;">
        <h2>The CPC Phase II Data Availability</h2>
        The release of the CPC Phase II data has been approved by the National Health Commission of the People's Republic of China (No. 2025BAT01059). The CPC2 assemblies, summary data and more detailed information are freely available at the CPC website (<a href=" ">https://pog.fudan.edu.cn/cpc</a >). The raw data are available at the National Genomics Data Center (<a href="https://ngdc.cncb.ac.cn/gwh">https://ngdc.cncb.ac.cn/gwh</a >) under the BioProject PRJCA046231.
      </div>
    </div>
    
    <!-- 认证界面 -->
    <div v-if="!isPhase2Authenticated" style="background-color: #fff; padding: 40px 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #e0e0e0; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto;">
        <div style="margin-bottom: 30px;">
          <div style="font-size: 24px; font-weight: 600; color: #5979c2; margin-bottom: 10px;">
            🔐 Access Required
          </div>
          <div style="font-size: 16px; color: #666;">
            Please enter the security key to access CPC Phase II data
          </div>
        </div>
        
        <div style="margin-bottom: 25px;">
          <div style="position: relative;">
            <input
              v-model="phase2AccessKey"
              type="password"
              placeholder="Enter security key"
              @keyup.enter="checkPhase2Access"
              style="width: 100%; padding: 12px 20px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box;"
            />
            <div style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: #999;">
              🔑
            </div>
          </div>
          <div v-if="phase2AuthError" style="color: #dc3545; margin-top: 10px; font-size: 14px;">
            {{ phase2AuthError }}
          </div>
        </div>
        
        <button 
          @click="checkPhase2Access"
          style="padding: 12px 30px; background: #5979c2; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; transition: background 0.3s;"
          @mouseover="e => e.target.style.background = '#4865a3'"
          @mouseout="e => e.target.style.background = '#5979c2'"
        >
          Access CPC Phase II Data
        </button>
        
        <div style="margin-top: 25px; font-size: 14px; color: #888;">
          For access requests, please contact: <span style="color: #5979c2;">cpc@fudan.edu.cn</span>
        </div>
      </div>
    </div>
    
    <!-- 已认证显示的数据内容 -->
    <div v-else>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <!-- 登出按钮和会话倒计时 -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <div v-if="sessionTimeLeft > 0" style="font-size: 14px; color: #666; display: flex; align-items: center; gap: 5px;">
            <span>⏳ Session expires in:</span>
            <span style="font-weight: 500; color: #5979c2;">
              {{ formatTime(sessionTimeLeft) }}
            </span>
          </div>
          <div v-else style="font-size: 14px; color: #dc3545; display: flex; align-items: center; gap: 5px;">
            <span>⚠️ Session expired</span>
          </div>
          
          <div style="display: flex; gap: 10px;">
            <button 
              @click="extendSession"
              style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
            >
              Extend 15 min
            </button>
            <button 
              @click="logoutPhase2"
              style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
            >
              Logout
            </button>
          </div>
        </div>
        
        <!-- 搜索和过滤 -->
        <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
          <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div style="flex: 1; min-width: 300px;">
              <div style="position: relative;">
                <input
                  v-model="searchQuery2"
                  @input="filterSamples"
                  type="text"
                  placeholder="Search samples (e.g. CPCERZ200001 or 200001)"
                  style="width: 100%; padding: 10px 15px 10px 40px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
                />
                <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999;">
                  🔍
                </div>
              </div>
            </div>
            
            <div style="display: flex; gap: 10px; align-items: center;">
              <span style="font-weight: 500; color: #666;">File Type:</span>
              <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <input type="checkbox" v-model="showHaplotype1" @change="filterSamples" style="cursor: pointer;">
                <span>.1 files (Haplotype 1)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                <input type="checkbox" v-model="showHaplotype2" @change="filterSamples" style="cursor: pointer;">
                <span>.2 files (Haplotype 2)</span>
              </label>
            </div>
          </div>
        </div>
        
        <!-- 文件数量统计 -->
        <div style="margin-bottom: 20px; font-size: 14px; color: #666;">
          Showing {{ filteredSamples.length }} of {{ allSamples.length }} files
          <span v-if="searchQuery2" style="color: #5979c2; font-weight: 500;">
            (Search: "{{ searchQuery2 }}")
          </span>
        </div>
        
        <!-- 样本文件列表 -->
        <div style="max-height: 600px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 6px; background: white;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: #f5f7fa;">
              <tr>
                <th style="padding: 12px 15px; text-align: left; border-bottom: 2px solid #e0e0e0; min-width: 150px;">
                  Sample
                </th>
                <th style="padding: 12px 15px; text-align: left; border-bottom: 2px solid #e0e0e0;">
                  FASTA (.fa.gz)
                </th>
                <th style="padding: 12px 15px; text-align: left; border-bottom: 2px solid #e0e0e0;">
                  Index (.fai)
                </th>
                <th style="padding: 12px 15px; text-align: left; border-bottom: 2px solid #e0e0e0;">
                  GZI (.gzi)
                </th>
                <th style="padding: 12px 15px; text-align: left; border-bottom: 2px solid #e0e0e0;">
                  Checksum (.md5)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sample in filteredSamples" :key="sample.id" style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 15px; vertical-align: top; font-weight: 500; color: #4343d0;">
                  {{ sample.displayName }}
                </td>
                <td style="padding: 12px 15px; vertical-align: top;">
                  <a 
                    :href="`${fileUrlPhase2}/${sample.sampleName}/${sample.fastaFile}`" 
                    :download="sample.fastaFile"
                    target="_blank"
                    style="color: var(--bs-link-color); text-decoration: none; display: inline-block; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;"
                    @mouseover="e => e.target.style.background = '#f0f7ff'"
                    @mouseout="e => e.target.style.background = 'transparent'"
                  >
                    📄 {{ sample.fastaFile }}
                  </a>
                </td>
                <td style="padding: 12px 15px; vertical-align: top;">
                  <a 
                    :href="`${fileUrlPhase2}/${sample.sampleName}/${sample.faiFile}`" 
                    :download="sample.faiFile"
                    target="_blank"
                    style="color: var(--bs-link-color); text-decoration: none; display: inline-block; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;"
                    @mouseover="e => e.target.style.background = '#f0f7ff'"
                    @mouseout="e => e.target.style.background = 'transparent'"
                  >
                    📑 {{ sample.faiFile }}
                  </a>
                </td>
                <td style="padding: 12px 15px; vertical-align: top;">
                  <a 
                    :href="`${fileUrlPhase2}/${sample.sampleName}/${sample.gziFile}`" 
                    :download="sample.gziFile"
                    target="_blank"
                    style="color: var(--bs-link-color); text-decoration: none; display: inline-block; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;"
                    @mouseover="e => e.target.style.background = '#f0f7ff'"
                    @mouseout="e => e.target.style.background = 'transparent'"
                  >
                    📊 {{ sample.gziFile }}
                  </a>
                </td>
                <td style="padding: 12px 15px; vertical-align: top;">
                  <a 
                    :href="`${fileUrlPhase2}/${sample.sampleName}/${sample.md5File}`" 
                    :download="sample.md5File"
                    target="_blank"
                    style="color: var(--bs-link-color); text-decoration: none; display: inline-block; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;"
                    @mouseover="e => e.target.style.background = '#f0f7ff'"
                    @mouseout="e => e.target.style.background = 'transparent'"
                  >
                    🔍 {{ sample.md5File }}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- 空状态提示 -->
          <div v-if="filteredSamples.length === 0" style="text-align: center; padding: 40px; color: #999;">
            <div style="font-size: 48px; margin-bottom: 20px;">📁</div>
            <div style="font-size: 16px; margin-bottom: 10px;">No files match your search criteria</div>
            <div style="font-size: 14px;">Try adjusting your search or filter settings</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 现有的底部说明 -->
<!--     <div style="margin-top: 50px">
      * CPC pangenome reference includes 122 haplotypes of 61 samples from 36 East Asian populations.<br>
      * CPC & HPRC pangenome reference includes all samples in CPC.Phase1 and HPRC.<br>
      * Files with "-full" contain all contigs that could be assigned a chromosome, nothing masked or clipped.<br>
      * Files with "-min.af.0.1" were clipped to keep only nodes covered by >= 10% haplotypes (only suitable for short-read mapping).<br>
      * Files with neither suffix were clipped so that path intervals in the graph that span >=10kb without aligning to the minigraph are removed.
    </div> -->
        <div style="margin-top: 50px">
The near T2T CPC.Ref2 comprises 948 genome haplotype-resolved assemblies derived from 474 individuals representing 60 ethnolinguistic groups across China. These assemblies achieve an average gap-free contig N50 of 103 Mb, with an average of ~109 haploid assemblies per chromosome reaching T2T completion standards and exceptional sequence quality (~QV 59.2).
    </div>
    
    <!-- 现有其他部分保持不变 -->
    <h2>Code Availability</h2>
    All the codes needed to reproduce the results from this work can be found on GitHub, <a
      href="https://github.com/orgs/Shuhua-Group/repositories">https://github.com/orgs/Shuhua-Group/repositories</a>.
   <h2>The CPC Phase I Data Availability</h2>
    The release of the CPC Phase I data has been approved by The Ministry of Science and Technology of the People's Republic of China (permission no. 2022BAT2392). The raw data are availableat the National Genomics Data Center (<a href="https://ngdc.cncb.ac.cn">https://ngdc.cncb.ac.cn</a >) under the BioProject PRJCA011422. The Pangenome References built based on the CPC core samples and combined with the HPRC samples are freely available at both the CPC website (<a href="https://pog.fudan.edu.cn/cpc/#/data">https://pog.fudan.edu.cn/cpc/#/data</a >) and GitHub (<a href="https://github.com/Shuhua-Group/Chinese-Pangenome-Consortium-Phase-I">https://github.com/Shuhua-Group/Chinese-Pangenome-Consortium-Phase-I</a >).
    <h3 style="margin:20px 0">CPC pangenome reference</h3>
    <div style="padding-left:20px" v-for="c in cpc" :key="c">
      <h4>{{ c }}</h4>
      <ul>
        <li v-for="f in files" :key="f.name" v-if="f.class===c">
          <a :href='`${fileUrl}/${f.class}/${f.name}`' :download='f.name' target="_blank">
            {{ f.name }}
          </a>
        </li>
      </ul>
    </div>
    
    <!-- 继续其他 Phase I 部分 -->
    <h3 style="margin:20px 0">CPC & HPRC pangenome reference</h3>
    <div style="padding-left:20px" v-for="c in cpchprc" :key="c">
      <h4>{{ c }}</h4>
      <ul>
        <li v-for="f in files" :key="f.name" v-if="f.class===c">
          <a :href='`${fileUrl}/${f.class}/${f.name}`' :download='f.name' target="_blank">
            {{ f.name }}
          </a>
        </li>
      </ul>
    </div>
    
    <h3 style="margin:20px 0">Genome annotation files (*.GFF3) for polished assemblies of 58 core samples</h3>
    <div style="padding-left:20px" v-for="c in cpcGfff" :key="c">
      <h4>{{ c }}</h4>
      <ul>
        <li v-for="f in files" :key="f.name" v-if="f.class===c">
          <a :href='`${fileUrl}/${f.class}/${f.name}`' :download='f.name' target="_blank">
            {{ f.name }}
          </a>
        </li>
      </ul>
    </div>

    <h3 style="margin:20px 0">SV file of CPC & HPRC pangenome processed by the <a
        href="https://github.com/Shuhua-Group/PanGenome_VCF_PostProcess" style="color: #4343d0;font-size: 23px">PanGenome_VCF_PostProcess</a>
    </h3>
    <div style="padding-left:20px" v-for="c in cpcSV" :key="c">
      <h4>{{ c }}</h4>
      <div style="margin-left: 15px;color: #383d48">
        We have updated the process strategy about the complex loci with both small variants and SVs alleles, so that
        the number of variants is slightly different than in the paper.<br>
      </div>

      <ul>
        <li v-for="f in files" :key="f.name" v-if="f.class===c">
          <a :href='`${fileUrl}/${f.class}/${f.name}`' :download='f.name' target="_blank">
            {{ f.name }}
          </a>
        </li>
      </ul>
    </div>
    
    <div class="el-upload__tip"
         @click="frontDownloadB"
         style="cursor: pointer;"
    >
      <h3>
        CPC phase I (updated March 18, 2025)
      </h3>
      <div style="margin-left: 20px;">
        <h4>
          EBV sequence annotation
        </h4>
        <li>
          <a style="color: var(--bs-link-color);text-decoration: underline;"
          >
            CPC1.EBV.anno.txt
          </a>
        </li>
      </div>
    </div>

  </div> <!-- 根元素结束 -->
</template>

<script>
export default {
  data() {
    return {
      fileUrl: `https://pog.fudan.edu.cn/cpc/download/`,
      fileUrlPhase2: `https://pog.fudan.edu.cn/cpc2/download`,

      // Phase I 数据
      cpc: ['CPC.Phase1.CHM13v2-full', 'CPC.Phase1.CHM13v2', 'CPC.Phase1.CHM13v2-minaf.0.1'],
      cpchprc: ['CPC.HPRC.Phase1.CHM13v2', 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1', 'CPC.HPRC.Phase1.GRCh38-MAF01.cactus264', 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus', 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.full'],
      cpcGfff: ['CPC.p1.58inds.GFF3'],
      cpcSV: ['CPC.HPRC.Phase1.processed.SVs.normed'],
files: [
        {name: 'CPC.Phase1.CHM13v2-full.gfa.gz', class: 'CPC.Phase1.CHM13v2-full'},
        {name: 'CPC.Phase1.CHM13v2-full.gbwt', class: 'CPC.Phase1.CHM13v2-full'},
        {name: 'CPC.Phase1.CHM13v2-full.gg', class: 'CPC.Phase1.CHM13v2-full'},
        {name: 'CPC.Phase1.CHM13v2-full.xg', class: 'CPC.Phase1.CHM13v2-full'},

        {name: 'CPC.Phase1.CHM13v2.gfa.gz', class: 'CPC.Phase1.CHM13v2'},
        {name: 'CPC.Phase1.CHM13v2.dist', class: 'CPC.Phase1.CHM13v2'},
        {name: 'CPC.Phase1.CHM13v2.gbwt', class: 'CPC.Phase1.CHM13v2'},
        {name: 'CPC.Phase1.CHM13v2.gg', class: 'CPC.Phase1.CHM13v2'},
        {name: 'CPC.Phase1.CHM13v2.min', class: 'CPC.Phase1.CHM13v2'},
        {name: 'CPC.Phase1.CHM13v2.xg', class: 'CPC.Phase1.CHM13v2'},
        {name: 'CPC.Phase1.CHM13v2.vcf.gz', class: 'CPC.Phase1.CHM13v2'},

        {name: 'CPC.Phase1.CHM13v2-minaf.0.1.gfa.gz', class: 'CPC.Phase1.CHM13v2-minaf.0.1'},
        {name: 'CPC.Phase1.CHM13v2-minaf.0.1.dist', class: 'CPC.Phase1.CHM13v2-minaf.0.1'},
        {name: 'CPC.Phase1.CHM13v2-minaf.0.1.gbwt', class: 'CPC.Phase1.CHM13v2-minaf.0.1'},
        {name: 'CPC.Phase1.CHM13v2-minaf.0.1.gg', class: 'CPC.Phase1.CHM13v2-minaf.0.1'},
        {name: 'CPC.Phase1.CHM13v2-minaf.0.1.min', class: 'CPC.Phase1.CHM13v2-minaf.0.1'},
        {name: 'CPC.Phase1.CHM13v2-minaf.0.1.xg', class: 'CPC.Phase1.CHM13v2-minaf.0.1'},

        {name: 'CPC.HPRC.Phase1.CHM13v2.gfa.gz', class: 'CPC.HPRC.Phase1.CHM13v2'},
        {name: 'CPC.HPRC.Phase1.CHM13v2.dist', class: 'CPC.HPRC.Phase1.CHM13v2'},
        {name: 'CPC.HPRC.Phase1.CHM13v2.gbwt', class: 'CPC.HPRC.Phase1.CHM13v2'},
        {name: 'CPC.HPRC.Phase1.CHM13v2.gg', class: 'CPC.HPRC.Phase1.CHM13v2'},
        {name: 'CPC.HPRC.Phase1.CHM13v2.min', class: 'CPC.HPRC.Phase1.CHM13v2'},
        {name: 'CPC.HPRC.Phase1.CHM13v2.xg', class: 'CPC.HPRC.Phase1.CHM13v2'},
        {name: 'CPC.HPRC.Phase1.CHM13v2.vcf.gz', class: 'CPC.HPRC.Phase1.CHM13v2'},


        {name: 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1.gfa.gz', class: 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1'},
        {name: 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1.dist', class: 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1'},
        {name: 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1.gbwt', class: 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1'},
        {name: 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1.gg', class: 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1'},
        {name: 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1.min', class: 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1'},
        {name: 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1.xg', class: 'CPC.HPRC.Phase1.CHM13v2-minaf.0.1'},

        // {name: 'CPC_HPRC_GRCh38ref_pluschm13cn1.MAF001.xg', class: 'CPC.HPRC.Phase1.GRCh38-MAF001.cactus264'},
        // {name: 'CPC_HPRC_GRCh38ref_pluschm13cn1.MAF001.vcf.gz', class: 'CPC.HPRC.Phase1.GRCh38-MAF001.cactus264'},
        // {name: 'CPC_HPRC_GRCh38ref_pluschm13cn1.MAF001.min', class: 'CPC.HPRC.Phase1.GRCh38-MAF001.cactus264'},
        // {name: 'CPC_HPRC_GRCh38ref_pluschm13cn1.MAF001.gbz', class: 'CPC.HPRC.Phase1.GRCh38-MAF001.cactus264'},

        {
          name: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.d21.snarls',
          class: 'CPC.HPRC.Phase1.GRCh38-MAF01.cactus264'
        },
        {
          name: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.d21.min',
          class: 'CPC.HPRC.Phase1.GRCh38-MAF01.cactus264'
        },
        {
          name: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.d21.gbz',
          class: 'CPC.HPRC.Phase1.GRCh38-MAF01.cactus264'
        },
        {
          name: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.d21.dist',
          class: 'CPC.HPRC.Phase1.GRCh38-MAF01.cactus264'
        },

        {
          name: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.snarls',
          class: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus'
        },
        {
          name: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.gbz',
          class: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus'
        },


        {name: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.full.snarls', class: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.full'},
        {name: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.full.og', class: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.full'},
        {name: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.full.hal', class: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.full'},
        {name: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.full.gfa.gz', class: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.full'},
        {name: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.full.gbz', class: 'CPC_HPRC_reconstruct_GRCh38ref_T2Tplus_CN1plus.full'},



        // {
        //   name: 'CPC_HPRC_GRCh38ref_pluschm13cn1.MAF001.for_pangenie.vcf',
        //   class: 'CPC.HPRC.Phase1.GRCh38-MAF001.cactus264'
        // },
        // {name: 'CPC_HPRC_GRCh38ref_pluschm13cn1.MAF001.dist', class: 'CPC.HPRC.Phase1.GRCh38-MAF001.cactus264'},


        {name: 'CPC.p1.58inds.GFF3.tar.gz', class: 'CPC.p1.58inds.GFF3'},

        {name: 'CPC.HPRC.Phase1.processed.SVs.normed.vcf.gz', class: 'CPC.HPRC.Phase1.processed.SVs.normed'},

      ],
      
      // Phase II 认证相关
      isPhase2Authenticated: false,
      phase2AccessKey: '',
      phase2AuthError: '',
      validPhase2Key: 'Nature2026-01-00530@POG',
      
      // Session 管理
      sessionTimer: null,
      sessionStartTime: null,
      sessionExpireTime: null,
      sessionTimeLeft: 300, // 5分钟，单位：秒
      sessionCheckInterval: null,
      
      // Phase II 数据相关
      searchQuery2: '',
      showHaplotype1: true,
      showHaplotype2: true,
      allSamples: [],
      filteredSamples: []
    }
  },
  
  created() {
    this.checkExistingPhase2Auth()
    this.generatePhase2Samples()
    this.filterSamples()
  },
  
  mounted() {
    // 设置页面可见性变化监听
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    
    // 检查会话状态
    if (this.isPhase2Authenticated) {
      this.startSessionTimer()
    }
  },
  
  beforeDestroy() {
    // 清理计时器和监听器
    this.clearSessionTimer()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  },
  
  methods: {
    // 检查已有的认证状态
    checkExistingPhase2Auth() {
      const sessionData = localStorage.getItem('cpc_phase2_session')
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData)
          const now = Date.now()
          
          // 检查会话是否过期
          if (now < session.expireTime) {
            this.isPhase2Authenticated = true
            this.sessionStartTime = session.startTime
            this.sessionExpireTime = session.expireTime
            this.calculateTimeLeft()
            this.startSessionTimer()
          } else {
            // 会话已过期，清除
            localStorage.removeItem('cpc_phase2_session')
          }
        } catch (e) {
          console.error('Error parsing session data:', e)
          localStorage.removeItem('cpc_phase2_session')
        }
      }
    },
    
    // Phase II 认证检查
    checkPhase2Access() {
      if (this.phase2AccessKey === this.validPhase2Key) {
        this.isPhase2Authenticated = true
        this.phase2AuthError = ''
        
        // 设置会话
        const now = Date.now()
        this.sessionStartTime = now
        this.sessionExpireTime = now + 30 * 60 * 1000 // 5分钟后过期
        
        // 保存会话数据到 localStorage
        const sessionData = {
          startTime: this.sessionStartTime,
          expireTime: this.sessionExpireTime
        }
        localStorage.setItem('cpc_phase2_session', JSON.stringify(sessionData))
        
        // 启动会话计时器
        this.startSessionTimer()
      } else {
        this.phase2AuthError = 'Invalid security key. Please try again.'
        this.phase2AccessKey = ''
      }
    },
    
    // 启动会话计时器
    startSessionTimer() {
      this.calculateTimeLeft()
      
      // 每秒更新倒计时
      this.sessionCheckInterval = setInterval(() => {
        this.calculateTimeLeft()
        
        if (this.sessionTimeLeft <= 0) {
          this.sessionExpired()
        }
      }, 1000)
    },
    
    // 计算剩余时间
    calculateTimeLeft() {
      if (!this.sessionExpireTime) return
      
      const now = Date.now()
      const timeLeft = Math.max(0, Math.floor((this.sessionExpireTime - now) / 1000))
      this.sessionTimeLeft = timeLeft
    },
    
    // 会话过期处理
    sessionExpired() {
      this.clearSessionTimer()
      this.isPhase2Authenticated = false
      this.phase2AccessKey = ''
      localStorage.removeItem('cpc_phase2_session')
      
      // 显示过期提示
      this.phase2AuthError = 'Session expired. Please login again.'
    },
    
    // 延长会话
    extendSession() {
      const now = Date.now()
      this.sessionExpireTime = now + 15 * 60 * 1000 // 延长5分钟
      
      // 更新 localStorage
      const sessionData = {
        startTime: this.sessionStartTime,
        expireTime: this.sessionExpireTime
      }
      localStorage.setItem('cpc_phase2_session', JSON.stringify(sessionData))
      
      this.calculateTimeLeft()
    },
    
    // Phase II 登出
    logoutPhase2() {
      this.clearSessionTimer()
      this.isPhase2Authenticated = false
      this.phase2AccessKey = ''
      this.sessionStartTime = null
      this.sessionExpireTime = null
      this.sessionTimeLeft = 0
      
      localStorage.removeItem('cpc_phase2_session')
      
      // 重置过滤状态
      this.searchQuery2 = ''
      this.showHaplotype1 = true
      this.showHaplotype2 = true
      this.filterSamples()
    },
    
    // 清理计时器
    clearSessionTimer() {
      if (this.sessionCheckInterval) {
        clearInterval(this.sessionCheckInterval)
        this.sessionCheckInterval = null
      }
    },
    
    // 处理页面可见性变化
    handleVisibilityChange() {
      if (document.hidden) {
        // 页面隐藏时暂停计时器
        this.clearSessionTimer()
      } else if (this.isPhase2Authenticated) {
        // 页面重新可见时重新计算时间并启动计时器
        this.calculateTimeLeft()
        if (this.sessionTimeLeft > 0) {
          this.startSessionTimer()
        } else {
          this.sessionExpired()
        }
      }
    },
    
    // 格式化时间显示
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },
    
    // 生成 Phase II 样本数据
    generatePhase2Samples() {
      const samples = []
      
      for (let i = 1; i <= 474; i++) {
        const sampleNum = i.toString().padStart(3, '0')
        const sampleName = `CPCERZ200${sampleNum}`
        
        for (let haplotype = 1; haplotype <= 2; haplotype++) {
          const fileSuffix = `.${haplotype}`
          const baseFileName = `${sampleName}${fileSuffix}`
          
          samples.push({
            id: `${sampleName}_${haplotype}`,
            sampleName: sampleName,
            displayName: `${sampleName}.${haplotype}`,
            haplotype: haplotype,
            fastaFile: `${baseFileName}.fa.gz`,
            faiFile: `${baseFileName}.fa.gz.fai`,
            gziFile: `${baseFileName}.fa.gz.gzi`,
            md5File: `${baseFileName}.fa.gz.md5`,
            fastaUrl: `${this.fileUrlPhase2}/${sampleName}/${baseFileName}.fa.gz`,
            faiUrl: `${this.fileUrlPhase2}/${sampleName}/${baseFileName}.fa.gz.fai`,
            gziUrl: `${this.fileUrlPhase2}/${sampleName}/${baseFileName}.fa.gz.gzi`,
            md5Url: `${this.fileUrlPhase2}/${sampleName}/${baseFileName}.fa.gz.md5`
          })
        }
      }
      
      this.allSamples = samples
    },
    
    // 过滤样本
    filterSamples() {
      let filtered = this.allSamples
      
      if (!this.showHaplotype1 || !this.showHaplotype2) {
        filtered = filtered.filter(sample => {
          if (this.showHaplotype1 && sample.haplotype === 1) return true
          if (this.showHaplotype2 && sample.haplotype === 2) return true
          return false
        })
      }
      
      if (this.searchQuery2.trim()) {
        const query = this.searchQuery2.toLowerCase().trim()
        filtered = filtered.filter(sample => {
          const sampleNum = sample.sampleName.replace('CPCERZ200', '')
          return sample.sampleName.toLowerCase().includes(query) ||
                 sampleNum.includes(query) ||
                 sample.displayName.toLowerCase().includes(query)
        })
      }
      
      this.filteredSamples = filtered
    },
    
    frontDownloadB() {
      var a = document.createElement("a")
      a.href = "CPC1.EBV.anno.txt"
      a.download = "CPC1.EBV.anno.txt"
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/scss/index.scss';

.card-title {
  margin-left: 8px;
  font-size: 20px;
  color: #5F74A4FF;
}

.card-content {
  text-align: justify;
  display: flex;
  justify-content: space-between;
  margin-left: 20px;
  font-size: 16px;
  color: #606266;
}

p {
  text-align: justify;
  color: #606266;
}

// 新增表格样式
table {
  th {
    font-weight: 600;
    color: #333;
    background: #f8f9fa;
  }
  
  tr:hover {
    background-color: #fafafa;
  }
  
  a:hover {
    text-decoration: underline;
  }
}

// 响应式调整
@media (max-width: 1200px) {
  table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}

// 滚动条样式
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

// 认证界面样式
input:focus {
  outline: none;
  border-color: #5979c2 !important;
  box-shadow: 0 0 0 2px rgba(89, 121, 194, 0.2);
}

// 会话倒计时样式
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.session-expiring {
  animation: pulse 1s infinite;
  color: #dc3545;
}
</style>