<template>
  <div class="wrapper">
    <div class="main-wrapper">
      <div class="container">
        <div style="color: #385493;font-size: 25px;font-weight: 700;margin-bottom: 20px;margin-left: 30px">
          NewsList:
        </div>
        <div v-for="news in newsList" :key="news.id">
          <div class="news">
            <news-item :news="news"/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NewsItem from '@/components/NewsItem'

export default {
  components: {
    NewsItem: NewsItem
  },
  data() {
    return {
      total: 0,
      keyword: '',
      categories: [],
      listLoading: true,
      newsList: [
        {
          author: 'Shaohua Fan',
          publishTime: '2025-02-12',
          tags: 'SVs',
          category: 'Publication',
          id: '20250212',
          title: 'Fudan University’s Shaohua Fan Team Publishes in 《NC》: Structural Variants Associated with Phenotypic Diversity and Disease Susceptibility Identified in the Genomes of 945 Han Chinese Individuals Using Long-Read Sequencing Technology',
          content: 'Structural variants (SVs) refer to genomic sequence variations of ≥50 bp, including duplications, deletions, insertions, inversions, and translocations. Compared to the extensively studied single nucleotide variants (SNVs), SVs impact much larger genomic regions (around 20 Mb) compared to SNVs (around 5 Mb), thus having more significant effects on human phenotypic diversity and disease susceptibility. In recent years, studies represented by the 1000 Genomes Project, gnomAD, and the Human Genome Structural Variation Consortium have used short-read sequencing (SRS) and long-read sequencing (LRS) technologies to systematically characterize the SV features of different populations, revealing their potential functions. However, these studies lack experimental validation of SV functions, which limits the understanding of the causal relationships between SV genotypes and phenotypes, hindering deeper insights into human evolutionary history and phenotypic diversity.\n' +
              '\n' +
              'On February 10, 2025, a collaborative study led by Professor Shaohua Fan at Fudan University, Professor Li Jin at the Chinese Academy of Sciences, Professor Yuting Guan at East China Normal University, and Associate Professor Fritz J. Sedlazeck at the Baylor College of Medicine was published online in *Nature Communications* under the title, *“Long-read sequencing of 945 Han individuals identifies structural variants associated with phenotypic diversity and disease susceptibility.”* This study, based on long-read whole genome sequencing data from 945 Han Chinese individuals, identified 111,288 SVs, 24.56% of which were novel variants. By combining human phenotype, multi-omics data, and mouse knockout models, the study discovered: 1) An SV from the common ancestor of modern humans, Neanderthals, and Denisovans located at the GSDMD locus, which affects bone density and cisplatin-induced acute kidney injury phenotype; 2) An SV specific to modern humans at the WWP2 locus, which is associated with height, weight, body fat, craniofacial phenotypes, and immunity. Furthermore, the results suggest that the SV at the GSDMD locus could serve as a rapid and cost-effective biomarker for assessing the risk of cisplatin-induced acute kidney injury.\n' +
              '\n' +
              'The study of genomic structural variation dates back to cytogenetic analysis techniques, which can detect chromosomal aneuploidies greater than 3 Mb and identify chromosomal abnormalities that lead to various genetic syndromes. With the advancement of cytogenetic techniques (such as fluorescence in situ hybridization) and molecular detection methods (such as bacterial artificial chromosomes and comparative genomic hybridization), whole-genome SV analysis has become possible. These methods can detect SVs ranging from kilobases to megabases in size. The rise of SRS and the development of SV detection algorithms have greatly enhanced the accuracy of SV and breakpoint analysis. Large-scale studies such as the 1000 Genomes Project have further deepened the understanding of SV diversity and potential functions. However, due to the shorter read length of SRS, its sequencing accuracy is limited in highly repetitive regions or regions with extreme GC content, resulting in many SVs being undetected. The introduction of LRS (including Pacific Biosciences (PacBio) and Oxford Nanopore Technologies (ONT)) has made SV detection more comprehensive. For example, a study based on LRS that analyzed 32 individuals from 25 different populations identified approximately 100,000 SVs, of which only 29.6% could be detected using the same samples’ SRS data.\n' +
              '\n' +
              'As part of the continuation of the China Pan-Genome Consortium (CPC), the researchers constructed a high-resolution structural variation map based on the long-read whole genome sequencing data from 945 Han Chinese individuals. After performing multi-dimensional authenticity assessments of the structural variants, the researchers first characterized the number, frequency distribution, and genomic locations, identifying a large number of previously unreported variants (Figure 1).\n' +
              '\n' +
              '**Figure 1. Overview of Structural Variants in the Han Population**\n' +
              '\n' +
              'To trace the origins of SVs in the Han population, the researchers conducted systematic comparisons with chimpanzee genomes, ancient human genomes (Neanderthal and Denisovan), and modern human genomes globally. This revealed the distribution patterns of SVs across different evolutionary stages: 2% of SVs are shared between humans and chimpanzees, indicating they originated before the human-chimpanzee divergence; 5% of SVs are shared by modern humans, Neanderthals, and Denisovans, suggesting they originated from the common ancestor of all three; 32% of SVs are specific to modern humans; 0.1% of SVs have been introgressed from Neanderthals or Denisovans into the modern human genome, potentially related to prehistoric gene flow; and 20% of SVs are unique to the Han population, with most being rare variants (median allele frequency of approximately 0.003), suggesting they may be de novo mutations (Figure 2).\n' +
              '\n' +
              '**Figure 2. Diversity Distribution of Structural Variants in Chimpanzee, Ancient Human, and Modern Human Genomes**\n' +
              '\n' +
              'Functional studies of structural variations are crucial for understanding how genomic variations influence human phenotypic diversity and disease susceptibility. In this study, the researchers used gene annotation, GO/KEGG enrichment analysis, and other methods to identify an approximately 2.2 kb deletion with an allele frequency of 0.43 that deletes the first exon of the longest transcript of the GSDMD gene (NM_001166237.1). By combining human phenotypic, multi-omics data and mouse knockout models, the researchers confirmed that this deletion affects bone density and cisplatin-induced acute kidney injury phenotype (Figure 3). Additionally, based on chimpanzee, ancient human (Neanderthal and Denisovan), and modern human genome data from the 1000 Genomes Project, the researchers found that this deletion likely originated from the common ancestor of modern humans and ancient humans (Figure 4).\n' +
              '\n' +
              '**Figure 3. Deletion at the GSDMD Locus Linked to Bone Density and Acute Kidney Injury Phenotype**\n' +
              '\n' +
              '**Figure 4. Deletion at the GSDMD Locus Likely Originated from the Common Ancestor of Modern Humans and Ancient Humans**\n' +
              '\n' +
              'Since 95% of the structural variants identified in this study are located in non-coding regions, which are rich in functional regulatory elements, the researchers further explored the potential functions of non-coding SVs. Through gene annotation, GO/KEGG enrichment analysis, and mouse gene knockout phenotyping methods, the researchers identified a complex structural variant with an allele frequency of 0.28, consisting of a 229 bp insertion and a 354 bp deletion, located in the intron of the WWP2 gene (NM_001270454.2). Using a functional study strategy similar to that for the GSDMD locus SV, the researchers confirmed that this structural variant affects human height, body fat, craniofacial polymorphisms, and immune response (Figure 5), and that this variant likely originated from the common ancestor of modern humans (Figure 6).\n' +
              '\n' +
              '**Figure 5. Complex Structural Variant at the WWP2 Locus Associated with Height, Body Fat, Craniofacial Features, and Immune Response**\n' +
              '\n' +
              '**Figure 6. Complex Structural Variant at the WWP2 Locus Likely Originated from the Common Ancestor of Modern Humans**\n' +
              '\n' +
              'In conclusion, based on long-read sequencing data, the researchers constructed a structural variation map for 945 Han Chinese individuals and comprehensively characterized the origins and basic features of these structural variations. Through gene annotation, enrichment analysis methods, and integration with human phenotypic, multi-omics data and mouse knockout models, the study confirmed the significant effects of structural variations at the GSDMD and WWP2 loci on human phenotypic diversity and disease susceptibility. The phenotypic effects and evolutionary origins of these two structural variants help deepen our understanding of genomic diversity and local adaptation during human global migration. Reconstructing this complex history is crucial for understanding geographic differences in diseases and provides important theoretical support for designing personalized medical strategies for patients.\n' +
              '\n' +
              'Professor Shaohua Fan of Fudan University, Professor Yuting Guan of East China Normal University, Professor Li Jin of Fudan University, and Associate Professor Fritz J. Sedlazeck of the Baylor College of Medicine are co-corresponding authors of the paper. PhD graduate Jiaojiao Gong, PhD student Huiru Sun at Fudan University, and master’s student Kaiyuan Wang at East China Normal University are co-first authors. This research was funded by the National Natural Science Foundation, the National Key Research and Development Program, and the Shanghai Science and Technology Commission.\n1.\tAlkan, C., Coe, B. P. & Eichler, E. E. Genome structural variation discovery and genotyping. Nat. Rev. Genet. 12, 363–376 (2011).\n' +
              '2.\tWeischenfeldt, J., Symmons, O., Spitz, F. & Korbel, J. O. Phenotypic impact of genomic structural variation: insights from and for human disease. Nat. Rev. Genet. 14, 125–138 (2013).\n' +
              '3.\tSebat, J. et al. Large-scale copy number polymorphism in the human genome. Science 305, 525–528 (2004).\n' +
              '4.\tSudmant, P. H. et al. An integrated map of structural variation in 2,504 human genomes. Nature 526, 75–81 (2015).\n' +
              '5.\tSedlazeck, F. J., Lee, H., Darby, C. A. & Schatz, M. C. Piercing the dark matter: bioinformatics of long-range sequencing and mapping. Nat. Rev. Genet. 19, 329–346 (2018).\n' +
              '6.\tEbert, P. et al. Haplotype-resolved diverse human genomes and integrated analysis of structural variation. Science 372, (2021).\n' +
              '\n' +
              'https://www.nature.com/articles/s41467-025-56661-9'
        },

      ],
      value1: '',
      value: [],
      isAuthenticated: false,
      publishTime: '',
    }
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
      const res = content.substring(0, 300)
      const endblank = res.lastIndexOf(' ')
      const endleftbrace = res.lastIndexOf('(')
      const endrightbrace = res.lastIndexOf(')')
      const end = endleftbrace <= endrightbrace ? endblank : endleftbrace
      return res.substring(0, end) + ' ......'
    },
  }
}
</script>

<style scoped>
.sort-by {
  padding: 10px 20px 10px 38px;
  text-align: right;

}

.news:hover {
  background-color: #F9FAFA;
}

.news {
  padding: 10px 20px 20px 38px;
  text-align: left;
  border-bottom: 1px solid hsla(0, 0%, 59.2%, .1);
}

.container > div {
  border-bottom: 1px solid hsla(0, 0%, 59.2%, .1);
}

.demonstration {
  margin-right: 8px;
}

.top-search {
  padding: 20px;
  /* box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.05); */
}

.wrapper {
  min-height: 700px;
}

.main-wrapper {
  padding-top: 20px;
  padding-bottom: 40px;
  min-height: 100%
}

.container {
  /*width: 1050px;*/
  display: block;
  background-color: #fff;
  z-index: 50px;
  margin: auto;
  margin-top: 0;
  min-height: 100%;
}
</style>
