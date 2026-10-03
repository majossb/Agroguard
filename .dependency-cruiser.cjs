/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-cannot-import-other-layers',
      comment: 'Domain layer must not depend on application, infrastructure, presentation or main layers',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/(application|infrastructure|presentation|main)' },
    },
    {
      name: 'domain-cannot-import-external-modules',
      comment: 'Domain layer must be pure JavaScript without external dependencies',
      severity: 'error',
      from: { path: '^src/domain' },
      to: {
        pathNot: '^src/domain',
        dependencyTypes: ['npm', 'npm-dev'],
      },
    },
    {
      name: 'application-cannot-import-outer-layers',
      comment: 'Application layer can only import from domain and application, not infrastructure, presentation or main',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: '^src/(infrastructure|presentation|main)' },
    },
    {
      name: 'infrastructure-cannot-import-presentation-or-main',
      comment: 'Infrastructure layer cannot depend on presentation or main layers',
      severity: 'error',
      from: { path: '^src/infrastructure' },
      to: { path: '^src/(presentation|main)' },
    },
    {
      name: 'presentation-cannot-import-infrastructure-or-main',
      comment: 'Presentation layer cannot depend on infrastructure or main layers',
      severity: 'error',
      from: { path: '^src/presentation' },
      to: { path: '^src/(infrastructure|main)' },
    },
    {
      name: 'no-circular-dependencies',
      comment: 'Circular dependencies are forbidden across all layers',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: false,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
