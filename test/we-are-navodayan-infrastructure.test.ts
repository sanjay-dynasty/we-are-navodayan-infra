import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { WeAreNavodayanInfrastructureStack } from "../lib/we-are-navodayan-infrastructure-stack";

describe("We Are Navodayan network infrastructure", () => {
  const app = new cdk.App();
  const stack = new WeAreNavodayanInfrastructureStack(
    app,
    "TestInfrastructureStack",
  );
  const template = Template.fromStack(stack);

  test("creates one VPC with the expected CIDR", () => {
    template.resourceCountIs("AWS::EC2::VPC", 1);

    template.hasResourceProperties("AWS::EC2::VPC", {
      CidrBlock: "10.20.0.0/16",
      EnableDnsSupport: true,
      EnableDnsHostnames: true,
    });
  });

  test("creates six subnets for three subnet tiers across two AZs", () => {
    template.resourceCountIs("AWS::EC2::Subnet", 6);
  });

  test("creates an Internet Gateway", () => {
    template.resourceCountIs("AWS::EC2::InternetGateway", 1);
  });

  test("does not create a NAT Gateway", () => {
    template.resourceCountIs("AWS::EC2::NatGateway", 0);
  });

  test("does not create application compute or database instances", () => {
    template.resourceCountIs("AWS::EC2::Instance", 0);
    template.resourceCountIs("AWS::RDS::DBInstance", 0);
    template.resourceCountIs("AWS::ECS::Service", 0);
    template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 0);
  });
});