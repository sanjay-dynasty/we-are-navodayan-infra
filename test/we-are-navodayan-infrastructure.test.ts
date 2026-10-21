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

  test("restricts the VPC default security group", () => {
    const vpc = template.findResources("AWS::EC2::VPC");
    expect(Object.keys(vpc)).toHaveLength(1);

    // CDK's restrictDefaultSecurityGroup setting is applied to the
    // generated default security group's ingress and egress rules.
    const ingressRules = template.findResources(
      "AWS::EC2::SecurityGroupIngress",
    );
    const egressRules = template.findResources(
      "AWS::EC2::SecurityGroupEgress",
    );

    expect(Object.keys(ingressRules)).toHaveLength(0);
    expect(Object.keys(egressRules)).toHaveLength(0);
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

    const vpcs = template.findResources("AWS::EC2::VPC");
    const gateways = template.findResources("AWS::EC2::InternetGateway");
    const attachments = template.findResources("AWS::EC2::VPCGatewayAttachment");

    const vpcId = Object.keys(vpcs)[0];
    const gatewayId = Object.keys(gateways)[0];
    const attachment = Object.values(attachments)[0] as any;

    expect(attachment.Properties.VpcId.Ref).toBe(vpcId);
    expect(attachment.Properties.InternetGatewayId.Ref).toBe(gatewayId);
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

  test("keeps application subnets private without internet routes", () => {
    const subnets = template.findResources("AWS::EC2::Subnet");
    const routes = template.findResources("AWS::EC2::Route");
    const associations = template.findResources(
      "AWS::EC2::SubnetRouteTableAssociation",
    );

    const applicationSubnets = Object.entries(subnets).filter(
      ([, subnet]: [string, any]) =>
        subnet.Properties.CidrBlock === "10.20.2.0/24" ||
        subnet.Properties.CidrBlock === "10.20.3.0/24",
    );

    expect(applicationSubnets).toHaveLength(2);

    const applicationRouteTableIds = new Set(
      Object.values(associations)
        .filter((association: any) =>
          applicationSubnets.some(
            ([subnetId]) =>
              association.Properties.SubnetId.Ref === subnetId,
          ),
        )
        .map((association: any) => association.Properties.RouteTableId.Ref),
    );

    expect(applicationRouteTableIds.size).toBe(2);

    for (const route of Object.values(routes) as any[]) {
      if (applicationRouteTableIds.has(route.Properties.RouteTableId.Ref)) {
        expect(route.Properties.DestinationCidrBlock).not.toBe("0.0.0.0/0");
      }
    }
  });
  test("keeps database subnets isolated without internet routes", () => {
    const subnets = template.findResources("AWS::EC2::Subnet");
    const routes = template.findResources("AWS::EC2::Route");
    const associations = template.findResources(
      "AWS::EC2::SubnetRouteTableAssociation",
    );

    const databaseSubnets = Object.entries(subnets).filter(
      ([, subnet]: [string, any]) =>
        subnet.Properties.CidrBlock === "10.20.4.0/24" ||
        subnet.Properties.CidrBlock === "10.20.5.0/24",
    );

    expect(databaseSubnets).toHaveLength(2);

    const databaseRouteTableIds = new Set(
      Object.values(associations)
        .filter((association: any) =>
          databaseSubnets.some(
            ([subnetId]) =>
              association.Properties.SubnetId.Ref === subnetId,
          ),
        )
        .map((association: any) => association.Properties.RouteTableId.Ref),
    );

    expect(databaseRouteTableIds.size).toBe(2);

    const databaseRoutes = Object.values(routes).filter((route: any) =>
      databaseRouteTableIds.has(route.Properties.RouteTableId.Ref),
    );

    expect(databaseRoutes).toHaveLength(0);
  });
  test("associates every subnet with its own route table", () => {
    const subnets = template.findResources("AWS::EC2::Subnet");
    const routeTables = template.findResources("AWS::EC2::RouteTable");
    const associations = template.findResources(
      "AWS::EC2::SubnetRouteTableAssociation",
    );

    const subnetIds = Object.keys(subnets);
    const routeTableIds = new Set(Object.keys(routeTables));
    const associationResources = Object.values(associations) as any[];

    expect(subnetIds).toHaveLength(6);
    expect(routeTableIds.size).toBe(6);
    expect(associationResources).toHaveLength(6);

    const associatedSubnetIds = associationResources.map(
      (association) => association.Properties.SubnetId.Ref,
    );

    expect(new Set(associatedSubnetIds).size).toBe(6);
    expect(new Set(associatedSubnetIds)).toEqual(new Set(subnetIds));

    for (const association of associationResources) {
      expect(routeTableIds.has(association.Properties.RouteTableId.Ref)).toBe(true);
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