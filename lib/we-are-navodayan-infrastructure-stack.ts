import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class WeAreNavodayanInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new cdk.CfnOutput(this, "ProjectName", {
      value: "we-are-navodayan",
      description: "Project name",
    });

    new cdk.CfnOutput(this, "EnvironmentName", {
      value: "dev",
      description: "Deployment environment",
    });

    new cdk.CfnOutput(this, "AwsRegion", {
      value: cdk.Stack.of(this).region,
      description: "AWS deployment region",
    });
  }
}
