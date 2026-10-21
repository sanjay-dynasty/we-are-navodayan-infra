import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { environmentConfigs } from "../lib/config/environment-config";
import { WeAreNavodayanInfrastructureStack } from "../lib/we-are-navodayan-infrastructure-stack";

describe("We Are Navodayan network infrastructure", () => {
  const app = new cdk.App();
  const config = environmentConfigs.dev;

  const stack = new WeAreNavodayanInfrastructureStack(
    app,
    "TestInfrastructureStack",
    {
      config,
      env: {
        account: "123456789012",
        region: config.awsRegion,
      },
    },
  );

  const template = Template.fromStack(stack);

  test("configures two Availability Zones", () => {
    expect(config.maxAvailabilityZones).toBe(2);
  });

  test("creates one VPC with the expected CIDR", () => {
    template.resourceCountIs("AWS::EC2::VPC", 1);
    template.hasResourceProperties("AWS::EC2::VPC", {
      CidrBlock: config.vpcCidr,
      EnableDnsSupport: true,
      EnableDnsHostnames: true,
    });
  });

  test("creates six subnets across two Availability Zones", () => {
    template.resourceCountIs("AWS::EC2::Subnet", 6);

    const subnets = template.findResources("AWS::EC2::Subnet");
    const availabilityZones = new Set(
      Object.values(subnets).map(
        (subnet: any) => subnet.Properties.AvailabilityZone,
      ),
    );

    expect(availabilityZones.size).toBe(config.maxAvailabilityZones);
  });

  test("creates two public, two application, and two database subnets", () => {
    template.resourceCountIs("AWS::EC2::Subnet", 6);

    for (const cidr of ["10.20.0.0/24", "10.20.1.0/24"]) {
      template.hasResourceProperties("AWS::EC2::Subnet", {
        CidrBlock: cidr,
        MapPublicIpOnLaunch: true,
      });
    }

    for (const cidr of [
      "10.20.2.0/24",
      "10.20.3.0/24",
      "10.20.4.0/24",
      "10.20.5.0/24",
    ]) {
      template.hasResourceProperties("AWS::EC2::Subnet", {
        CidrBlock: cidr,
        MapPublicIpOnLaunch: false,
      });
    }
  });

  test("creates an Internet Gateway and attaches it to the VPC", () => {
    template.resourceCountIs("AWS::EC2::InternetGateway", 1);
    template.resourceCountIs("AWS::EC2::VPCGatewayAttachment", 1);
  });

  test("routes both public subnets through the Internet Gateway", () => {
    template.resourceCountIs("AWS::EC2::Route", 2);

    const routes = template.findResources("AWS::EC2::Route");
    const routeResources = Object.values(routes);

    expect(routeResources).toHaveLength(2);

    for (const route of routeResources) {
      expect(route.Properties.DestinationCidrBlock).toBe("0.0.0.0/0");
      expect(route.Properties.GatewayId.Ref).toMatch(/ProjectVpcIGW/);
    }
  });

  test("does not create NAT Gateways", () => {
    template.resourceCountIs("AWS::EC2::NatGateway", 0);
  });

  test("does not create application compute or database instances", () => {
    template.resourceCountIs("AWS::EC2::Instance", 0);
    template.resourceCountIs("AWS::RDS::DBInstance", 0);
    template.resourceCountIs("AWS::ECS::Service", 0);
    template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 0);
  });
});