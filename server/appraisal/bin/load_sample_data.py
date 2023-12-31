from appraisal.components.document_extractor_dataset import DocumentExtractorDataset
from appraisal.models.appraisal import Appraisal
from appraisal.models.file import File
from appraisal.models.comparable_lease import ComparableLease
from appraisal.models.comparable_sale import ComparableSale
from appraisal.models.zone import Zone
from appraisal.models.property_tag import PropertyTag
from appraisal.models.image import Image
import bz2
import sys
import os
import json
from azure.storage.blob import BlockBlobService, PublicAccess
import os
from google.cloud import storage

from pyramid.config import Configurator
from pprint import pprint
from pymongo import MongoClient
import gridfs
import pickle
from mongoengine import connect, register_connection
from mongoengine.context_managers import switch_db
import pkg_resources
import appraisal.components.sample_data

from pyramid.paster import (
    get_appsettings,
    setup_logging,
)


def main():
    # setup_logging(config_uri)

    if len(sys.argv) < 3:
        print("You did not provide enough arguments for this command. Command is: appraisal_load_sample_data <environment config> <auth0 owner id>")
        return

    config_uri = sys.argv[1]
    newOwner = sys.argv[2]

    settings = get_appsettings(config_uri)

    sampleDataDBName = "swiftly_sample_data"
    sampleDataURI = settings.get('db.uri').replace(f"swiftly_{settings.get('environment')}", "swiftly_sample_data")
    sampleDataBucket = 'swiftly-sample-files'

    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = pkg_resources.resource_filename("appraisal", "gcloud-storage-key.json")

    azureBlobStorage = BlockBlobService(account_name=settings['storage.azureBucket'], account_key=settings['storage.azureAccountKey'])
    storage_client = storage.Client()
    sampleStorageBucket = storage_client.get_bucket(sampleDataBucket)

    connect(db=sampleDataDBName, host=sampleDataURI)

    print("Connected to sample db, loading objects")

    data = appraisal.components.sample_data.downloadData(sampleStorageBucket, azureBlobStorage)

    storageBucket = storage_client.get_bucket(settings['storage.bucket'])
    register_connection("target", db=settings.get('db.name'), host=settings.get('db.uri'))

    print("Connected to environment db, saving objects")
    appraisal.components.sample_data.uploadData(data, 'target', storageBucket, newOwner, 'sample', settings['environment'])




