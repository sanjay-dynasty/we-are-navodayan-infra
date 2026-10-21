#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { environmentConfigs } from "../lib/config/environment-config";
import { ProjectTags } from "../lib/constructs/project-tags";
import { WeAreNavodayanInfrastructureStack } from "../lib/we-are-navodayan-infrastructure-stack";

const app = new cdk.App();

const project = app.node.tryGetContext("project");
const environment = app.node.tryGetContext("environment");
const awsProfile = app.node.tryGetContext("awsProfile");

if (!project || !environment || !awsProfile) {
  throw new Error(
    "Missing required CDK context: project, environment or awsProfile.",
  );
}

const config = environmentConfigs[environment];

if (!config) {
  throw new Error(`Unsupported environment: ${environment}`);
}

if (project !== config.project) {
  throw new Error(
    `Project context mismatch: expected ${config.project}, received ${project}.`,
  );
}

const stack = new WeAreNavodayanInfrastructureStack(
  app,
  `${project}-${environment}`,
  {
    config,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: config.awsRegion,
    },
    description: `${project} infrastructure for ${environment}`,
  },
);

new ProjectTags(stack, "ProjectTags", {
  project: config.project,
  environment: config.environment,
});