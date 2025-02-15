FROM public.ecr.aws/shelf/lambda-libreoffice-base:7.6-node20-x86_64

# Copy package.json and package-lock.json (if available) first
COPY index.mjs package.json package-lock.json ${LAMBDA_TASK_ROOT}

# Move to ${LAMBDA_TASK_ROOT} directory
WORKDIR ${LAMBDA_TASK_ROOT}

#Disable SSL verify
RUN npm set strict-ssl false

# Add the java-1.8.0-openjdk-devel package for javaldx Java Runtime Environment not found
# RUN yum update -y && yum install java-1.8.0-openjdk-devel -y

# Install dependencies
RUN npm install --loglevel verbose

# Copy function code
# COPY index.js ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.handler" ]

