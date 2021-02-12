/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createMapsAssets = /* GraphQL */ `
  mutation CreateMapsAssets(
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
export const updateMapsAssets = /* GraphQL */ `
  mutation UpdateMapsAssets(
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
export const deleteMapsAssets = /* GraphQL */ `
  mutation DeleteMapsAssets(
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
