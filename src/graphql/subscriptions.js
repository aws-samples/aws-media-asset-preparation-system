/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateMAPSAssets = /* GraphQL */ `
  subscription OnCreateMAPSAssets(
    $bucketObjKey: String
    $assetId: String
    $creationDate: AWSDateTime
    $lastModifiedDate: AWSDateTime
    $thumbnailLoc: String
  ) {
    onCreateMAPSAssets(
      bucketObjKey: $bucketObjKey
      assetId: $assetId
      creationDate: $creationDate
      lastModifiedDate: $lastModifiedDate
      thumbnailLoc: $thumbnailLoc
    ) {
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
export const onUpdateMAPSAssets = /* GraphQL */ `
  subscription OnUpdateMAPSAssets(
    $bucketObjKey: String
    $assetId: String
    $creationDate: AWSDateTime
    $lastModifiedDate: AWSDateTime
    $thumbnailLoc: String
  ) {
    onUpdateMAPSAssets(
      bucketObjKey: $bucketObjKey
      assetId: $assetId
      creationDate: $creationDate
      lastModifiedDate: $lastModifiedDate
      thumbnailLoc: $thumbnailLoc
    ) {
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
export const onDeleteMAPSAssets = /* GraphQL */ `
  subscription OnDeleteMAPSAssets(
    $bucketObjKey: String
    $assetId: String
    $creationDate: AWSDateTime
    $lastModifiedDate: AWSDateTime
    $thumbnailLoc: String
  ) {
    onDeleteMAPSAssets(
      bucketObjKey: $bucketObjKey
      assetId: $assetId
      creationDate: $creationDate
      lastModifiedDate: $lastModifiedDate
      thumbnailLoc: $thumbnailLoc
    ) {
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
