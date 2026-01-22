/* const tracks = [
    // Balti
    {
        type: 'AlignmentsTrack',
        trackId: 'BaltiSample001-AlignmentsTrack',
        name: 'BaltiSample001',
        category: ['Alignments', 'Balti'],
        assemblyNames: ['PangenomeHighlandReference'],
        adapter: {
            type: 'BamAdapter',
            bamLocation: {
                type: 'fileLocation',
                uri: './bam/Balti/realign_AAGC031052D.bam',
                locationType: 'UriLocation',
            },
            index: {
                indexType:
                    'BAI',
                location: {
                    type: 'fileLocation',
                    uri: './bam/Balti/realign_AAGC031052D.bam.bai',
                    locationType: 'UriLocation',
                }
            },
            sequenceAdapter: {
                type: 'BgzipFastaAdapter',
                fastaLocation: {
                    type: 'fileLocation',
                    uri: './reference/Genome/Pangenome_10Highland_G38.fa.gz',
                    locationType: 'UriLocation',

                },
                faiLocation: {
                    type: 'fileLocation',
                    uri: './reference/Genome/Pangenome_10Highland_G38.fa.gz.fai',
                    locationType: 'UriLocation',

                },
                gziLocation: {
                    type: 'fileLocation',
                    uri: './reference/Genome/Pangenome_10Highland_G38.fa.gz.gzi',
                    locationType: 'UriLocation',

                },
            },
        },
    },]

export default tracks
 */