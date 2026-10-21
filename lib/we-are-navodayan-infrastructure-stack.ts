import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { EnvironmentConfig } from "./config/environment-config";

export interface WeAreNavodayanInfrastructureStackProps extends cdk.StackProps {
  readonly config: EnvironmentConfig;
}

export class WeAreNavodayanInfrastructureStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: WeAreNavodayanInfrastructureStackProps,
  ) {
    super(scope, id, props);

    const { config } = props;

    const vpc = new ec2.Vpc(this, "ProjectVpc", {
      vpcName: `${config.project}-${config.environment}-vpc`,
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
      maxAzs: config.maxAvailabilityZones,
      natGateways: config.natGateways,
      restrictDefaultSecurityGroup: false,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "Application",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: "Database",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    new cdk.CfnOutput(this, "ProjectName", {
      value: config.project,
      description: "Project name",
    });

    new cdk.CfnOutput(this, "EnvironmentName", {
      value: config.environment,
      description: "Deployment environment",
    });

    new cdk.CfnOutput(this, "AwsRegion", {
      value: config.awsRegion,
      description: "AWS deployment region",
    });

    new cdk.CfnOutput(this, "VpcId", {
      value: vpc.vpcId,
      description: "Development VPC ID",
    });

    new cdk.CfnOutput(this, "VpcCidr", {
      value: config.vpcCidr,
      description: "Development VPC IPv4 CIDR",
    });

    new cdk.CfnOutput(this, "AvailabilityZones", {
      value: cdk.Fn.join(",", vpc.availabilityZones),
      description: "Availability Zones selected for the VPC",
    });

    new cdk.CfnOutput(this, "PublicSubnetIds", {
      value: cdk.Fn.join(
        ",",
        vpc.publicSubnets.map((subnet) => subnet.subnetId),
      ),
      description: "Public subnet IDs",
    });

    new cdk.CfnOutput(this, "ApplicationSubnetIds", {
      value: cdk.Fn.join(
        ",",
        vpc.privateSubnets.map((subnet) => subnet.subnetId),
      ),
      description: "Private application subnet IDs",
    });

    new cdk.CfnOutput(this, "DatabaseSubnetIds", {
      value: cdk.Fn.join(
        ",",
        vpc.isolatedSubnets.map((subnet) => subnet.subnetId),
      ),
      description: "Isolated database subnet IDs",
    });
  }
}