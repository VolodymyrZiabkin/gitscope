const REPOSITORY_FIELDS = /* GraphQL */ `
  totalCount
  pageInfo { hasNextPage endCursor }
  nodes {
    name
    description
    url
    homepageUrl
    stargazerCount
    forkCount
    isArchived
    createdAt
    pushedAt
    primaryLanguage { name color }
    languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
    repositoryTopics(first: 6) { nodes { topic { name } } }
    licenseInfo { spdxId name }
  }
`;

const RATE_LIMIT_FIELDS = /* GraphQL */ `rateLimit { limit remaining cost resetAt }`;

const OWNED_REPOSITORIES = `ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, orderBy: { field: STARGAZERS, direction: DESC }`;

/** Profile + the first page of repositories in one round trip. */
export const USER_QUERY = /* GraphQL */ `
  query UserReport($login: String!, $pageSize: Int!) {
    ${RATE_LIMIT_FIELDS}
    user(login: $login) {
      login
      name
      avatarUrl(size: 400)
      bio
      company
      location
      websiteUrl
      twitterUsername
      url
      createdAt
      followers { totalCount }
      following { totalCount }
      repositories(first: $pageSize, ${OWNED_REPOSITORIES}) { ${REPOSITORY_FIELDS} }
      forks: repositories(ownerAffiliations: OWNER, isFork: true, privacy: PUBLIC) { totalCount }
      contributionsCollection { contributionYears }
    }
  }
`;

export const REPOSITORY_PAGE_QUERY = /* GraphQL */ `
  query RepositoryPage($login: String!, $pageSize: Int!, $cursor: String!) {
    ${RATE_LIMIT_FIELDS}
    user(login: $login) {
      repositories(first: $pageSize, after: $cursor, ${OWNED_REPOSITORIES}) { ${REPOSITORY_FIELDS} }
    }
  }
`;

/** Without `from`/`to` GitHub returns the rolling last year, like the profile page. */
export const CONTRIBUTIONS_QUERY = /* GraphQL */ `
  query Contributions($login: String!, $from: DateTime, $to: DateTime) {
    ${RATE_LIMIT_FIELDS}
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
      }
    }
  }
`;
