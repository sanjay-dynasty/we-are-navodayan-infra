import { Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ProjectTagsProps {
  readonly project: string;
  readonly environment: string;
}

export class ProjectTags extends Construct {
  constructor(scope: Construct, id: string, props: ProjectTagsProps) {
    super(scope, id);

    Tags.of(this).add('Project', props.project);
    Tags.of(this).add('Environment', props.environment);
    Tags.of(this).add('ManagedBy', 'AWS-CDK');
  }
}
