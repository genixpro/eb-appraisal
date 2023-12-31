# This builds an all-in-one easy to install dockerfile

FROM       python:3.6.8
MAINTAINER Electric Brain <info@electricbrain.io>

RUN echo "deb http://packages.cloud.google.com/apt cloud-sdk-stretch main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
RUN curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash

# Install some basic system dependencies
RUN apt-get update && apt-get install \
    gcc \
    g++ \
    git \
    wget \
    sudo \
    vim \
    python3 \
    python3-pip \
    python3-setuptools \
    python3-tk \
    python3-dev \
    libpng-dev \
    freetype* \
    libblas-dev \
    liblapack-dev \
    libatlas-base-dev \
    unzip \
    google-cloud-sdk \
    nodejs \
    libreoffice \
    poppler-utils \
    gfortran -y && \
    rm -rf /var/lib/apt/lists/*

# Install some dependencies which can take a long time to install. We do this ahead of running "ADD . /swiftly" so the builds run faster when your
# making code changes regularly
RUN pip3 install --upgrade pip
RUN pip3 install --upgrade setuptools
RUN pip3 install numpy
RUN pip3 install scikit-learn
RUN pip3 install matplotlib
RUN pip3 install gunicorn

RUN  \
  git clone https://github.com/facebookresearch/fastText.git /tmp/fastText && \
  rm -rf /tmp/fastText/.git* && \
  cd /tmp/fastText/ && \
  make -j 8 && \
  mv /tmp/fastText/fasttext /usr/bin && \
  rm -rf /tmp/fastText


# Set the working directory to /app
WORKDIR /swiftly

# Copy the current directory contents into the container at /swiftly
ADD . /swiftly

ARG SWIFTLY_ENV

WORKDIR /swiftly
RUN gcloud auth activate-service-account --key-file appraisalai-be8f24d217e0.json

# Download models from gs cloud
WORKDIR /swiftly/server
RUN gsutil cp gs://swiftly-deployment/models.zip . && \
    unzip models.zip && \
    rm -rf models.zip

WORKDIR /swiftly/server
RUN gsutil cp gs://swiftly-deployment/file_type_model.bin .
RUN gsutil cp gs://swiftly-deployment/page_type_model.bin .
RUN gsutil cp gs://swiftly-deployment/page_type_model.vec .

# Delete everything in the client directory
RUN rm -rf /swiftly/client

# Install dependencies for server
WORKDIR /swiftly/server/appraisal/word_documents
RUN npm install

WORKDIR /swiftly/server
RUN python3 setup.py install

# Setup and configure systemd
ENTRYPOINT ["bash", "-c", "gunicorn -t 600 -w 4 -b 0.0.0.0:80 --paste $SWIFTLY_ENV.ini"]

EXPOSE 80
HEALTHCHECK CMD curl --fail http://localhost:80/home || exit 1
