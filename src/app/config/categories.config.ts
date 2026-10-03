export interface CategoryGroup {
  readonly name: string;
  readonly topics: readonly string[];
}

export const CATEGORIES: readonly CategoryGroup[] = [
  {
    name: 'Languages & Frameworks',
    topics: ['Java 8 / 17 / 21', 'Spring Boot', 'Quarkus', 'JPA / Hibernate', 'Angular', 'TypeScript', 'HTML5', 'CSS3'],
  },
  {
    name: 'Architecture & Messaging',
    topics: ['Microservices', 'Hexagonal Architecture', 'RESTful APIs', 'Event-Driven Design', 'Apache Kafka'],
  },
  { name: 'API Security & Tooling', topics: ['JWT Authentication', 'Swagger / OpenAPI'] },
  { name: 'Databases & Caching', topics: ['MS SQL Server', 'PostgreSQL', 'AWS RDS', 'Redis'] },
  { name: 'DevOps & Testing', topics: ['CI/CD', 'JUnit', 'Mockito'] },
  { name: 'AI Tools', topics: ['Claude AI', 'GitHub Copilot', 'Devin AI'] },
];

export const GROUP_NAMES: readonly string[] = CATEGORIES.map((c) => c.name);

export const topicsOf = (group: string): readonly string[] =>
  CATEGORIES.find((c) => c.name === group)?.topics ?? [];

export const isKnownTopic = (group: string, topic: string): boolean =>
  topicsOf(group).includes(topic);

/** URL-safe slug used in routes, e.g. "Java 8 / 17 / 21" -> "java-8-17-21". */
export const slug = (s: string): string =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
