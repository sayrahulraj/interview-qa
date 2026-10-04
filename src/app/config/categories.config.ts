export interface CategoryGroup {
  readonly name: string;
  readonly topics: readonly string[];
}

export const CATEGORIES: readonly CategoryGroup[] = [
  { name: 'Languages & Frameworks', topics: ['Java', 'Spring Boot', 'Quarkus', 'Angular'] },
  {
    name: 'Architecture & Messaging',
    topics: ['Microservices', 'Hexagonal Architecture', 'Kafka', 'REST Client', 'gRPC'],
  },
  { name: 'Security & API Gateway', topics: ['JWT', 'OAuth2', 'Apigee'] },
  { name: 'Databases & Persistence', topics: ['SQL', 'JPA / Hibernate'] },
  { name: 'DevOps & Cloud', topics: ['CI/CD', 'Docker', 'Kubernetes', 'AWS'] },
  { name: 'AI Tools', topics: ['Claude'] },
  { name: 'Interview Essentials', topics: ['Self Introduction'] },
];

export const GROUP_NAMES: readonly string[] = CATEGORIES.map((c) => c.name);

export const topicsOf = (group: string): readonly string[] =>
  CATEGORIES.find((c) => c.name === group)?.topics ?? [];

export const isKnownTopic = (group: string, topic: string): boolean =>
  topicsOf(group).includes(topic);

/** URL-safe slug used in routes, e.g. "Java 8 / 17 / 21" -> "java-8-17-21". */
export const slug = (s: string): string =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');