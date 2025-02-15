# Automating Document Conversion and Watermarking with Amazon S3 Object Lambda

# Introduction

In this guide, we will walk through the process of setting up an automated system for converting and watermarking documents using Amazon S3 Object Lambda. This system integrates AWS services such as S3, Lambda, DynamoDB, Cognito, API Gateway, and ECR to create a secure and scalable document conversion pipeline.

This project will provide experience in:

- AWS Identity and Access Management (IAM).
- Secure API authentication with Amazon Cognito.
- Serverless computing with AWS Lambda.
- Deploying and managing Docker-based applications in AWS.
- Using DynamoDB for secure data storage.
- Implementing security best practices for AWS services.

# Configuring Amazon S3 Object Lambda

## Creating an S3 Object Lambda Access Point

1. Open the AWS S3 console and navigate to "Object Lambda Access Points".
2. Click "Create Object Lambda Access Point" and provide a name.
3. Select an existing S3 bucket as the data source.
4. Attach a Lambda function for object transformation.

## Configuring the Lambda Function for Object Transformation

1. Open the AWS Lambda console and create a new function.
2. Choose a runtime (e.g., Python or Node.js) and configure the execution role.
3. Implement the logic to modify and watermark documents retrieved via S3 Object Lambda.
4. Deploy and attach the function to the Object Lambda Access Point.

## Updating S3 Bucket Policies for Object Lambda

1. Navigate to the S3 bucket and open the "Permissions" tab.
2. Add an IAM policy to allow Object Lambda to access the S3 objects.
3. Enable logging to monitor requests and transformations.

# Implementing User Authentication

## Setting Up an Amazon Cognito User Pool

1. Create a Cognito user pool in AWS.
2. Configure user attributes and multi-factor authentication (MFA).
3. Enable OAuth2 and JWT-based authentication for secure API requests.

## Securing the REST API with Cognito Authorizers

1. Create an API Gateway endpoint.
2. Enable Cognito Authorizers to handle user authentication.
3. Configure request scopes to restrict access based on user roles.

# Building the Backend

## Storing User Data in DynamoDB

1. Create a DynamoDB table for storing user and document metadata.
2. Define partition and sort keys for efficient querying.
3. Enable point-in-time recovery for data protection.

## Creating and Configuring the Lambda Function

1. Create an AWS Lambda function to handle data processing.
2. Enable API Gateway integration to trigger Lambda functions.

## Attaching IAM Policies for Secure Access

1. Assign AmazonDynamoDBFullAccess policy to Lambda.
2. Restrict API Gateway access using IAM permissions.
3. Implement least privilege principles for IAM roles.

## Implementing Logging with CloudWatch

1. Enable AWS CloudWatch logs for Lambda.
2. Configure CloudWatch metrics for API performance tracking.

# Developing the Document Conversion Service

## Implementing LibreOffice with AWS Lambda

1. Attempted using Lambda Layer for LibreOffice but encountered compatibility issues with Node.js 20.
2. Switched to using a LibreOffice Lambda base image.

## Deploying the Lambda Base Image with Docker

1. Clone the libreoffice-lambda-base-image repository.
2. Build the Docker image with: docker build -t conversion-app:test --provenance=false

## Authenticating Docker CLI with ECR
1. Set AWS environment variables:
- $env:AWS_ACCESS_KEY_ID = "your-access-key"
- $env:AWS_SECRET_ACCESS_KEY = "your-secret-key"
- $env:AWS_SESSION_TOKEN = "your-session-token"

2. Authenticate with AWS ECR: 
- aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-ecr-repo-url

## Pushing Docker Image to AWS ECR

1. Tag the image:
- docker tag conversion-app:test your-ecr-repo-url/conversion-app:latest

2. Push the image to ECR:
- docker push your-ecr-repo-url/conversion-app:latest

## Running Document Conversion in AWS Lambda

1. Deploy the Docker image as a Lambda function.
2. Integrate the function with API Gateway for remote processing.

# Configuring API Gateway with Cognito and Lambda

## Creating the API Gateway Endpoint

1. Open the AWS API Gateway console.
2. Click "Create API" and select "REST API".
3. Choose "Regional" as the endpoint type.
4. Create a new resource and define the path for the API.
5. Add a method (e.g., POST) and integrate it with AWS Lambda.

## Enabling Cognito Authorizer for API Gateway

1. Navigate to the "Authorizers" section in API Gateway.
2. Click "Create Authorizer" and select "Cognito".
3. Choose the previously created Amazon Cognito user pool.
4. Enable "Token Source" and define it as "Authorization" (this expects JWT tokens in the request header).
5. Save the configuration and associate it with the API method.

## Integrating API Gateway with Lambda

1. Ensure "Lambda Proxy Integration" is enabled.
2. In the method request settings, require an authorization token from Cognito.
3. Deploy the API and note the invoke URL.
4. Test the endpoint by making a request with a valid Cognito authentication token.

## API Logging and Security

1. Configure Cognito authentication rules and IAM policies to limit access.
2. Enable API Gateway logging to CloudWatch for debugging authentication issues.

# Testing the S3 Object Lambda Transformation

1. Use the AWS CLI or SDK to retrieve an object through the Object Lambda Access Point.
2. Verify that the document is converted and watermarked as expected.
3. Check CloudWatch logs for debugging any transformation errors.

# Conclusion

This project demonstrates how to leverage AWS services for automated document conversion and watermarking. By implementing security best practices, IAM access control, and automation with Docker and Lambda, we achieve a scalable, secure, and efficient cloud-based solution.