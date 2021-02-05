/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getMAPSAssets = /* GraphQL */ `
  query GetMAPSAssets($bucketObjKey: String!) {
    getMAPSAssets(bucketObjKey: $bucketObjKey) {
      bucketObjKey
      prefixLoc
      assetId
      creationDate
      lastModifiedDate
      thumbnailLoc
      proxyLoc
      fileStatus
      editUser
      videoCodec
      audioCodec
      fileFormat
      fileLength
      frameRate
      frameCount
      numAudioTracks
      numVideoTracks
      fileSize
    }
  }
`;
export const listMAPSAssets = /* GraphQL */ `
  query ListMAPSAssets(
    $filter: TableMAPSAssetsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMAPSAssets(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        bucketObjKey
        prefixLoc
        assetId
        creationDate
        lastModifiedDate
        thumbnailLoc
        proxyLoc
        fileStatus
        editUser
        videoCodec
        audioCodec
        fileFormat
        fileLength
        frameRate
        frameCount
        numAudioTracks
        numVideoTracks
        fileSize
      }
      nextToken
    }
  }
`;
