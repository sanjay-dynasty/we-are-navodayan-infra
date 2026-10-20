export interface EnvironmentConfig {
  readonly environment: string;
  readonly awsRegion: string;
  readonly project: string;
  readonly removalPolicy: 'retain' | 'destroy';
}

export const environmentConfigs: Record<string, EnvironmentConfig> = {
  dev: {
    environment: 'dev',
    awsRegion: 'ap-south-1',
    project: 'we-are-navodayan',
    removalPolicy: 'destroy',
  },
};
