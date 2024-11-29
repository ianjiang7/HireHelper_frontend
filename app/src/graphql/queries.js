/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUserProfile = /* GraphQL */ `
  query GetUserProfile($userId: ID!) {
    getUserProfile(userId: $userId) {
      userId
      email
      fullname
      company
      role
      resumeName
      createdAt
      updatedAt
    }
  }
`;

export const updateUserProfile = /* GraphQL */ `
  mutation UpdateUserProfile($input: UpdateUserProfileInput!, $condition: ModelUserProfileConditionInput) {
    updateUserProfile(input: $input, condition: $condition) {
      userId
      email
      fullname
      company
      role
      resumeName
      createdAt
      updatedAt
    }
  }
`;
