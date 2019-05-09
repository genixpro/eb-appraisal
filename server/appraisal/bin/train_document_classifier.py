from appraisal.components.document_classifier import DocumentClassifier
import bz2
import sys
import os
import pkg_resources

from pyramid.config import Configurator
from pprint import pprint
from pymongo import MongoClient
import gridfs
import pickle
from mongoengine import connect

from pyramid.paster import (
    get_appsettings,
    setup_logging,
)


def main():
    # setup_logging(config_uri)
    config_uri = [part for part in sys.argv if '.ini' in part][0]
    settings = get_appsettings(config_uri)

    db = MongoClient(settings.get('db.uri'))[settings.get('db.name')]

    connect('appraisal', host=settings.get('db.uri'))

    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = pkg_resources.resource_filename("appraisal", "gcloud-storage-key.json")

    classifier = DocumentClassifier()
    classifier.trainAlgorithm(db)

