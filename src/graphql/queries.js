/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const listMapsAssets = /* GraphQL */ `
  query ListMapsAssets(
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
export const getMapsAssets = /* GraphQL */ `
  query GetMapsAssets($bucketObjKey: String!) {
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
