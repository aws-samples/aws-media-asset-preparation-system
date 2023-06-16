/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createMAPSAssets = /* GraphQL */ `
  mutation CreateMAPSAssets(
    $input: CreateMAPSAssetsInput!
    $condition: ModelMAPSAssetsConditionInput
  ) {
    createMAPSAssets(input: $input, condition: $condition) {
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
export const updateMAPSAssets = /* GraphQL */ `
  mutation UpdateMAPSAssets(
    $input: UpdateMAPSAssetsInput!
    $condition: ModelMAPSAssetsConditionInput
  ) {
    updateMAPSAssets(input: $input, condition: $condition) {
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
export const deleteMAPSAssets = /* GraphQL */ `
  mutation DeleteMAPSAssets(
    $input: DeleteMAPSAssetsInput!
    $condition: ModelMAPSAssetsConditionInput
  ) {
    deleteMAPSAssets(input: $input, condition: $condition) {
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
