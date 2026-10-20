# We Are Navodayan - Infrastructure

Infrastructure as Code and cloud infrastructure for the We Are Navodayan platform.

## Technology

- AWS
- AWS CDK
- TypeScript
- Amazon ECS
- Amazon RDS PostgreSQL
- Amazon S3 and CloudFront
- Amazon CloudWatch

## Development Principles

- Use personal project credentials only.
- Never commit credentials, access keys, tokens, or secrets.
- Prefer least-privilege IAM permissions.
- Review infrastructure changes before deployment.
- Avoid provisioning paid resources without reviewing costs.
- Keep development, staging, and production configurations separate.

## Roadmap

Use the shared `../docs` repository for the cross-repository roadmap and phase tracking.

No AWS resources are provisioned by repository initialization.