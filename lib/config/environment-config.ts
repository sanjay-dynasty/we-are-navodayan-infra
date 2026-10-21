export interface EnvironmentConfig {
  readonly environment: string;
  readonly awsRegion: string;
  readonly project: string;
  readonly removalPolicy: "retain" | "destroy";
  readonly vpcCidr: string;
  readonly maxAvailabilityZones: number;
  readonly natGateways: number;
}

export const environmentConfigs: Record<string, EnvironmentConfig> = {
  dev: {
    environment: "dev",
    awsRegion: "ap-south-1",
    project: "we-are-navodayan",
    removalPolicy: "destroy",
    vpcCidr: "10.20.0.0/16",
    maxAvailabilityZones: 2,
    natGateways: 0,
  },
};